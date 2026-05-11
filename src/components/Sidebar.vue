<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <el-button type="primary" :icon="Plus" class="new-btn" @click="createNew">
        新建对话
      </el-button>
    </div>

    <el-scrollbar class="sidebar-list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conv-item"
        :class="{ active: conv.id === activeConversationId }"
        @click="switchTo(conv.id)"
      >
        <span class="conv-title">{{ conv.title }}</span>
        <el-button
          class="delete-btn"
          :icon="Delete"
          size="small"
          text
          @click.stop="deleteById(conv.id)"
        />
      </div>

      <div v-if="conversations.length === 0" class="empty-hint">
        暂无对话记录
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete } from '@element-plus/icons-vue'
import { useConversation } from '@/composables/useConversation'

const { conversations, activeConversationId, createNew, switchTo, deleteById } =
  useConversation()
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.new-btn {
  width: 100%;
}

.sidebar-list {
  flex: 1;
}

.conv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin: 4px 8px;
  transition: background 0.15s;
}

.conv-item:hover {
  background: #e8e8e8;
}

.conv-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.conv-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.delete-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.conv-item:hover .delete-btn {
  opacity: 1;
}

.empty-hint {
  padding: 24px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>
