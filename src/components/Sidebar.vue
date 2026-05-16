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

    <div class="sidebar-footer">
      <el-button
        type="primary"
        :icon="Setting"
        class="settings-btn"
        @click="settingsVisible = true"
      >
        设置
      </el-button>
    </div>

    <el-dialog
      v-model="settingsVisible"
      title="设置"
      width="420px"
      align-center
      append-to-body
      modal-class="settings-modal-overlay"
      class="settings-dialog"
    >
      <div class="settings-panel">
        <div class="settings-row">
          <span class="settings-label">应用名称</span>
          <span class="settings-value">{{ appTitle }}</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">接口模式</span>
          <el-tag type="primary" effect="light">{{ apiModeLabel }}</el-tag>
        </div>
        <div class="settings-row">
          <span class="settings-label">主题颜色</span>
          <span class="settings-color">
            <span class="settings-color-dot" />
            蓝色
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Delete, Setting } from '@element-plus/icons-vue'
import { useConversation } from '@/composables/useConversation'

const { conversations, activeConversationId, createNew, switchTo, deleteById } =
  useConversation()

const settingsVisible = ref(false)
const appTitle = import.meta.env.VITE_APP_TITLE || 'Agent Vue'
const apiModeLabel = computed(() =>
  import.meta.env.VITE_USE_MOCK !== 'false' ? 'Mock 模式' : '真实接口'
)
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

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--el-border-color);
}

.settings-btn {
  width: 100%;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.settings-value,
.settings-color {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.settings-color {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.settings-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

:global(.settings-modal-overlay) {
  background-color: var(--el-overlay-color-lighter);
  backdrop-filter: blur(6px);
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
