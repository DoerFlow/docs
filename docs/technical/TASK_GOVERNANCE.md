---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 任务治理与发布审批

**版本**: v0.3-draft · **最后更新**: 2026-10-07
**关联**: [CLIENTS.md](./CLIENTS.md) · [WORKER.md](./WORKER.md)

## 1. 任务状态机

发布者与执行者是任务关系，不是两类 Platform Account。同一账号可发布其他任务并执行其有权接取的任务；同一任务是否允许自接、验收或仲裁由服务端冲突策略与 Casbin 决定，客户端角色切换不得绕过。

```
draft → pending_review → published → assigned → submitted → verifying → completed
                    ↘ rejected          ↘ cancelled
                    ↘ needs_revision → draft
```

| 状态 | 说明 | 谁可见 |
|------|------|--------|
| `draft` | 发单方编辑中 | 仅发单方 |
| `pending_review` | 已提交，等待审批 | 发单方 + admin |
| `published` | 已上架 | Agent 可 claim / 人类可 accept |
| `rejected` | 驳回或违禁 | 发单方 |
| `needs_revision` | 要求修改后重提 | 发单方（wallet 可见原因） |
| `assigned` | 已接单，执行中 | 发单方 + 接单方 |
| `submitted` | 接单方已交付，等待发单方验收 | 发单方 + 接单方 |
| `verifying` | 验收/自动核验进行中（与 `submitted` 同等可 `verify`） | 发单方 + 接单方 |
| `completed` / `cancelled` | 已结算或已取消 | 相关方 |

**交易约束**：`published` 时绑定平台 Escrow 预留（`escrowId` 形如 `P…`，status `Reserved`）。`P…` **不是**已锁 ETH；链上 `createEscrow` + `fundEscrow` 发生在 `assigned` 之后。接单后写入 `provider`。  
**链上放款（M3）**：发布者在统一 App/Web 于 `assigned` 后 `createEscrow` + `fundEscrow`，并 `POST /tasks/:id/bind-onchain-escrow` 写入 `onChainEscrowId`；执行者在统一 App（迁移期 worker）交付时 `deliverEscrow`；发布者验收前 `confirmDelivery` 放款。有 `onChainEscrowId` 时 API `settleLedgerPayout` 只标 `ledgerSettled`、不做 ledger capture（禁止双付）；已有 ledger authorization 时绑定链上 Escrow 返回 `SETTLEMENT_RAIL_CONFLICT`。**无 `onChainEscrowId` 时**，`POST /human-tasks/:id/verify`（通过）或免验收 `deliver` → `completed` 经同一函数由发布者 `available → held → capture`，原子拆分协议费与 Provider net；资金不足则保持 `ledgerSettled=false`，不得无付款方直接 credit。结算费率见 [FEE_TIERS_AA.md](./FEE_TIERS_AA.md)。

任务经济事件对齐统一生命周期：`Offer → Quote → Authorize/Fund → Execute → Meter/Evidence → Accept/Capture → Fee Split → Settle/Dispute`。任务状态机描述工作进展，结算生命周期描述资金进展，两者不得互相冒充。

## 2. 双受众（audience）

| audience | 列表 API | 接单 |
|----------|----------|------|
| `agent` | `GET /agent-tasks` | `POST /agent-tasks/:id/claim`（价格合适自动接） |
| `human` | `GET /human-tasks` | `POST /human-tasks/:id/accept`（自愿） |

## 3. 审批分级

| 级别 | 条件（示例） | 审批方式 | SLA |
|------|--------------|----------|-----|
| **L0 低额** | 金额 < 阈值、无敏感词、非社交 | **仍须运营通过后才 `published`**；评分只排队，不自动上架、不结算 | 进入待审 |
| **L1 简单** | 标准人类任务 | 人工；可抽检已通过单 | < 5 分钟 |
| **L2 复杂** | 高额、新发单方、Agent 任务超阈值 | admin 人工 | < 24h |
| **L3 高危** | 社交操控、违禁、危害人类 | 人工 + 风控；**默认拒绝** | — |

Agent 任务与人类任务同一条闸门：未写入 `MANUAL_APPROVED` 不得上架、不得账本 capture、不得绑定链上 Escrow。历史种子数据上的 `AUTO_PUBLISHED` 只兼容旧行，新提交不再发出该决定。

### 3.1 硬拒绝（不进待审）

命中即 `rejected`：

