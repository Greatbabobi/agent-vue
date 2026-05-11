# AGENTS.md — 前端 Agent 开发规范（Vue 3）

本文件为 AI 编码助手（Copilot、Cursor、Claude 等）提供项目级约束。**每次修改代码前必须完整阅读本文件。**

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈约束](#2-技术栈约束)
3. [目录结构规范](#3-目录结构规范)
4. [代码风格规范](#4-代码风格规范)
5. [Vue 组件规范](#5-vue-组件规范)
6. [TypeScript 规范](#6-typescript-规范)
7. [状态管理规范（Pinia）](#7-状态管理规范pinia)
8. [API 层规范](#8-api-层规范)
9. [Composable 规范](#9-composable-规范)
10. [路由规范](#10-路由规范)
11. [流式输出（SSE）规范](#11-流式输出sse规范)
12. [错误处理规范](#12-错误处理规范)
13. [环境变量规范](#13-环境变量规范)
14. [禁止事项](#14-禁止事项)
15. [提交与变更规范](#15-提交与变更规范)

---

## 1. 项目概览

- **应用类型**：基于 SSE 流式通信的 AI 对话前端
- **核心功能**：多会话管理、流式消息渲染、Markdown 展示、Mock/真实接口切换
- **运行环境**：现代浏览器（支持 `fetch` + `ReadableStream` + `crypto.randomUUID`）

### 数据流（只读，不得破坏此链路）

```
用户输入
  → InputBar (emit: send)
  → ChatView.handleSend
  → useChat.send(content)
    → store.appendMessage(userMsg)
    → store.appendMessage(assistantMsg, streaming: true)
    → api/mock.ts 或 api/chat.ts（由 VITE_USE_MOCK 决定）
    → streamChat(messages, onChunk, onDone, onError)
      → onChunk : store.updateLastAssistantMessage(chunk)
      → onDone  : store.finalizeLastAssistantMessage()
                  store.saveToStorage()
```

---

## 2. 技术栈约束

| 层级 | 技术 | 版本锁定 |
|------|------|----------|
| 框架 | Vue 3 Composition API | `^3.5` |
| 语言 | TypeScript | `~5.6` |
| 构建 | Vite | `^5.4` |
| 状态 | Pinia | `^2.2` |
| 路由 | Vue Router 4 | `^4.5` |
| UI 库 | Element Plus | `^2.8` |
| Markdown | marked | `^9.1` |

### 强制约束

- **禁止**引入 axios、lodash、moment、dayjs 等未在 `package.json` 中声明的依赖
- **禁止**引入其他 UI 组件库（antd-vue、Vuetify 等）
- **禁止**使用 Options API（`export default { data(){}, methods:{} }`）
- **禁止**使用 Vue 2 风格的 `$emit`/`$refs` 命令式调用
- 所有异步通信**只能**使用原生 `fetch` + `ReadableStream`，不得改用 WebSocket 或 EventSource

---

## 3. 目录结构规范

```
src/
├── api/              # 网络层：只含 streamChat 函数，无业务逻辑
│   ├── chat.ts       # 真实 SSE 实现
│   └── mock.ts       # Mock SSE 实现
├── composables/      # 以 use 开头的组合式函数，无 UI 依赖
│   ├── useChat.ts
│   └── useConversation.ts
├── stores/           # Pinia store，一个文件对应一个领域
│   └── chat.ts
├── components/       # 纯展示/交互组件，不直接调用 store
│   ├── ChatWindow.vue
│   ├── InputBar.vue
│   ├── MessageBubble.vue
│   └── Sidebar.vue
├── views/            # 页面级组件，负责组合 composable + 组件
│   └── ChatView.vue
├── router/           # 路由配置
│   └── index.ts
├── types/            # 全局 TS 类型，不含运行时代码
│   └── index.ts
├── assets/           # 静态资源（图片、字体）
└── style.css         # 全局样式（最小化，优先使用组件 scoped）
```

### 文件命名规则

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| Vue 组件 | PascalCase | `MessageBubble.vue` |
| Composable | camelCase，`use` 前缀 | `useChat.ts` |
| Store | camelCase | `chat.ts` |
| API 模块 | camelCase | `chat.ts`, `mock.ts` |
| 类型文件 | camelCase | `index.ts` |
| 路由文件 | camelCase | `index.ts` |

---

## 4. 代码风格规范

### 基本格式

- 缩进：**2 个空格**，禁止 Tab
- 引号：**单引号**（`'`），模板字符串除外
- 语句末尾：**不加分号**（与项目现有风格一致）
- 行宽：**不超过 100 字符**
- 每个文件末尾保留一个空行

### 命名约定

```typescript
// ✅ 变量 / 函数：camelCase
const activeConversationId = ref<string | null>(null)
function createConversation() {}

// ✅ 类型 / 接口：PascalCase
interface Message {}
type StreamHandler = (chunk: string) => void

// ✅ 常量：UPPER_SNAKE_CASE
const STORAGE_KEY = 'agent-vue:conversations'
const MAX_CONTEXT_TURNS = 20

// ✅ 组件名：PascalCase
// ✅ CSS 类名：kebab-case
```

### 注释规范

- 只为**非显而易见**的逻辑添加注释
- 禁止注释掉死代码并提交
- 公共函数使用 JSDoc 单行说明即可：

```typescript
/** 追加消息并自动更新会话标题 */
function appendMessage(conversationId: string, message: Message) {}
```

---

## 5. Vue 组件规范

### Script Setup 优先

所有组件**必须**使用 `<script setup lang="ts">`，禁止 `<script>` 非 setup 写法。

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Message } from '@/types'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{ send: [content: string] }>()
</script>
```

### Props 规范

- **必须**使用泛型 `defineProps<T>()` 形式，禁止运行时对象形式
- 所有 props 显式标注类型
- 可选 prop 用 `?` 标注，提供合理默认值（使用 `withDefaults`）

```typescript
// ✅
const props = withDefaults(defineProps<{
  loading?: boolean
  placeholder?: string
}>(), {
  loading: false,
  placeholder: '输入消息…',
})

// ❌ 禁止
defineProps({ loading: Boolean })
```

### Emits 规范

- 使用泛型 `defineEmits<T>()` 形式
- 事件名使用 **camelCase**（模板中自动转为 kebab-case）

```typescript
const emit = defineEmits<{
  send: [content: string]
  cancel: []
}>()
```

### 模板规范

- 条件渲染：少量节点用 `v-if`，频繁切换用 `v-show`
- 列表渲染：**必须**提供唯一稳定的 `:key`（优先使用 `id`，禁止使用数组 `index`）
- 事件处理：简单逻辑内联，复杂逻辑提取为函数
- 避免在模板中直接调用 store，通过 composable 暴露所需数据

```vue
<!-- ✅ -->
<MessageBubble
  v-for="msg in messages"
  :key="msg.id"
  :message="msg"
/>

<!-- ❌ 禁止以 index 为 key -->
<MessageBubble v-for="(msg, index) in messages" :key="index" />
```

### 样式规范

- 组件样式**必须**加 `scoped`，避免全局污染
- 全局样式仅写在 `src/style.css`
- 使用 CSS 变量管理主题色，禁止硬编码颜色值
- 与 Element Plus 主题集成时，通过 CSS 变量覆盖，禁止修改 node_modules

```vue
<style scoped>
.message-bubble {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}
</style>
```

---

## 6. TypeScript 规范

### 类型安全

- **禁止**使用 `any`；确实无法避免时，使用 `unknown` 并做类型守卫
- **禁止**使用非空断言 `!`，除非有注释说明理由
- 所有函数参数和返回值**必须**有类型标注（可推断时可省略返回值类型）

```typescript
// ✅
function parseChunk(data: string): string | null {
  try {
    const parsed: unknown = JSON.parse(data)
    if (typeof parsed === 'object' && parsed !== null && 'chunk' in parsed) {
      return (parsed as { chunk: string }).chunk
    }
    return null
  } catch {
    return null
  }
}

// ❌
function parseChunk(data: any): any { ... }
```

### 接口与类型

- 对象形状优先用 `interface`，联合/工具类型用 `type`
- 核心领域类型（`Message`、`Conversation`）统一在 `src/types/index.ts` 定义，禁止在组件内重复定义

```typescript
// src/types/index.ts
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}
```

### 导入规范

- 类型导入使用 `import type`，避免运行时开销
- 路径别名统一使用 `@/`，禁止相对路径跨目录（`../../`）

```typescript
// ✅
import type { Message } from '@/types'
import { useChatStore } from '@/stores/chat'

// ❌
import { Message } from '../../types'
```

---

## 7. 状态管理规范（Pinia）

### Store 设计原则

- 每个 store 对应**一个业务领域**，禁止创建 God Store
- 使用 **Setup Store** 写法（`defineStore('id', () => { ... })`），禁止 Options Store
- `state` 使用 `ref` / `reactive`；`getters` 使用 `computed`；`actions` 是普通函数

```typescript
// ✅ Setup Store
export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) ?? null
  )

  function createConversation(): Conversation { ... }

  return { conversations, activeConversationId, activeConversation, createConversation }
})
```

### 持久化规范

- 持久化只能通过 `localStorage`，key 格式为 `agent-vue:{domain}`
- `saveToStorage` 必须在每次变更完成后（`finalizeLastAssistantMessage`）调用，禁止在流式过程中频繁写入
- 从 `localStorage` 读取时**必须**包裹 `try/catch`，防止 JSON 解析异常

### 流式状态规范

- `isStreaming` 为全局互斥锁：`true` 时禁止新建请求（`useChat.send` 应 early return）
- 流结束（`onDone` / `onError` / `cancel`）时**必须**调用 `finalizeLastAssistantMessage` 清除 `streaming: true` 标记

---

## 8. API 层规范

### streamChat 函数签名（不可更改）

```typescript
export function streamChat(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  conversationId?: string,
): () => void  // 返回 cancel 函数
```

- `chat.ts` 与 `mock.ts` **必须**导出完全相同签名的 `streamChat`
- 两个文件是**运行时互斥**的（由 `VITE_USE_MOCK` 在构建时选择），不得相互引用

### chat.ts（真实 SSE）规范

- 使用 `AbortController` 实现取消，返回 `() => controller.abort()`
- SSE 解析必须处理分块粘包：维护 `buffer`，按 `\n` 分割逐行解析
- 忽略格式异常的行（`try/catch` 跳过），不抛出异常终止整个流
- `AbortError` 不触发 `onError`，属于正常取消行为

```typescript
// SSE 解析核心逻辑（禁止简化）
buffer += decoder.decode(value, { stream: true })
const lines = buffer.split('\n')
buffer = lines.pop() ?? ''  // 保留未完整的最后一行
for (const line of lines) {
  if (!line.startsWith('data: ')) continue
  const data = line.slice(6).trim()
  if (data === '[DONE]') { onDone(); return }
  try {
    const parsed = JSON.parse(data)
    if (parsed.error) throw new Error(parsed.error)
    if (parsed.chunk) onChunk(parsed.chunk)
  } catch { /* skip malformed */ }
}
```

### mock.ts（Mock SSE）规范

- 使用 `setTimeout` 递归模拟逐字输出（间隔 30–80ms，批量 1–3 字符）
- 初始延迟 300ms 模拟网络延迟
- 取消时设置 `cancelled = true` 并 `clearTimeout`
- Mock 响应内容须说明当前为 Mock 模式，不得伪装成真实 AI 回复

---

## 9. Composable 规范

### useChat

- 是**唯一**允许调用 `streamChat` 的地方，组件不得直接调用 API 层
- 维护 `cancelStream` 引用，保证同一时刻只有一个流在进行
- `send` 函数调用前检查 `store.isStreaming`，`true` 时直接 return
- 暴露 `{ send, cancel }` 两个方法，不暴露内部状态

```typescript
export function useChat() {
  const store = useChatStore()
  let cancelStream: (() => void) | null = null

  async function send(content: string) {
    if (!content.trim() || store.isStreaming) return
    // ...
  }

  function cancel() {
    cancelStream?.()
    cancelStream = null
    if (store.activeConversationId) {
      store.finalizeLastAssistantMessage(store.activeConversationId)
    }
  }

  return { send, cancel }
}
```

### useConversation

- 封装会话的 CRUD 操作（create / switch / delete）
- 不处理消息级别的状态，消息状态由 `useChat` + store 负责

### 通用 Composable 规范

- 文件名和函数名一致，均以 `use` 开头
- 不能包含模板/样式代码，不引入任何 Vue 组件
- 如果 composable 有副作用（定时器、事件监听），必须在 `onUnmounted` 中清理

---

## 10. 路由规范

- 使用 **Hash 模式**（`createWebHashHistory`），避免服务端配置问题
- 路由名称使用 PascalCase（`ChatView`）
- 懒加载所有页面组件：`component: () => import('@/views/ChatView.vue')`
- 路由 meta 定义在 `src/router/index.ts`，不散落在组件内

---

## 11. 流式输出（SSE）规范

### 状态机

```
idle
  → [send] → streaming
    → [onChunk] → streaming（累加 content）
    → [onDone]  → idle（finalize + saveToStorage）
    → [onError] → idle（finalize，显示错误提示）
    → [cancel]  → idle（finalize，保留已接收内容）
```

### 渲染规范

- 流式消息（`streaming: true`）渲染时末尾显示光标动画（CSS `@keyframes`）
- `streaming: true` 的消息**不写入** `localStorage`，只有 `finalize` 后才持久化
- Markdown 渲染使用 `marked`，在 `MessageBubble` 内通过 `v-html` 输出，必须注意 XSS 风险（只渲染受信任的 assistant 内容）

### 上下文截断

- 发送前取 `historyMessages`（过滤掉 `streaming: true` 的占位消息）
- 超过 20 轮时，保留最近 20 条（始终保留 system 类消息）
- 截断逻辑在 `useChat` 中实现，不在 store 中实现

---

## 12. 错误处理规范

### 分层原则

| 层级 | 错误类型 | 处理方式 |
|------|----------|----------|
| API 层 | 网络错误、HTTP 非 2xx、SSE 内 error event | 调用 `onError(err)`，不 throw |
| Composable 层 | AbortError（正常取消）| 忽略；其他错误 `console.error` + 调用 `finalize` |
| Store 层 | localStorage 解析失败 | try/catch，降级为空数组 |
| 组件层 | 无 | 通过 props/emit 响应 composable 的状态 |

### 用户感知错误

- 流式错误发生时，`finalizeLastAssistantMessage` 后，在已接收的内容末尾追加错误提示（使用 Element Plus `ElMessage.error`）
- **禁止** `alert()`、`console.log` 生产环境调试输出

---

## 13. 环境变量规范

所有环境变量**必须**在 `.env.example` 中声明，禁止在代码中硬编码。

| 变量 | 类型 | 说明 |
|------|------|------|
| `VITE_USE_MOCK` | `'true' \| 'false'` | 控制 API 模块选择 |
| `VITE_API_BASE_URL` | URL 字符串 | 后端基础地址 |
| `VITE_APP_TITLE` | 字符串 | 页面标题 |

### 访问规则

- 只能通过 `import.meta.env.VITE_*` 访问
- 布尔值使用字符串比较：`import.meta.env.VITE_USE_MOCK !== 'false'`
- **禁止**将敏感 key（API Key、Token）放入 `VITE_*` 变量（会暴露到客户端）

---

## 14. 禁止事项

以下操作会破坏架构或引入安全/性能问题，**一律禁止**：

| 类别 | 禁止内容 |
|------|----------|
| 架构 | 在组件内直接调用 `streamChat` |
| 架构 | 在 store 外直接操作 `conversations` 数组 |
| 架构 | 在流式过程中调用 `saveToStorage` |
| 安全 | 对用户输入的内容使用 `v-html` 渲染 |
| 安全 | 将 API Key / Secret 写入任何 `VITE_*` 环境变量 |
| 性能 | 在 `onChunk` 回调中执行 DOM 查询或重渲染之外的副作用 |
| 代码质量 | 提交包含 `console.log` 的生产代码 |
| 代码质量 | 引入未在 `package.json` 中声明的依赖 |
| 代码质量 | 使用 `any` 类型绕过 TypeScript 检查 |
| 测试 | 修改 `api/chat.ts` 逻辑时不同步更新 `api/mock.ts` 的签名 |

---

## 15. 提交与变更规范

### 提交信息格式（Conventional Commits）

```
<type>(<scope>): <subject>

[可选正文]

[可选 footer]
```

| type | 适用场景 |
|------|----------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不改变行为） |
| `style` | 格式调整（不影响逻辑） |
| `docs` | 文档变更 |
| `chore` | 构建/依赖/配置变更 |

### 变更影响矩阵

修改以下文件时，**必须**同步检查对应依赖项：

| 修改文件 | 必须同步检查 |
|----------|------------|
| `src/types/index.ts` | 所有引用 `Message`/`Conversation` 的文件 |
| `src/api/chat.ts` | `src/api/mock.ts`（保持签名一致） |
| `src/stores/chat.ts` | `src/composables/useChat.ts`、`useConversation.ts` |
| `.env.example` | `README.md` 的环境变量说明 |
| `VITE_USE_MOCK` 逻辑 | `.agent/ARCHITECTURE.md` 的环境变量表 |

### 新增功能检查清单

在提交 PR 前，确认以下所有项：

- [ ] 无 TypeScript 编译错误（`npm run build` 通过）
- [ ] 新增组件使用 `<script setup lang="ts">` + `scoped` 样式
- [ ] 新增 API 函数与 `streamChat` 签名兼容
- [ ] 新增环境变量已在 `.env.example` 中声明
- [ ] 无 `console.log` / `any` 类型 / 非空断言 `!` 遗留
- [ ] 流式状态在所有退出路径（onDone / onError / cancel）中正确 finalize

---

> 本文件由项目维护者定义，AI 助手在每次会话开始时应优先加载本文件内容。
> 如需更新规范，需同步更新 `.agent/` 目录下的对应文档。
