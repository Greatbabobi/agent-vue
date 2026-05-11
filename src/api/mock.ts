import type { Message } from '@/types'

const MOCK_RESPONSES = [
  `你好！我是 Agent Vue，一个基于 Vue 3 构建的 AI 对话助手。

当前运行在 **Mock 模式**下，回复为预设数据。设置 \`VITE_USE_MOCK=false\` 并配置 \`VITE_API_BASE_URL\` 即可接入真实后端。

**已实现功能：**
- 🌊 流式输出（打字机效果）
- 📝 历史记录（localStorage 持久化）
- ➕ 新建对话
- 🔄 Mock / 真实接口切换`,

  `这是一个模拟的流式输出响应。

在真实环境中，每个 token 通过 **SSE（Server-Sent Events）** 逐步推送到前端，前端拼接后实时渲染。

\`\`\`typescript
// 接口约定
interface StreamChunk {
  chunk: string  // 每次推送的文本片段
}
\`\`\``,

  `收到你的消息了！作为 AI 助手，我会尽力提供准确的回答。

> ⚠️ 当前为 Mock 模式，回复内容为预设数据，不代表真实 AI 推理结果。

如需接入真实后端，请参考 \`.agent/API_CONTRACT.md\` 中的接口约定。`,
]

export function streamChat(
  _messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  _onError: (error: Error) => void,
  _conversationId?: string, // unused in mock, matches shared interface with chat.ts
): () => void {
  const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  const chars = response.split('')
  let index = 0
  let cancelled = false
  let timerId: ReturnType<typeof setTimeout>

  const tick = () => {
    if (cancelled) return
    if (index >= chars.length) {
      onDone()
      return
    }
    // Emit 1–3 chars per tick for a natural typing feel
    const batchSize = Math.floor(Math.random() * 3) + 1
    onChunk(chars.slice(index, index + batchSize).join(''))
    index += batchSize
    timerId = setTimeout(tick, 30 + Math.random() * 50)
  }

  timerId = setTimeout(tick, 300) // initial delay before response starts

  return () => {
    cancelled = true
    clearTimeout(timerId)
  }
}
