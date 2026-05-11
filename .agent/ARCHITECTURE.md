# 项目架构说明

## 目录结构

```
src/
├── api/             # API 层：流式通信实现
│   ├── chat.ts      # 真实 SSE（fetch + ReadableStream）
│   └── mock.ts      # Mock SSE（setInterval 模拟）
├── composables/     # 可复用组合式函数
│   ├── useChat.ts       # 消息发送 + 流式处理
│   └── useConversation.ts # 会话 CRUD
├── stores/
│   └── chat.ts      # Pinia 全局状态 + localStorage 持久化
├── components/
│   ├── Sidebar.vue       # 左侧历史列表
│   ├── ChatWindow.vue    # 右侧消息区
│   ├── MessageBubble.vue # 单条消息（含 Markdown）
│   └── InputBar.vue      # 输入框 + 发送
├── types/
│   └── index.ts     # Message, Conversation 接口
└── views/
    └── ChatView.vue # 主页面布局
```

## 数据流

```
用户输入
  → InputBar (emit: send)
  → ChatView.handleSend
  → useChat.send(content)
    → store.appendMessage(userMsg)
    → store.appendMessage(assistantMsg, streaming: true)
    → import api/mock.ts 或 api/chat.ts（由 VITE_USE_MOCK 决定）
    → streamChat(messages, onChunk, onDone, onError)
      → onChunk: store.updateLastAssistantMessage(chunk)
      → onDone:  store.finalizeLastAssistantMessage()
                 store.saveToStorage()
```

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_USE_MOCK` | `true` 使用 mock，`false` 使用真实 SSE | `true` |
| `VITE_API_BASE_URL` | 后端地址（mock 时忽略） | `http://localhost:3000` |
| `VITE_APP_TITLE` | 页面标题 | `Agent Vue` |

## 接入真实后端

1. 将 `.env` 中 `VITE_USE_MOCK` 改为 `false`
2. 将 `VITE_API_BASE_URL` 设置为后端地址
3. 后端需遵循 `.agent/API_CONTRACT.md` 中的 SSE 接口约定
