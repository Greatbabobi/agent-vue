import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'

export function useConversation() {
  const store = useChatStore()
  const { conversations, activeConversationId, activeConversation } = storeToRefs(store)

  return {
    conversations,
    activeConversationId,
    activeConversation,
    createNew: () => store.createConversation(),
    switchTo: (id: string) => store.switchConversation(id),
    deleteById: (id: string) => store.deleteConversation(id),
  }
}
