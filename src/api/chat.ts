import type { Message } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function streamChat(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  conversationId?: string, // passed from the store so the server maintains session continuity
): () => void {
  const controller = new AbortController()

  fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversationId ?? crypto.randomUUID(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { onDone(); return }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.chunk) onChunk(parsed.chunk)
          } catch {
            // skip malformed lines
          }
        }
      }
      onDone()
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err)
    })

  return () => controller.abort()
}
