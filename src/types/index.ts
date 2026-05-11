export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean // true while SSE chunks are still arriving
}

export interface Conversation {
  id: string
  title: string       // auto-set from first user message (20 chars)
  messages: Message[]
  createdAt: number
  updatedAt: number
}
