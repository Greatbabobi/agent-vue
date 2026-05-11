import { useChatStore } from '@/stores/chat'
import type { Message } from '@/types'

// Evaluated at build time by Vite — controls which module is imported
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export function useChat() {
  const store = useChatStore()
  let cancelStream: (() => void) | null = null

  async function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || store.isStreaming) return

    // Ensure there is an active conversation
    if (!store.activeConversationId) {
      store.createConversation()
    }
    const convId = store.activeConversationId!

    // 1. Append user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    store.appendMessage(convId, userMsg)

    // 2. Append empty assistant placeholder (streaming: true)
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }
    store.appendMessage(convId, assistantMsg)
    store.setStreaming(true)

    // 3. Load appropriate API module
    const { streamChat } = USE_MOCK
      ? await import('@/api/mock')
      : await import('@/api/chat')

    // 4. Build history: all non-streaming messages (excludes the empty placeholder)
    const historyMessages = (store.activeConversation?.messages ?? []).filter(
      m => !m.streaming,
    )

    cancelStream = streamChat(
      historyMessages,
      chunk => store.updateLastAssistantMessage(convId, chunk),
      () => {
        store.finalizeLastAssistantMessage(convId)
        cancelStream = null
      },
      err => {
        console.error('[useChat] stream error:', err)
        store.finalizeLastAssistantMessage(convId)
        cancelStream = null
      },
      convId, // pass real conversation ID so server can maintain session
    )
  }

  function cancel() {
    cancelStream?.()
    cancelStream = null
    // finalize the in-progress message so it doesn't remain in streaming state
    if (store.activeConversationId) {
      store.finalizeLastAssistantMessage(store.activeConversationId)
    }
  }

  return { send, cancel }
}
