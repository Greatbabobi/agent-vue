<template>
  <div class="message-bubble" :class="message.role">
    <div class="bubble-avatar">
      <el-avatar v-if="message.role === 'assistant'" :size="32" class="avatar-ai">AI</el-avatar>
      <el-avatar v-else :size="32" class="avatar-user">You</el-avatar>
    </div>
    <div class="bubble-body">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="bubble-content" v-html="renderedContent" />
      <span v-if="message.streaming" class="streaming-cursor">▋</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { Message } from '@/types'

const props = defineProps<{ message: Message }>()

const renderedContent = computed(() => {
  if (props.message.role === 'assistant') {
    // marked.parse returns string; content is AI-generated (trusted source)
    return marked.parse(props.message.content || '&nbsp;') as string
  }
  // User messages: preserve line breaks, escape HTML
  return props.message.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
})
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  align-items: flex-start;
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.bubble-body {
  max-width: 70%;
  position: relative;
}

.bubble-content {
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.message-bubble.user .bubble-content {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-bubble.assistant .bubble-content {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

/* Markdown styles inside assistant bubble */
.message-bubble.assistant .bubble-content :deep(p) { margin: 0 0 8px; }
.message-bubble.assistant .bubble-content :deep(p:last-child) { margin-bottom: 0; }
.message-bubble.assistant .bubble-content :deep(code) {
  background: #e0e0e0;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 13px;
}
.message-bubble.assistant .bubble-content :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}
.message-bubble.assistant .bubble-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}
.message-bubble.assistant .bubble-content :deep(ul),
.message-bubble.assistant .bubble-content :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}

.avatar-ai {
  background: var(--el-color-primary);
  flex-shrink: 0;
}

.avatar-user {
  background: #888;
  flex-shrink: 0;
}

.streaming-cursor {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  font-size: 16px;
  color: var(--el-color-primary);
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
