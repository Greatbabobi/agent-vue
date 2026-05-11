<template>
  <div class="input-bar">
    <el-input
      v-model="inputText"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 5 }"
      placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
      :disabled="isStreaming"
      resize="none"
      @keydown.enter.exact.prevent="handleSend"
    />
    <el-button
      type="primary"
      :loading="isStreaming"
      :disabled="!inputText.trim() || isStreaming"
      @click="handleSend"
    >
      发送
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'

const emit = defineEmits<{
  send: [content: string]
}>()

const { isStreaming } = storeToRefs(useChatStore())
const inputText = ref('')

function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return
  emit('send', text)
  inputText.value = ''
}
</script>

<style scoped>
.input-bar {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 12px 16px;
}

.input-bar .el-textarea {
  flex: 1;
}

.input-bar .el-button {
  flex-shrink: 0;
  height: 36px;
}
</style>
