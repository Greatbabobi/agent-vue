<template>
  <div class="chat-window" ref="windowRef">
    <div v-if="!activeConversation" class="empty-state">
      <el-empty description="点击「新建对话」开始聊天" :image-size="120" />
    </div>

    <template v-else>
      <div v-if="activeConversation.messages.length === 0" class="empty-state">
        <el-empty description="发送第一条消息开始对话" :image-size="120" />
      </div>

      <MessageBubble
        v-for="msg in activeConversation.messages"
        :key="msg.id"
        :message="msg"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import MessageBubble from './MessageBubble.vue'

const store = useChatStore()
const { activeConversation } = storeToRefs(store)

const windowRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (windowRef.value) {
      windowRef.value.scrollTop = windowRef.value.scrollHeight
    }
  })
}

// Auto-scroll when messages change or content updates during streaming
watch(
  () => activeConversation.value?.messages?.map(m => m.content).join(''),
  () => scrollToBottom(),
  { flush: 'post' },
)
</script>

<style scoped>
.chat-window {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}
</style>
