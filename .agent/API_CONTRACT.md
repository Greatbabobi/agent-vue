# API 接口约定

## Chat SSE 接口

### 请求

```
POST /api/chat
Content-Type: application/json
```

```json
{
  "conversationId": "string (UUID)",
  "messages": [
    { "role": "user",      "content": "用户消息内容" },
    { "role": "assistant", "content": "上一轮回复" }
  ]
}
```

> `messages` 数组包含完整上下文（截断策略由前端负责，见 AGENT_RULES.md）。

### 响应

```
Content-Type: text/event-stream
Cache-Control: no-cache
```

**正常 chunk：**
```
data: {"chunk": "partial text token"}\n\n
```

**结束信号：**
```
data: [DONE]\n\n
```

**错误（在流中）：**
```
data: {"error": "错误描述"}\n\n
```

> 错误发生时，服务端应先发送 error event，再关闭连接。

### HTTP 错误码

| 状态码 | 含义 |
|--------|------|
| 400 | 请求格式错误 |
| 429 | 请求频率超限 |
| 500 | 服务端内部错误 |