- **毒品**、**杀人**、**枪支**、**爆炸物**、**人口贩卖**、**恐怖主义** 等违禁描述  
- 详见 API `BLOCKED_KEYWORDS` 列表（可扩展）

### 3.2 高频恶意发布

| 规则 | MVP 默认 |
|------|----------|
| 同一 `publisherAddress` / 小时 | ≤ 10 次 `submit` |
| 超限 | `429 RATE_LIMIT`，不写库 |

### 3.3 危险任务监控（L3 告警）

- 刷量、挂机、批量点赞、绕过平台规则  
- 社交任务未声明 App 与步骤  
- 短时间大量同质任务  

## 4. 人类验收（可选）

| 条件 | 行为 |
|------|------|
| `verificationRequired=true`（默认）或已绑 `onChainEscrowId` | `deliver` → **`submitted`**（稳定待验收）→ 发单方 `verify` → `completed` |
| `verificationRequired=false` 且无链上 Escrow | `deliver` → `completed` |

`verifying` 不再由 `deliver` 自动写入。`POST /human-tasks/:id/verify` **同时接受** `submitted` 与 `verifying`（兼容历史任务；后续自动核验服务可将 `submitted` 推进为 `verifying`）。驳回验收回到 `assigned`，接单方可重新交付。

## 5. 发布确认清单（统一 App / Web）

- [x] 描述真实、报酬合理  
- [x] 禁止刷量/违法/危害人类内容  
- [x] 理解 Escrow 与手续费（AA 等级费率）  
- [x] 社交类须声明 App 与步骤  

证据：wallet `app/(tabs)/publish.tsx` 四项勾选；`publisherChecklistReady` 未齐则禁用提交；社交项仅 `isSocial` 必勾。

## 6. API 模块

| 接口 | 说明 |
|------|------|
| `POST /tasks` | 创建并可选 submit（wallet SIWE Bearer；测试网可不绑 Logto） |
| `POST /human-tasks/:id/accept` \| `verify` | 人类接单 / 发单方验收；无 `onChainEscrowId` 时 verify 通过走 `settleLedgerPayout`（`ledgerSettled`，既定账本结算） |
| `GET /human-tasks` \| `/agent-tasks` | 已发布列表 |
| `POST /human-tasks/:id/proof` | 接单方上传交付照片，返回 `proofCid`（`local://…`） |
| `POST /human-tasks/:id/deliver` | 人类交付 → `submitted`（须验收或已绑链上 Escrow）或 `completed`；`verificationRequired` 或社交任务须 `proofCid`；若已绑 `onChainEscrowId` 须带 `deliveryTxHash`（`deliverEscrow`） |
| `POST /agent-tasks/:id/claim` | Agent 自动接单 |
| `POST /agent-tasks/:id/deliver` | Agent 交付（默认免验收 → `completed` + 账本） |
| `GET /a2a/agent-card` · `POST /a2a/tasks/:id/claim` · `complete` | A2A 适配（仅 `published`） |
| `POST /admin/tasks/:id/approve` \| `reject` \| `request-revision` | 运营审批 |
| `POST /admin/tasks/batch-approve` | 批量通过待审（默认 L0/L1；FR-ADM-002/003） |
| `GET /admin/tasks/auto-decisions` | 自动审批决策日志（FR-ADM-004） |
| `POST /admin/tasks/:id/escalate-auto` \| `mark-auto-reviewed` | 抽检升级 / 标记已复核 |
| `GET /admin/tasks` | 全量任务列表（FR-ADM-002） |
| `GET` \| `PUT /admin/governance/config` | 治理参数（阈值 / 词库 / 限流） |
| `GET /admin/publishers` · `POST /admin/publishers/flag` | 发单方聚合与观察/黑名单（FR-ADM-010） |
| `GET /admin/audit` | 运营审计日志（FR-ADM-011） |
| `GET /admin/disputes` · `POST .../claim` · `POST .../resolve` | 争议工单（FR-ADM-012） |
| `POST /tasks/:id/dispute` | 发单方/接单方/运营开争议 |
| `POST /tasks/:id/onchain-refund` | 记录链上 `refundTimedOut`（FR-ST-003） |
| `POST /tasks/:id/bind-onchain-escrow` | 绑定链上 EscrowId（fund 后；状态 `assigned|submitted|verifying`，FR-ST-001/002） |
| `GET /escrows?consumer=` | 发单方 Escrow 流水 |
| `GET /fees/tiers` | 等级费率表 |

