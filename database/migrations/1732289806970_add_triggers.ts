import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'add_triggers'

  async up() {
    this.schema.raw(`
    CREATE OR REPLACE TRIGGER update_subscriptions_on_plan_change
        AFTER UPDATE ON subscription_plans
        FOR EACH ROW
        EXECUTE FUNCTION update_account_subscriptions();

    CREATE OR REPLACE TRIGGER create_profile_trigger
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_profile_for_new_user();

    -- Trigger to automatically update profile aggregates
    create or replace trigger update_profile_aggregates_trigger
        after insert or update or delete on posts
        for each row
        execute function calculate_profile_aggregates();

    create or replace trigger update_profile_aggregates_trigger
        after insert or update or delete on comments
        for each row
        execute function calculate_profile_aggregates();

    -- Create the trigger to automatically update post aggregates
    CREATE OR REPLACE TRIGGER update_post_aggregates_trigger
        AFTER INSERT OR UPDATE OR DELETE ON post_likes
        FOR EACH ROW
        EXECUTE FUNCTION calculate_post_aggregates();

    CREATE OR REPLACE TRIGGER update_post_aggregates_trigger
        AFTER INSERT OR UPDATE OR DELETE ON comments
        FOR EACH ROW
        EXECUTE FUNCTION calculate_post_aggregates();

    create or replace trigger update_comment_aggregates_trigger_on_like
        after insert or update or delete on comment_likes
        for each row
        execute function calculate_comment_aggregates();

    create or replace trigger update_comment_aggregates_trigger_on_comments
        after insert or update or delete on comments
        for each row
        execute function calculate_comment_aggregates();
    `)
  }

  async down() {
    this.schema.raw(`
    drop trigger if exists update_subscriptions_on_plan_change on subscription_plans;
    drop trigger if exists create_profile_trigger on users;
    drop trigger if exists update_post_aggregates_trigger on post_likes;
    drop trigger if exists update_post_aggregates_trigger on comments;
    drop trigger if exists update_comment_aggregates_trigger_on_comments on comments;
    drop trigger if exists update_comment_aggregates_trigger_on_like on comment_likes;
    drop trigger if exists update_profile_aggregates_trigger on posts;
    drop trigger if exists update_profile_aggregates_trigger on comments;
    `)
  }
}

