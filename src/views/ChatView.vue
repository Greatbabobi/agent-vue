<template>
  <div class="chat-layout">
    <Sidebar class="sidebar" />
    <div class="main-area">
      <ChatWindow />
      <InputBar @send="handleSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import InputBar from '@/components/InputBar.vue'
import { useChat } from '@/composables/useChat'

const { send } = useChat()

function handleSend(content: string) {
  send(content)
}
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}
</style>
