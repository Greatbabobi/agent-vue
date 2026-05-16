<template>
  <div class="chat-page">
    <header class="top-menu" aria-label="目录">
      <span class="top-menu-title">目录</span>
      <nav class="top-menu-items">
        <el-button
          v-for="item in menuItems"
          :key="item"
          type="primary"
          class="menu-btn"
        >
          {{ item }}
        </el-button>
      </nav>
    </header>

    <div class="chat-layout">
      <Sidebar class="sidebar" />
      <div class="main-area">
        <ChatWindow />
        <InputBar @send="handleSend" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import InputBar from '@/components/InputBar.vue'
import { useChat } from '@/composables/useChat'

const { send } = useChat()
const menuItems = ['对话', '练习', '个人中心'] as const

function handleSend(content: string) {
  send(content)
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color);
}

.top-menu {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.top-menu-title {
  flex-shrink: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.top-menu-items {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.menu-btn {
  min-width: 88px;
}

.chat-layout {
  display: flex;
  flex: 1;
  min-height: 0;
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
  background: var(--el-bg-color);
}
</style>
