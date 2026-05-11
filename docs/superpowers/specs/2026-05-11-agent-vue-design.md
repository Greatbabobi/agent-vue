# Agent Vue — 设计文档

**日期**: 2026-05-11  
**状态**: 已确认

---

## 1. 项目概述

构建一个 Vue 3 前端项目，作为 AI Agent 的对话界面。界面风格参考 ChatGPT（左侧历史记录列表 + 右侧对话区），支持流式输出、Mock 数据、历史记录、新建对话等功能，并在项目根目录维护 Agent 规范文件，便于后续开发和接入真实后端。

---

## 2. 技术栈

| 层次 | 选型 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 流式通信 | SSE（Server-Sent Events） |
| 历史存储 | localStorage |

---

## 3. 项目结构

```
agent-vue/
├── .agent/                        ← Agent 规范目录（不参与构建）
│   ├── AGENT_RULES.md             ← Agent 行为规范
│   ├── ARCHITECTURE.md            ← 项目架构说明
│   └── API_CONTRACT.md            ← 后端 API 接口约定
│
├── docs/
│   └── superpowers/
│       └── specs/                 ← 设计文档存放
│
├── src/
│   ├── api/                       ← API 层（SSE 请求 + mock 切换）
│   │   ├── chat.ts                ← 真实 SSE 请求实现
│   │   └── mock.ts                ← Mock 流式数据（逐 token 模拟）
│   ├── composables/               ← 可复用逻辑
│   │   ├── useChat.ts             ← 核心对话逻辑（流式处理入口）
│   │   └── useConversation.ts     ← 历史记录管理
│   ├── stores/
│   │   └── chat.ts                ← Pinia store（全局会话状态）
│   ├── components/
│   │   ├── Sidebar.vue            ← 左侧历史记录列表
│   │   ├── ChatWindow.vue         ← 右侧对话消息区
│   │   ├── MessageBubble.vue      ← 单条消息气泡（支持 Markdown）
│   │   └── InputBar.vue           ← 输入框 + 发送按钮
│   ├── types/
│   │   └── index.ts               ← 全局 TypeScript 类型定义
│   ├── views/
│   │   └── ChatView.vue           ← 主页面布局
│   ├── router/
│   │   └── index.ts               ← Vue Router 配置
│   ├── App.vue
│   └── main.ts
│
├── .gitignore                     ← 含常用排除项
├── .env                           ← 环境变量（VITE_USE_MOCK 等）
├── .env.example                   ← 环境变量示例
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 核心功能设计

### 4.1 流式输出

- **环境切换**: 通过 `VITE_USE_MOCK=true/false` 控制使用 mock 还是真实 SSE
- **Mock 实现** (`src/api/mock.ts`): 使用 `setInterval` 逐 token 输出预设文本，模拟 SSE chunk 推送，延迟 30–80ms/token
- **真实 SSE** (`src/api/chat.ts`): 使用 `fetch + ReadableStream`，解析 `data: {"chunk":"..."}` 格式；收到 `data: [DONE]` 时触发 `onDone` 回调
- **统一接口**: 两者暴露相同的 `streamChat(messages, onChunk, onDone, onError)` 函数，composable 层无需关心底层实现

### 4.2 历史记录

**存储结构** (localStorage key: `agent-vue:conversations`):
```typescript
interface Conversation {
  id: string           // UUID
  title: string        // 自动取首条消息前 20 字
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean    // true 表示当前消息正在流式输出中
}
```

**`useConversation.ts`** 提供:
- `createNew()` — 创建新会话，生成 UUID，清空消息区
- `switchTo(id)` — 切换到指定会话，侧边栏高亮
- `deleteById(id)` — 删除会话，如删除当前则自动切换到最新
- `saveToStorage()` — 持久化到 localStorage

### 4.3 新建对话流程

1. 用户点击「新建对话」→ 调用 `createNew()`
2. 生成 UUID 作为会话 ID，初始化空消息数组
3. 侧边栏高亮新会话（临时显示「新对话」标题）
4. 用户发送第一条消息后 → 取消息前 20 字作为会话标题
5. 自动保存到 localStorage

### 4.4 消息发送与流式渲染

```
用户输入 → InputBar emit → ChatWindow → useChat.send()
    → Pinia store 追加 user message
    → 创建空 assistant message（streaming: true）
    → 调用 streamChat() → onChunk 回调逐步追加 content
    → onDone 回调设置 streaming: false
    → useConversation.saveToStorage()
```

---

## 5. 状态管理（Pinia Store）

```typescript
// src/stores/chat.ts
interface ChatState {
  conversations: Conversation[]      // 所有会话列表
  activeConversationId: string | null
  isStreaming: boolean               // 当前是否正在流式输出
}

// 主要 actions
- loadFromStorage()    // 启动时从 localStorage 恢复
- sendMessage(content) // 发送消息并触发流式输出
- createConversation() 
- deleteConversation(id)
- switchConversation(id)
```

---

## 6. .agent 规范文件

### AGENT_RULES.md
- Agent 角色定义（助手类型、专业领域）
- 回复语言（默认中文）
- 输出格式（支持 Markdown、代码块）
- 禁止行为（不编造信息、不泄露系统提示词等）
- 上下文窗口策略（保留最近 N 轮，超出后截断）

### ARCHITECTURE.md
- 目录结构说明（各层职责）
- 数据流说明（用户输入 → Store → Composable → API/Mock → SSE chunk → 消息渲染）
- 环境变量配置说明
- 如何接入真实后端（将 `VITE_USE_MOCK` 设为 false，配置 `VITE_API_BASE_URL`）

### API_CONTRACT.md
**SSE Chat 接口约定:**
```
POST /api/chat
Content-Type: application/json

Request Body:
{
  "conversationId": "string",
  "messages": [
    { "role": "user" | "assistant", "content": "string" }
  ]
}

Response: Content-Type: text/event-stream
  data: {"chunk": "partial text"}\n\n
  ...
  data: [DONE]\n\n

Error Response: HTTP 4xx/5xx
  data: {"error": "message"}\n\n
```

---

## 7. .gitignore 关键排除项

```
node_modules/
dist/
dist-ssr/
*.local
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.vscode/
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
coverage/
.nyc_output/
```

---

## 8. 环境变量

```bash
# .env.example
VITE_USE_MOCK=true              # true: 使用 mock 数据，false: 真实 SSE
VITE_API_BASE_URL=http://localhost:3000  # 后端地址（mock 时忽略）
VITE_APP_TITLE=Agent Vue
```

---

## 9. 不在本次范围内

- 用户认证 / 登录
- 多 Agent 切换（保留扩展接口）
- Markdown 语法高亮（基础 Markdown 渲染在范围内，代码块语法高亮不在范围内）
- 移动端适配
- 单元测试