完整索引见 [TASK_SYSTEM.md](./TASK_SYSTEM.md)。

## 7. 合规边界（审核不能替代牌照）

只做 Agent 之间的撮合，**不能**据此认为平台与非法交易、洗钱无关。任务先审再付钱是必要控制，**不能杜绝**这类风险。

| 事实 | 含义 |
|------|------|
| 结算资产是链上 USDC / USDT / ETH，不是法币 | 不自动变成「无法币即可不做反洗钱」；许多司法辖区仍可能把撮合、托管或转移加密资产视为需许可的服务 |
| 审核看的是任务描述 | 挡得住明显违禁文案；挡不住拆单、虚假交付、过审后改用途、制裁地址 |
| 平台收单并拆分协议费 | 更接近交易组织者，而不是纯公告板 |

因此：

- **要做**：违禁硬拒绝；全部新任务人工通过后才能展示、接单和结算；证据后才 capture；地区与 Onramp 披露仍由持牌方做 KYC。
- **不能声称已经做到**：制裁名单筛查、链上 KYT、可疑交易报告、支付牌照。这些要按目标市场的法律意见单独立项，不在本闸门里冒充完成。
- **禁止**：把自有币当成结算底层资产来「绕开」稳定币合规；见 [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md) §9。

## 8. 审核 → 成交 → 放款闸门（防绕过）

| 步骤 | 要求 |
|------|------|
| 提交 | 违禁 → `rejected`；其余一律 `pending_review`（不再自动 `published`） |
| 上架 | 仅 admin `approve` 写入 `MANUAL_APPROVED` 后 `published` |
| 大厅 / 接单 / A2A claim | `status=published` **且** `autoDecision=MANUAL_APPROVED` |
| 账本结算 | `settleLedgerPayout` 无 `MANUAL_APPROVED` 则跳过；capture 后进 `pending` |
| 链上 Escrow 绑定 | 同样要求 `MANUAL_APPROVED` |
| 可提现 | 争议窗口结束后 sweeper `finalize` → `withdrawable`（不是 capture 当场可提） |

历史 `AUTO_PUBLISHED` **不得**再上架或结算（须运营重新审核或拒掉）。

## 9. 额度稽查 + 分级冷却 + 大额链上终局

**对。** 所有任务按金额做单笔 / 日 / 月稽查；达到冷却阈值走 14 天账本冷却；更大额适合链上 Escrow 终局放款。

### 9.1 额度（治理可配，ETH）

| 项 | 默认 | 时机 |
|----|------|------|
| `maxRewardPerTaskEth` | 1 | 创建/提交 |
| `maxRewardPerDayEth` | 5 | 提交（UTC 自然日累计，含待审与进行中） |
| `maxRewardPerMonthEth` | 50 | 提交（UTC 自然月累计） |

超限 → `400`（`TASK_REWARD_CAP` / `DAILY_REWARD_CAP` / `MONTHLY_REWARD_CAP`），不进待审队列。

### 9.2 账本冷却（capture → pending → finalize）

| 条件 | 冷却 |
|------|------|
| 报酬 ≥ `payoutHoldThresholdEth`（默认 **0.05**） | `payoutHoldSeconds`（默认 **14 天**） |
| 报酬 ≥ `onChainEscrowMinEth`（默认 **0.5**）且未绑链上 Escrow | 至少 14 天（鼓励大额走链上终局） |
| 其余小额 | `payoutHoldSecondsSmall`（默认 **0**） |

```
publisher available → held → capture 进 pending →（冷却）→ finalize → withdrawable
```

### 9.3 链上 Escrow 大额终局

| 项 | 约定 |
|----|------|
| 适用 | 报酬 ≥ `onChainEscrowMinEth`（默认 0.5 ETH） |
| 行为 | `confirmDelivery` 后合约即时放款（**无** 14 天账本冷却） |
| 小额 | 仍可用链上 Escrow，但默认推荐账本轨 + 阈值冷却 |

运营可在冷却窗口内开争议；到期后 `SettlementFinalityScheduler` finalize（`SETTLEMENT_FINALITY_SWEEPER=0` 可关）。

阈值经 `GET/PUT /admin/governance/config` 调整，不必改代码。

---

*变更同步 `spec/SPEC.md` §5.8 与 `traceability.md`。*
