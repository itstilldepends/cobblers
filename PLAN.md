# Cobblers 实现计划

## Context
多 LLM 辩论/共识工具。核心流程：用户提问 → 多模型独立回答 → 自动提取共识/分歧 → 多轮辩论直到收敛 → 用户 review 结果。支持 edit/resume/fork。类似 ChatGPT 的 UI 体验：左侧辩论历史列表，点击可查看/继续/编辑任何历史辩论。

## 用户操作流程
1. **配置 API Keys** — 设置里填各 provider 的 key（至少一个，多个才有辩论效果），存 localStorage
2. **提问** — 输入问题，勾选参与辩论的模型（≥2个），选裁判模型（可选，默认用第一个选手），设最大轮数
3. **Round 1** — 各模型独立回答，互相看不到对方答案
4. **Brief 生成** — 裁判模型分析所有回答，提取共识点、分歧点、开放问题（裁判看到的是匿名 Model A/B/C，避免偏见）
5. **Round 2~N** — 各模型看到 Brief 后重新回答，针对分歧补充论证
6. **收敛判定** — 每轮后裁判判断是否已收敛，收敛则停止
7. **用户 Review** — 查看每轮回答和 Brief，可以：编辑 Brief → Resume 继续辩论 / Fork 从某轮分叉出新辩论

## 技术栈
- 后端：Python FastAPI + WebSocket
- 前端：React + TypeScript (Vite)
- 状态管理：Zustand
- 存储：JSON 文件（MVP）

## 项目结构

```
cobblers/
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   └── app/
│       ├── main.py                 # FastAPI 入口, CORS
│       ├── config.py               # pydantic-settings
│       ├── models/
│       │   ├── debate.py           # DebateSession, Round, DebateBrief, etc.
│       │   └── api.py              # Request/Response schemas
│       ├── adapters/
│       │   ├── base.py             # LLMAdapter protocol
│       │   ├── claude.py
│       │   ├── openai_adapter.py   # GPT
│       │   ├── gemini.py
│       │   ├── deepseek.py         # OpenAI-compatible API
│       │   └── registry.py         # adapter factory
│       ├── orchestrator/
│       │   ├── engine.py           # DebateOrchestrator 主循环
│       │   ├── brief.py            # 提取共识/分歧
│       │   └── convergence.py      # 收敛判定
│       ├── storage/
│       │   └── file_store.py       # JSON 文件存储
│       ├── routes/
│       │   ├── debates.py          # REST endpoints
│       │   └── ws.py               # WebSocket endpoint
│       └── prompts/
│           ├── round1.py           # 第一轮独立回答 prompt
│           ├── round_n.py          # 后续轮次 prompt
│           ├── brief_generation.py # 提取共识/分歧 prompt
│           └── convergence.py      # 收敛判定 prompt
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── api/
        │   ├── client.ts           # REST client
        │   └── ws.ts               # WebSocket client
        ├── types/index.ts
        ├── stores/debateStore.ts   # Zustand
        ├── components/
        │   ├── Layout.tsx
        │   ├── QuestionInput.tsx    # 问题输入 + 模型选择
        │   ├── ModelConfig.tsx      # API key 配置
        │   ├── DebateView.tsx       # 辩论主视图
        │   ├── RoundView.tsx        # 单轮：多列并排
        │   ├── ResponseCard.tsx     # 单个模型回复
        │   ├── BriefView.tsx        # 辩论简报（可编辑）
        │   ├── RoundTimeline.tsx    # 轮次导航
        │   ├── ConvergenceBar.tsx   # 收敛进度
        │   └── ForkControls.tsx     # Fork/分支
        └── hooks/
            ├── useDebate.ts
            └── useWebSocket.ts
```

## 核心数据模型

```python
class DebateSession:
    id: str
    question: str
    model_ids: list[str]
    max_rounds: int
    status: "running" | "paused" | "completed" | "error"
    rounds: list[Round]
    forked_from: str | None
    fork_point: int | None

class Round:
    number: int
    responses: list[ModelResponse]
    brief: DebateBrief | None
    convergence: ConvergenceResult | None

class ModelResponse:
    model_id: str
    provider: str
    text: str

class DebateBrief:
    consensus: list[str]
    disagreements: list[Disagreement]
    open_questions: list[str]
    summary: str
    edited: bool

class Disagreement:
    topic: str
    positions: dict[str, str]  # model_id -> position

class ConvergenceResult:
    converged: bool
    confidence: float
    reasoning: str
```

## API 设计

### REST
| Method | Path | 用途 |
|--------|------|------|
| POST | /api/debates | 创建并启动辩论 |
| GET | /api/debates | 列出所有辩论 |
| GET | /api/debates/{id} | 获取辩论状态 |
| PUT | /api/debates/{id}/rounds/{round}/brief | 编辑辩论简报 |
| POST | /api/debates/{id}/resume | 从编辑点恢复 |
| POST | /api/debates/{id}/fork | Fork 辩论 |
| POST | /api/config/validate-keys | 验证 API keys |

### WebSocket (单向, server → client)
```
WS /api/debates/{id}/ws

Client sends on connect: {api_keys: {...}}

Events:
  round_start      {round: number}
  model_response   {round, model_id, text}
  brief_generated  {round, brief}
  convergence_check {round, result}
  converged        {round}
  debate_complete  {status}
  error            {error}
```

## 实现顺序

### Phase 1: 后端骨架 + 单模型 ✅
1. ~~初始化项目结构，pyproject.toml~~
2. ~~定义 Pydantic 数据模型~~
3. ~~实现 Claude adapter + base protocol + registry~~
4. ~~实现 FileStore~~
5. ~~最小 orchestrator（1轮，1模型）~~
6. ~~REST routes: POST + GET debates~~

### Phase 2: 多模型 + 辩论循环 ✅
1. ~~添加 OpenAI/Gemini/DeepSeek adapters~~
2. ~~orchestrator 并发调用多模型~~
3. ~~实现 BriefGenerator（提取共识/分歧）~~
4. ~~实现 ConvergenceDetector~~
5. ~~完整辩论循环~~

### Phase 3: WebSocket 流式输出 ✅
1. ~~WebSocket route~~
2. ~~orchestrator 发送事件~~

### Phase 4: 前端 MVP ✅
1. ~~Vite + React 脚手架, 安装 Zustand, react-markdown~~
2. ~~QuestionInput, useWebSocket, debateStore~~
3. ~~DebateView + RoundView + ResponseCard~~
4. ~~BriefView, RoundTimeline~~

### Phase 5: Edit/Resume/Fork ✅
1. ~~BriefView 可编辑~~
2. ~~resume API + 前端~~
3. ~~fork API + 前端~~

### Phase 6: 历史记录 + 收尾 ✅
1. ~~Session 列表侧边栏~~
2. ~~API key 验证 + ModelConfig 组件~~
3. ~~ConvergenceBar~~

## 关键设计决策
- **API keys 不持久化**：后端只在内存中持有，前端存 localStorage
- **JSON 文件存储**：MVP 够用，FileStore 接口窄，后续换数据库改一个文件
- **WebSocket 单向**：server push only，mutations 走 REST，简化协议
- **Brief 提取用 LLM**：语义理解任务，规则/embedding 不如 LLM 准确
- **Fork = deep copy + truncate**：简单，O(1) 实现复杂度
