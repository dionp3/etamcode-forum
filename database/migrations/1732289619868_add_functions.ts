import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'add_functions'

  async up() {
    this.schema.raw(`
       -- Create min function for two integers
       create or replace function min(a bigint, b bigint) returns bigint as $$
       begin
       if a < b then
         return a;
       else
         return b;
       end if;
       end;
       $$ language plpgsql;

       -- Create max function for two integers
       create or replace function max(a bigint, b bigint) returns bigint as $$
       begin
       if a > b then
         return a;
       else
         return b;
       end if;
       end;
       $$ language plpgsql;
       -- Create or replace function to calculate post aggregates
       CREATE OR REPLACE FUNCTION calculate_post_aggregates()
       RETURNS TRIGGER AS $$
       BEGIN
       INSERT INTO post_aggregates (post_id, creator_id, upvotes, downvotes, comments)
       SELECT
       p.id,
       p.poster_id,
       COUNT(CASE WHEN pl.score > 0 THEN 1 END) as upvotes,
       COUNT(CASE WHEN pl.score < 0 THEN 1 END) as downvotes,
       count(c.id) as comments
       FROM posts p
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       left join comments c on p.id = c.post_id OR c.parent_comment_id = ANY(ARRAY[p.id])
       WHERE p.id = COALESCE(NEW.post_id, OLD.post_id)
       GROUP BY p.id, p.poster_id
       ON CONFLICT (post_id, creator_id) DO UPDATE
       SET
       upvotes = EXCLUDED.upvotes,
       downvotes = EXCLUDED.downvotes,
       comments = EXCLUDED.comments,
       updated_at = NOW();
       RETURN NULL;
       END;
       $$ LANGUAGE plpgsql;
       create or replace function calculate_comment_aggregates() returns trigger as $$
       declare
       comment_creator_id integer;
       parent_id integer;
       begin
       -- For insert/update/delete on comment_likes table
       if TG_TABLE_NAME = 'comment_likes' then
       if TG_OP = 'DELETE' then
       -- Get creator_id for this comment
       select creator_id into comment_creator_id from comments where id = OLD.comment_id;

       -- Update aggregates
       update comment_aggregates
       set score = score - OLD.score,
       upvotes = upvotes - case when OLD.score > 0 then 1 else 0 end,
       downvotes = downvotes - case when OLD.score < 0 then 1 else 0 end,
       updated_at = now(),
       -- Update ranks
       hot_rank = (sign(score + 1) * power(abs(score + 1), 0.8) / power(extract(epoch from now() - created_at) + 2, 1.8)),
       controversy_rank = case
       when upvotes + downvotes = 0 then 0
       else power(upvotes + downvotes, 0.8) * min(upvotes, downvotes) / max(upvotes, downvotes)
       end
       where comment_id = OLD.comment_id and creator_id = comment_creator_id;

       elsif TG_OP = 'INSERT' then
       -- Get creator_id for this comment
       select creator_id into comment_creator_id from comments where id = NEW.comment_id;

       -- Insert or update aggregates
       insert into comment_aggregates (
       comment_id,
       creator_id,
       score,
       upvotes,
       downvotes,
       hot_rank,
       controversy_rank
       )
       values (
       NEW.comment_id,
       comment_creator_id,
       NEW.score,
       case when NEW.score > 0 then 1 else 0 end,
       case when NEW.score < 0 then 1 else 0 end,
       (sign(NEW.score) * power(abs(NEW.score), 0.8) / power(extract(epoch from now() - now()) + 2, 1.8)),
       0
       )
       on conflict (comment_id, creator_id) do update
       set score = comment_aggregates.score + NEW.score,
       upvotes = comment_aggregates.upvotes + case when NEW.score > 0 then 1 else 0 end,
       downvotes = comment_aggregates.downvotes + case when NEW.score < 0 then 1 else 0 end,
       updated_at = now(),
       hot_rank = (sign(comment_aggregates.score + NEW.score) *
         power(abs(comment_aggregates.score + NEW.score), 0.8) /
         power(extract(epoch from now() - comment_aggregates.created_at) + 2, 1.8)),
       controversy_rank = case
       when comment_aggregates.upvotes + comment_aggregates.downvotes + 1 = 0 then 0
       else power(comment_aggregates.upvotes + comment_aggregates.downvotes + 1, 0.8) *
        min(comment_aggregates.upvotes + case when NEW.score > 0 then 1 else 0 end,
            comment_aggregates.downvotes + case when NEW.score < 0 then 1 else 0 end) /
        max(comment_aggregates.upvotes + case when NEW.score > 0 then 1 else 0 end,
            comment_aggregates.downvotes + case when NEW.score < 0 then 1 else 0 end)
       end;
       end if;

       -- For insert/update/delete on comments table
       elsif TG_TABLE_NAME = 'comments' then
       if TG_OP = 'DELETE' then
       -- Decrease child_count for parent comment if exists
       if OLD.parent_comment_id is not null then
       update comment_aggregates
       set child_count = child_count - 1,
       updated_at = now()
       where comment_id = OLD.parent_comment_id;
       end if;

       -- Delete the aggregate row
       delete from comment_aggregates where comment_id = OLD.id;

       elsif TG_OP = 'INSERT' then
       -- Create initial aggregate row
       insert into comment_aggregates (
       comment_id,
       creator_id,
       score,
       upvotes,
       downvotes,
       child_count
       )
       values (
       NEW.id,
       NEW.creator_id,
       0,
       0,
       0,
       0
       );

       -- Increase child_count for parent comment if exists
       if NEW.parent_comment_id is not null then
       insert into comment_aggregates (
       comment_id,
       creator_id,
       child_count
       )
       select
       NEW.parent_comment_id,
       creator_id,
       1
       from comments where id = NEW.parent_comment_id
       on conflict (comment_id, creator_id) do update
       set child_count = comment_aggregates.child_count + 1,
       updated_at = now();
       end if;

       elsif TG_OP = 'UPDATE' then
       -- If parent_comment_id changed, update child_counts
       if OLD.parent_comment_id is distinct from NEW.parent_comment_id then
       -- Decrease count for old parent
       if OLD.parent_comment_id is not null then
       update comment_aggregates
       set child_count = child_count - 1,
       updated_at = now()
       where comment_id = OLD.parent_comment_id;
       end if;

       -- Increase count for new parent
       if NEW.parent_comment_id is not null then
       update comment_aggregates
       set child_count = child_count + 1,
       updated_at = now()
       where comment_id = NEW.parent_comment_id;
       end if;
       end if;
       end if;
       end if;

       return null;
       end;
       $$ language plpgsql;

       create or replace function calculate_profile_aggregates() returns trigger as $$
       begin
       if TG_TABLE_NAME = 'posts' then
       if TG_OP = 'INSERT' then
       insert into profile_aggregates (profile_id, post_count)
       values (NEW.poster_id, 1)
       on conflict (profile_id) do update
       set post_count = profile_aggregates.post_count + 1;
       elsif TG_OP = 'DELETE' then
       update profile_aggregates
       set post_count = post_count - 1
       where profile_id = OLD.poster_id;
       end if;
       elsif TG_TABLE_NAME = 'comments' then
       if TG_OP = 'INSERT' then
       insert into profile_aggregates (profile_id, comment_count)
       values (NEW.creator_id, 1)
       on conflict (profile_id) do update
       set comment_count = profile_aggregates.comment_count + 1;
       elsif TG_OP = 'DELETE' then
       update profile_aggregates
       set comment_count = comment_count - 1
       where profile_id = OLD.creator_id;
       end if;
       end if;

       return null;
       end;
       $$ language plpgsql;
       -- Create or replace function for voting
       CREATE OR REPLACE FUNCTION vote_post(_post_id INTEGER, _profile_id INTEGER, _score INTEGER)
       RETURNS VOID AS $$
       BEGIN
       INSERT INTO post_likes (post_id, profile_id, score)
       VALUES (_post_id, _profile_id, _score)
       ON CONFLICT (post_id, profile_id)
       DO UPDATE SET score = _score, created_at = NOW();

       IF _score = 0 THEN
       DELETE FROM post_likes
       WHERE post_id = _post_id AND profile_id = _profile_id;
       END IF;
       END;
       $$ LANGUAGE plpgsql;

       -- Function to handle comment votes
       CREATE OR REPLACE FUNCTION vote_comment(
       _comment_id INTEGER,
       _profile_id INTEGER,
       _score INTEGER
       ) RETURNS VOID AS $$
       BEGIN
       INSERT INTO comment_likes (comment_id, profile_id, post_id, score)
       VALUES (_comment_id, _profile_id, (SELECT post_id FROM comments WHERE id = _comment_id), _score)
       ON CONFLICT (comment_id, profile_id, post_id)
       DO UPDATE SET score = _score, created_at = NOW();

       IF _score = 0 THEN
       DELETE FROM comment_likes
       WHERE comment_id = _comment_id AND profile_id = _profile_id;
       END IF;
       END;
       $$ LANGUAGE plpgsql;

       -- Calculate hot rank for comment aggregates
       create or replace function calculate_hot_rank(comment_id integer)
       returns double precision as $$
       declare
       comment_age double precision;
       score bigint;
       begin
       -- Get the age of the comment in seconds
       select extract(epoch from (now() - c.created_at)) into comment_age
       from comments c
       where c.id = comment_id;
       -- Get the score of the comment
       select coalesce(sum(score), 0) into score
       from comment_likes
       where comment_id = comment_id;
       -- Example hot rank formula: score divided by age
       return score / greatest(comment_age, 1); -- avoid division by zero
       end;
       $$ language plpgsql;

       -- Controversy rank based on the difference between upvotes and downvotes
       create or replace function calculate_controversy_rank(comment_id integer)
       returns double precision as $$
       declare
       upvotes bigint;
       downvotes bigint;
       begin
       -- Get upvotes and downvotes
       select coalesce(count(*), 0) into upvotes
       from comment_likes
       where comment_id = comment_id and score > 0;
       select coalesce(count(*), 0) into downvotes
       from comment_likes
       where comment_id = comment_id and score < 0;
       -- Example controversy rank formula: the product of upvotes and downvotes
       return upvotes * downvotes;
       end;
       $$ language plpgsql;

       -- Function to calculate user reputation
       CREATE OR REPLACE FUNCTION calculate_user_reputation(p_user_id INT)
       RETURNS INT
       LANGUAGE plpgsql
       AS $$
       DECLARE
       reputation INT;
       BEGIN
       SELECT
       (SELECT COUNT(*) FROM posts WHERE poster_id = p_user_id) * 10 +
       (SELECT COUNT(*) FROM comments WHERE creator_id = p_user_id) * 5
       INTO reputation;
       RETURN reputation;
       END;
       $$;

       -- Function to get total posts by a user
       CREATE OR REPLACE FUNCTION get_user_post_count(p_user_id INT)
       RETURNS INT
       LANGUAGE plpgsql
       AS $$
       DECLARE
       post_count INT;
       BEGIN
       SELECT COUNT(*) INTO post_count
       FROM posts
       WHERE poster_id = p_user_id AND NOT is_removed;
       RETURN post_count;
       END;
       $$;

       -- Function to get total comments by a user
       CREATE OR REPLACE FUNCTION get_user_comment_count(p_user_id INT)
       RETURNS INT
       LANGUAGE plpgsql
       AS $$
       DECLARE
       comment_count INT;
       BEGIN
       SELECT COUNT(*) INTO comment_count
       FROM comments
       WHERE creator_id = p_user_id AND NOT is_removed;
       RETURN comment_count;
       END;
       $$;
      CREATE OR REPLACE FUNCTION get_comment_tree(input_post_id INT)
      RETURNS TABLE (
          id INT,
          post_id INT,
          parent_comment_id INT,
          content varchar,
          created_at TIMESTAMPTZ,
          depth INT,
          path INT[]
      ) AS $$
      BEGIN
          RETURN QUERY
          WITH RECURSIVE comment_tree AS (
              -- Base case: top-level comments
              SELECT c.id, c.post_id, c.parent_comment_id, c.content, c.created_at, 0 AS depth, ARRAY[c.id] AS path
              FROM comments c
              WHERE c.post_id = input_post_id AND c.parent_comment_id IS NULL

              UNION ALL

              -- Recursive case: replies to comments
              SELECT c.id, c.post_id, c.parent_comment_id, c.content, c.created_at, ct.depth + 1, ct.path || c.id
              FROM comments c
              JOIN comment_tree ct ON c.parent_comment_id = ct.id
          )
          SELECT * FROM comment_tree
          ORDER BY path;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION update_account_subscriptions()
      RETURNS TRIGGER AS $$
      BEGIN
          IF NEW.duration_days != OLD.duration_days THEN
              UPDATE account_subscriptions
              SET end_date = start_date + (NEW.duration_days || ' days')::interval
              WHERE plan_id = NEW.id AND is_active = true;
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION create_profile_for_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO profiles (user_id, created_at)
          VALUES (NEW.id, NOW());
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
  }

  async down() {
    this.schema.raw(`
      drop function if exists min() cascade;
      drop function if exists max() cascade;
      drop function if exists calculate_profile_aggregates() cascade;
      drop function if exists calculate_post_aggregates() cascade;
      drop function if exists vote_post() cascade;
      drop function if exists calculate_comment_aggregates() cascade;
      drop function if exists vote_comment() cascade;
      drop function if exists calculate_user_reputation() cascade;
      drop function if exists get_user_post_count() cascade;
      drop function if exists get_user_comment_count() cascade;
      drop function if exists get_comment_tree(INT) cascade;
      drop function if exists update_account_subscriptions();
      drop function if exists create_profile_for_new_user();
      `)
  }
}
