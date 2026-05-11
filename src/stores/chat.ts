import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conversation, Message } from '@/types'

const STORAGE_KEY = 'agent-vue:conversations'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const isStreaming = ref(false)

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) ?? null
  )

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) conversations.value = JSON.parse(raw)
      if (conversations.value.length > 0) {
        activeConversationId.value = conversations.value[0].id
      }
    } catch {
      conversations.value = []
    }
  }

  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value))
  }

  function createConversation(): Conversation {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    conversations.value.unshift(conv)
    activeConversationId.value = conv.id
    saveToStorage()
    return conv
  }

  function switchConversation(id: string) {
    activeConversationId.value = id
  }

  function deleteConversation(id: string) {
    const idx = conversations.value.findIndex(c => c.id === id)
    if (idx === -1) return
    conversations.value.splice(idx, 1)
    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null
    }
    saveToStorage()
  }

  function appendMessage(conversationId: string, message: Message) {
    const conv = conversations.value.find(c => c.id === conversationId)
    if (!conv) return
    conv.messages.push(message)
    conv.updatedAt = Date.now()
    // Auto-title: use first 20 chars of first user message
    if (conv.title === '新对话' && message.role === 'user') {
      conv.title = message.content.slice(0, 20)
    }
  }

  function updateLastAssistantMessage(conversationId: string, chunk: string) {
    const conv = conversations.value.find(c => c.id === conversationId)
    if (!conv) return
    const last = conv.messages[conv.messages.length - 1]
    if (last?.role === 'assistant') {
      last.content += chunk
    }
  }

  function finalizeLastAssistantMessage(conversationId: string) {
    const conv = conversations.value.find(c => c.id === conversationId)
    if (!conv) return
    const last = conv.messages[conv.messages.length - 1]
    if (last?.role === 'assistant') {
      last.streaming = false
    }
    isStreaming.value = false
    saveToStorage()
  }

  function setStreaming(value: boolean) {
    isStreaming.value = value
  }

  return {
    conversations,
    activeConversationId,
    isStreaming,
    activeConversation,
    loadFromStorage,
    saveToStorage,
    createConversation,
    switchConversation,
    deleteConversation,
    appendMessage,
    updateLastAssistantMessage,
    finalizeLastAssistantMessage,
    setStreaming,
  }
})
