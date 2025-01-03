<script setup lang="ts">
import { ref } from 'vue'
const Rules = ref([
  {
    rules: 'Please follow etamcode forum site-wide rules',
    describe: `Please report any offending comments for moderator review. Remember the human! To avoid doxxing, don't forget to censor any personal information before you hit the submit button!`,
  },
  {
    rules: 'No repost and spam',
    describe: `Unless it’s a question-type post and the answers in previous post have lost their relevance. OPs are expected to do a search or check for repost first before posting.`,
  },
  {
    rules: 'No self-promotion/advertisement',
    describe: ` Advertisement includes, but not limited to: promoting YouTube channel or Discord room invitation, SEO posts or comments, business or gambling sites promotion, etc. Violators may receive a warning, temporary ban, or a permanent ban. Accounts created solely for this purpose will always receive a permanent ban. \n 
     Users who engage in excessive self-promotion may also receive a similar warning or ban upon violation.`,
  },
  {
    rules: ' DO NOT editorialise news headline ',
    describe: `Please put the original linked news headline with the exact same title. If it is a news video, use the title of the video. Posts that violate this rule will be removed. Once removed, feel free to repost it with the original title.`,
  },
  {
    rules: ' Put relevant flair/NSFW or spoiler tag on posts',
    describe: `

Please use appropriate flair and don't forget to mark NSFW or spoiler posts with the NSFW and spoiler tag. Please obey the rules with regards to the flair usage as well.`,
  },
])
</script>

<template>
  <div class="w-full p-2 border border-primary rounded-lg">
    <h2 class="font-bold text-xl mb-2">Rules</h2>
    <div class="flex flex-col gap-4">
      <div v-for="(rule, index) in Rules" :key="index">
        <div class="collapse collapse-arrow hover:bg-neutral hover:text-neutral-content">
          <input type="radio" name="my-accordion-3" checked="checked" />
          <div class="collapse-title font-semibold">{{ rule.rules }}</div>
          <div class="collapse-content">
            <p class="">{{ rule.describe }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
