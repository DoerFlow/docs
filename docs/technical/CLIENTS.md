---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 客户端与平台总览

**版本**: v0.2-draft · **最后更新**: 2026-09-12

## 1. 产品矩阵

| 端 | 仓库 | 用户 | 核心能力 |
|----|------|------|----------|
| **钱包 App** | `wallet` | 发单方 / 持币用户 | 转账、余额、收益、**发布任务**（草稿→审核→上链） |
| **综合端 App** | `worker` | 任务执行者 | Agent 众包 + **社交平台任务**（清单+截图） |
| **Creator DApp** | `web` | Agent 运营者 | Agent/Skill、Escrow、市场；测试网 gas/水龙头引导 |
| **管理平台** | `admin` | 平台运营 | 订单审核、风控告警、发布审批 |
| **Agent Trading SDK** | `shared/sdk` · `sdk/python` | 云 / Agent 开发者 | 发现、报价、`signReceipt`、Merkle（无 App） |
| **Agent Runtime（示例）** | MetaRepo `scripts/example-agent-runner.mjs` | Agent 开发者 | 拉作业、调工具、交回执；非独立仓 |
| **Endpoint Agent** | api `/endpoints` | 本机执行器 | Desktop 白名单能力；非 worker App |
| **IoT Device HTTP** | api `/devices` | 设备 / 网关 | 注册、心跳、遥测；非 Matter |
| **SyncroBrain 时间窗入账** | api `/integrations/syncrobrain/telemetry-credits` | SyncroBrain Gateway | TB 聚合 digest → 账本；非 MQTT |

```mermaid
flowchart TB
  Publisher[发单方] -->|wallet 发布任务| Gov[任务治理 API]
  Gov -->|L0 自动过 / 人工审| Published["published + P… 预留"]
  Worker[执行者] -->|worker 接单 assigned| Published
  Published -->|选修 createEscrow+fund| Chain[链上锁仓]
  Agent[AI Agent] -->|web/API 发单| Gov
```

## 2. 任务受众与类型

| 受众 | 代码 | 执行端 | 接单 | 验收 |
|------|------|--------|------|------|
| **AI Agent** | `audience=agent` | 协议内 Agent / web | 自动 claim（价≤上限） | 链上规则 |
| **人类** | `audience=human` | worker | 自愿 accept | 发单方 verify 或免验收 |
| 社交子类 | `taskType=social` | worker | 同上 | 默认人工审批 |

| 链上 Skill | `skill` | web | Escrow | 合约 |

详见 [TASK_SYSTEM.md](./TASK_SYSTEM.md)。

社交平台示例：抖音、小红书、知乎 — **点赞、观看、收藏** 等（须符合当地法律与平台 ToS，见合规章节）。

## 3. 发布与交易规则（摘要）

> 详细流程见 [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)

1. 发单方在 **wallet** 填写任务模板并提交；`published` 时创建平台 Escrow 预留（`escrowId` 以 `P` 开头，status `Reserved`），**不会**立刻锁链上 ETH  
2. 任务进入 **治理流水线**：风险评分 → 自动/人工审批  
3. **仅 `published` 状态** 的任务对 worker 可见并可接单  
4. 接单进入 `assigned` 后，发单方可选修 `createEscrow` + `fundEscrow` 并绑定 `onChainEscrowId`；执行者 `deliver` → **`submitted`**（须验收）→ 发单方 `verify` → 已锁仓则合约放款，否则账本结算；争议进 admin 仲裁队列  

**原则**：未通过平台确认的任务 **不得** 对执行端展示、不得扣款结算。

## 4. 规格文档索引

| 文档 | 内容 |
|------|------|
| [WALLET.md](./WALLET.md) | 纯粹钱包 App |
| [WORKER.md](./WORKER.md) | 综合端 App（众包 + 社交） |
| [ADMIN.md](./ADMIN.md) | 管理平台 |
| [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md) | 审批分级、风控、状态机 |
| [CHANNELS.md](./CHANNELS.md) | 五通道任务经济 |
| [AGENT_RUNTIME.md](./AGENT_RUNTIME.md) | Agent 执行循环 |
| [ENDPOINT.md](./ENDPOINT.md) | 电脑/手机执行面 |
| [SPEC.md](./SPEC.md) | 协议总规格 |
| [REPOS.md](./REPOS.md) | 仓库依赖 |

## 5. 双身份、会员与客户端边界

- **web**：平台 Logto 会话、钱包连接、SIWE 会话分别展示；显示钱包链接状态、会员快照、Pro / Ultra / Enterprise 与配额。公开市场和钱包直签保持可用。Creator DApp 用户可见文案走 en + zh-CN locale。
- **admin**：必须登录平台账号；按钮只消费 API 返回的 `permissions`，不得用 Logto claim、前端 mock role 或可切换角色授予权限；同时展示套餐与组织上下文。运营界面文案走 en + zh-CN locale。
- **wallet / worker**：非托管密钥和签名仅在设备；任务写路径用 **SIWE** 证明地址（测试网不强制 Logto 绑定）。可选显示平台会员，并只在平台门禁 API 上附加平台 token。Logto 不创建、导入、导出或证明钱包。
- **无 Trial**：DoerFlow 全客户端不得出现免费试用 CTA、Trial Plan 或倒计时。
- **残障无障碍（前期不做）**：不针对听障、视障、言语障碍等特殊人群做无障碍适配（读屏、字幕轨、WCAG、TalkBack/VoiceOver 专项等）。wallet / worker / web / admin 均按普通视听用户设计。覆盖 M3 至商业 1.0 前；以后若做须单独立项。**不是**社交任务的 Android Accessibility Service（FR-WRK-010，步骤引导）。
- **错误语义**：`401` 登录；`402 ENTITLEMENT_*` 套餐/配额升级；`403` 产品资源 ACL。协议费与平台套餐为两条独立收费轨。

## 6. worker 路由（v0.3）

| Tab / 路由 | 职责 |
|------------|------|
| 众包 `(tabs)/index` | `GET /human-tasks`，仅 `published`/`open`，`taskType≠social` |
| 社交 `(tabs)/social` | 同上，`taskType=social` |
| 收益 `(tabs)/earnings` | 我的接单 + `GET /payments/ledger/balances` |
| 收款 `(tabs)/payout` · `/vault` | Vault 充提 |
| `app/task/[id]` | 人类众包详情：接单、拍照、GPS、问卷、`deliverEscrow`、争议 |
| `app/(tabs)/social/[id]` | 社交任务详情：打开目标首页 + 清单 + 截图交付（**M3 要做**；Accessibility Service 自动打开 App 为 v0.4 可选项） |

## 7. wallet 实验室路由

| 路由 | 职责 |
|------|------|
| `/devices` | 列出 `GET /devices`（HTTP 实验室库存；状态 chips + 搜索；kind/label 缺失为 —；**不是**链上 DeviceRegistry） |

## 8. web 实验室

| 页面 | 职责 |
|------|------|
| Payments（挂载 `LabDevicesCard`） | 列出 HTTP `GET /devices`（轮询 + 状态筛选 + 搜索；lastSeen/kind/payee/status/label 缺失为 —；**不是**链上 DeviceRegistry） |

## 9. admin 实验室路由

| 路由 | 职责 |
|------|------|
| `/devices` | 只读 `GET /devices` 库存（轮询 + 状态筛选 + 搜索 + `lastSeenAt`/`kind`/`label` 排序；**不是**链上 DeviceRegistry） |
