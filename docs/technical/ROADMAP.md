---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# DoerFlow 版本规划与里程碑

**最后更新**: 2026-09-15  
**关联**: [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [CLIENTS.md](./CLIENTS.md) · [SPEC.md](./SPEC.md)

---

## 1. 商业路径（到 v1.0 的主线）

集中精力按下列顺序交付；**未列入主线的能力不阻塞商业版上线**。

```
M0–M1 基础已齐
      │
      ▼
M2  v0.2  链下账本 + Merkle 批量结算     ← 实验室验收通过（2026-08-25）
      │
      ▼
M3  v0.3  客户端完善：wallet · worker · admin · web     ← AI 验收通过（2026-08-29）
      │
      ▼
M4  v0.4  赚钱场景：Agent/云 SDK·API · 人类发单接单闭环  ← AI 验收（smoke:m4）
      │
      ▼
M5  v1.0  工程 1.0-rc（生产闸门）
      │
      ▼
M5a 封闭 Beta   Base 主网白名单收款（Web/API）  ← 工程可关；资金/部署仍人工
      │
      ▼
M5b 公开运行    取消邀请制；审计/Bounty 有资金再做；前期不予赔付
```

| 阶段 | 版本 | 一句话目标 |
|------|------|------------|
| **M2** | v0.2 | Vault + 链下记账引擎 + Merkle Root 上链 + 强制提现 |
| **M3** | v0.3 | 发单 / 接单 / 运营审核客户端可日常使用 |
| **M4** | v0.4 | 云与 Agent 可 SDK/API 接入；人类可发任务赚钱 |
| **M5** | **v1.0-rc** | 生产探针、Runbook、主网脚本、披露 |
| **M5a** | closed-beta | 白名单 + 限额 + pause + **不予赔付**；Web/API 收真实 ETH/USDC |
| **M5b** | v1.0 | 公开收款；**前期仍不予赔付**；审计与有资金的 Bounty 不阻塞运行 |

**铁律**：

1. **先清算底座，再客户端，再场景，最后商业发版。**  
2. 高频路径必须走 [ASYNC_PAYMENTS](./ASYNC_PAYMENTS.md)（链下账本 + Merkle）；**不做** 定制 L3 作前置。  
3. MetaDEX / IoT 车桩 / 能源冷链 / 完整 P2P / Omnichain → **1.0 后或并行支线**，不占用主线关键路径。

---

## 2. 版本策略

采用 **SemVer**：

| 层级 | 命名 | 说明 |
|------|------|------|
| **Protocol / Platform** | v0.x → **v1.0** | 合约 + api + 客户端一体里程碑 |
| **MetaRepo** | workspace | 工具链与编排 |

---

## 3. 里程碑详情

### M0 — 项目启动 ✅

脚手架、文档、本地 SQLite 开发环境、Hardhat 初始化。

---

### M1 — v0.1 MVP「身份与交易」🟡

**主题**: Agent 铸造 → Skill 注册 → Escrow 结算最小闭环（已基本达成）

| 域 | 状态摘要 |
|----|----------|
| 合约 | AgentNFT / SkillRegistry / Escrow / SessionKeyRegistry → Base Sepolia ✅ |
| api | NestJS **Fastify** 索引、SIWE、任务治理 API MVP+ |
| web | 市场（可雇佣 Agent + Skill 列表搜索）/ 工作台 waitMined / 任务中心闭环 + 人类任务只读 |
| 客户端 | wallet 发任务 / worker 列表 / admin 审批（MVP 级） |

**Base Sepolia（84532 · 2025-01-08）**:

| 合约 | 地址 |
|------|------|
| AgentNFT | `0xe5C76a46b273418D814e9b98d057c7Ab1c615A9F` |
| SkillRegistry | `0x120cF4c31f2503A2145C9A5D87B4647a9c4c32B4` |
| Escrow | `0x1bB2364fFeA1D747aC41e8A92A2fC78BfE423f50` |
| SessionKeyRegistry | `0xF35E657DD8a57256694666331b5875D7A1B4FF0A` |

**验收**: 双钱包完成铸造 → Escrow → 交付 → 结算。

---

### M2 — v0.2「链下账本 + Merkle 结算」✅

**主题**: 把 A2A / API 高频微支付从「每笔上链幻想」落到可上线的清算底座  
**规范**: [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · FR-PAY-006 / 012 / 013

| 模块 | 交付 | 状态（2026-08-25） |
|------|------|-------------------|
| **contracts** | `PaymentVault` 充提；`MicroPaymentSettler` commitRoot + forceWithdraw | ✅ Hardhat 任意账户 `forceWithdraw`（含奇数叶）；**Base Sepolia 已部署**（未重部） |
| **api** | 链下记账；Receipt 验签；周期快照与 Root；披露 | ✅ Fastify；`credit-batch` ≤1 万；**默认 Postgres + Redis**（Docker）；**10 万笔 → 1 Root**（`MemoryLedgerService` 单测，无 RPC）；`POST /ledger/snapshot` 用 PaymentServiceGuard |
| **shared** | EIP-712 Receipt；`buildBalanceMerkle` / proof 工具 | ✅ Merkle leaf 与合约对齐 + 单测（含 256 叶任意下标） |
| **链** | Base Sepolia → Base Mainnet 准备 | 🟡 Vault Sepolia ✅；主网仍属 M5 |
| **披露** | `/payments/disclosure` | ✅ latestEpoch / forceWithdraw / `m2Acceptance` |

**已有可复用**: Receipt Vault PoC、Session Key 合约（M1）。

**Base Sepolia Vault（84532 · 2025-01-13）**:

| 合约 | 地址 |
|------|------|
| Mock USDC（Vault asset） | `0x3d8893Ab039e32330a6e80F4baed34EC194f603F` |
| PaymentVault | `0xcce2aeeA7e46941eaFC62c4d8f02D357B75AcdBc` |
| MicroPaymentSettler | `0x20fC7000eb52ef53980E00F12AA64df941f1042C` |

**验收**（实验室，2026-08-25）:

> 1 万笔/分链下记账零单笔链上 tx；模拟 ≥10 万笔 → **1 笔 Root**；任意账户可用 Merkle 证明从 Vault **强制提现**。

| 条 | 证据 |
|----|------|
| 1 万笔/分、零链上 tx | `memory-ledger.m2-acceptance.spec.ts` / `creditMany`（引擎单测，无 RPC；运行时默认仍是 Postgres） |
| ≥10 万笔 → 1 Root | 10×`credit-batch`(1 万) 后一次 `snapshot()`，`leafCount=100000`，单一 `root` |
| 强制提现 | `PaymentVault.t.ts`：奇数叶 + 10 个存款人同一 Root，下标 0/4/9 `forceWithdraw` |

未纳入本验收（不阻塞 M2 关闭）：Sepolia 再发一笔真实 `commitRoot`/`forceWithdraw`、主网。**FR-PAY-007 轧差** 与 **FR-PAY-008 Bundler 批次** 在 v1.0 工程闸门交付（见 ASYNC_PAYMENTS §4.3）。本地与生产账本默认均为 `LEDGER_STORE=postgres` + `COMMIT_ROOT_QUEUE=bull`（Docker Desktop）。

**预计工期**: 8–10 周（实验室验收已完成）  
**依赖**: M1 核心合约与 api 支付模块骨架  

---

### M3 — v0.3「客户端完善」✅

**主题**: 在清算底座之上，把日常使用的客户端做完整  
**规范**: [WALLET.md](./WALLET.md) · [WORKER.md](./WORKER.md) · [ADMIN.md](./ADMIN.md) · [CLIENTS.md](./CLIENTS.md)

| 客户端 | 交付 | 状态 |
|--------|------|------|
| **wallet** | 发任务 UX 完整；转账 / 收益流水；Vault 充提；Onramp 买币；官方桥入金引导 | ✅ transfer · vault · onramp · session · Escrow fund/release · **SIWE 任务写** · **dispute / refundTimedOut** · 驳回/修改 · **`submitted` 验收** · **发单说明 / 线下地点** · **发单进度 / 待办置顶 / 接单通知** · **客户端 en+zh** |
| **worker** | 众包接单 / 交付 / 收款闭环；**社交任务（清单+截图）**；任务仅展示 `published` | ✅ **Expo 大厅 + accept + deliverEscrow** · **相机/GPS/问卷 + proofCid** · **社交 Tab / 打开目标首页 / 清单 / 截图** · published 门禁 · **详情状态 / 已被接单 / 待验收** · Vault · 账本余额 · **收益页原生 ETH** · escrowId · **open dispute** · **en+zh** · **Sepolia 独立 demo 钥（非 Hardhat #1）** |
| **admin** | 审批队列、L0–L3 风控、告警、费率与支付运维只读面板 | ✅ review · **batch-approve** · auto-approval · tasks · **社交 App/步骤回显** · governance · publishers · audit · disputes · alerts · **仪表盘真实 GMV + 待审队列** · commits · fees · **CORS :13011** · **en+zh-CN locale** |
| **web** | Creator 工作台与市场体验 hardening；与 Vault / Escrow 状态一致 | ✅ `/payments` Vault + fees；Escrow UX；测试网 gas 引导；**公开市场（无需平台登录）**；`use:sepolia` / `use:localhost` 链配置切换 · **en+zh locale** |
| **api** | 任务治理与客户端 API 稳定；推送 / WebSocket 通知（按需） | ✅ 治理 · publishers flag · onChainEscrowId · 预留 · ledger · fees · auto-decisions；Indexer 分片 + **链头窗口**；health 含 indexer 游标；链 profile 与 web/wallet/worker 对齐；**`deliver` → `submitted`**；**`pnpm run smoke:m3`**（链下）· **`pnpm run smoke:escrow`**（Sepolia 真锁仓） |

**验收**（AI，2026-08-29）:

> `pnpm run smoke:m3`：自动上架 → 接单锁定 → 免验收完成；须验收照片 `submitted` → 发单方 verify；社交 `pending_review` 不进大厅，Logto 可达时审批→接单→交付。  
> 链上放款另跑 `pnpm run smoke:escrow`（Sepolia，需余额）。Expo 不在 Playwright 里点，状态机由 API + 客户端单测覆盖。

发单方仅用 wallet、接单方仅用 worker、运营仅用 admin，可在测试网完成「发布 → 审批 → 接单 → 交付 → 放款」全流程，无需运维手工改库。

**前期不做**：面向听障、视障、言语障碍等特殊人群的残障无障碍（读屏 / 字幕 / WCAG）。**社交任务本身是 M3 交付**（清单+截图）。Android Accessibility Service 打开目标 App 为 v0.4 可选项，与残障无障碍不是同一件事。

**预计工期**: 8–10 周  
**依赖**: M2 Vault/账本可用（充提与余额展示）  

---

### M4 — v0.4「赚钱场景落地」✅

**主题**: 把文档里的赚钱方式做成可接入、可交易的产品能力  
**规范**: [DEVELOPER.md](./DEVELOPER.md)

| 场景 | 交付 | 状态 |
|------|------|------|
| **Agent / 云服务接入** | Agent Trading SDK（Python/TS）：发现、报价、`signReceipt`、接单回调；对外 REST/WebSocket/SSE | ✅ `@vibe-agent/shared/sdk` · `sdk/python` · `/trading/*` |
| **Skill / 企业 API** | Skill 注册定价 → 调用计费走账本；企业回调 HMAC 网关 | ✅ quote + job `resourceId` + `callbackUrl` |
| **人类发单** | wallet 任务发布（Agent 受众 + 人类受众）；确认清单与治理强制生效 | ✅ 由 M3 `smoke:m3` 覆盖 |
| **人类接单赚钱** | worker 众包闭环；凭证与 Escrow/放款一致 | ✅ 由 M3 覆盖 |
| **（可选同里程碑）** | Device Node 最小注册与心跳 | ⚪ 不阻塞 1.0；见 IoT 支线 |

**验收**（AI，2026-08-29）:

> ① `pnpm run smoke:m4`：SDK 无 App 完成链下微支付并进入 Merkle snapshot/proof；  
> ② 人类「发单 → 审批 → 接单 → 结算」= `pnpm run smoke:m3`；  
> ③ [DEVELOPER.md](./DEVELOPER.md) 与公开 [Agent 交易 SDK](https://docs.doerflow.dev/developers/agent-trading-sdk) 可按步骤复现。

**预计工期**: 8–12 周  
**依赖**: M2 + M3  

---

### M5 — v1.0「商业版本上线」🟡 工程闸门 ✅ / 商业宣布 ⚪

**主题**: 生产就绪与对外商业发布（主线终点）  
**规范**: [PRODUCTION.md](./PRODUCTION.md)

> **不能用 Creator DApp 迭代代替。** 主网地址与资金 **AI 不伪造**。工程侧 1.0-rc 由 `pnpm run smoke:m5` 关闭。先上线再打磨；前期 **不予赔付**（FR-PAY-017）。

| 域 | 交付 | AI 工程 | 人类商业宣布 |
|----|------|---------|--------------|
| **安全** | 内部预审；`SECURITY.md` 收报告；**明确不予赔付** | ✅ | 有资金后再开 Bounty |
| **主网** | Hardhat `base`（8453）网络；deployments 待真实地址；**Timelock + Multisig 持有 admin** | ✅ 脚本 + **Indexer HA** + **索引行 Postgres** + `GOVERNANCE=1` | 资金 + 部署 |
| **运维** | `/live` `/ready`、Prometheus 告警、备份/Root/强制提现 Runbook | ✅ | 创始人 on-call |
| **产品** | 生产 env 模板；Onramp/风险/不赔付披露 | ✅ | 商店签名可选 |
| **生态** | SDK + API 文档；Sepolia ABI/地址已发布 | ✅ | 主网地址页（部署后填） |

**验收**:

> **工程（AI）**：`pnpm run accept` = M3 + M4 + M5 闸门。实验室路径：账本充值镜像 → SDK 微支付 → Root → proof。人类任务全流程见 M3。  
> **运行（人类）**：主网真实部署后即可封闭 Beta 收款。对外称 **商业版 1.0** 仍建议有审计；**不** 因未开 Bounty 而推迟运行。

**预计工期**: 8–10 周  
**依赖**: M2–M4 验收通过  

---

### M5a — closed-beta「封闭主网收款」🟡 工程清单 ✅ / 主网资金 ⚪

**主题**: 邀请制在 Base 主网收真实 ETH（Escrow）与 USDC（Vault）；**不**对外宣布商业 1.0  
**规范**: [PRODUCTION.md](./PRODUCTION.md) · [COMMERCIAL.md](./COMMERCIAL.md) · FR-PAY-016

| 交付 | 状态 |
|------|------|
| `COMMERCIAL_MODE=beta` + 地址白名单；主网禁止 `off` | 工程 |
| 单笔 / 地址 / 全局 TVL 限额；`PAYMENTS_PAUSED` + Vault `pause`（停充值、不停 `forceWithdraw`） | 工程 |
| 未审计 + **不予赔付** 披露（web/wallet/worker + `/payments/disclosure`） | 工程 |
| 主网 Vault 资产 = Base 原生 USDC（禁止 Mock） | 脚本硬约束 |
| `pnpm run use:base`（无 `"8453"` 地址则失败，不造假） | 工程 |
| `deploy/docker-compose.prod.yml` | 工程 |
| `pnpm run smoke:vault`（Sepolia 真 deposit → commitRoot → forceWithdraw） | 脚本；链上需测试 ETH |
| 人类：主网部署钥、ETH/USDC、multisig、域名/TLS | ⚪ |

默认限额（env 可覆盖）：单笔 Vault ≤ 100 USDC；地址净敞口 ≤ 500 USDC；全局 TVL ≤ 5,000 USDC；单笔 Escrow ≤ 0.05 ETH。

**验收（工程）**：`smoke:m5` 含 M5a 文件与 env 键；`smoke:vault` 在 Sepolia 绿灯。主网首笔由白名单钱包完成，AI 不填写 `"8453"` 假地址。

---

## 4. 支线与 1.0 之后（不阻塞商业发版）

以下能力 **可与主线并行**，但 **不得抢占 M2–M5 关键资源**，除非单独立项。

### 4.1 MetaDEX Lite（支线）

合约优先的 ve DEX（见 [METADEX_CONTRACTS.md](./METADEX_CONTRACTS.md)）。  
**与 1.0 主线解耦**：账本 / 客户端 / 赚钱场景不依赖 MetaDEX 上线。

| 子阶段 | 内容 | 相对主线 |
|--------|------|----------|
| v0.15.0 合约 | Factory / Pair / Router / ve | 可并行 |
| v0.15.1 api | `/dex/*` 读链 | 可并行 |
| v0.15.2 web | Swap / LP / Vote | 可并行 |

### 4.2 LuminaryWorks 会员与支付融合（P0–P4 · 支线，与 M5a 并行）

规范：[PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md) · [GEO_PORTABILITY.md](./GEO_PORTABILITY.md)

个人（无公司主体）先上线试运营，收款能力做全以便日后 SaaS 交付；私有化交付可整体摘除支付。DoerFlow 在此既是**产品**（可被购买会员），也是一条**支付轨**（可给其他产品付款）。

| 阶段 | 内容 | 验收 | 状态 |
|------|------|------|------|
| **P0** | PayPal 活体（零新代码）+ `manual` 对公 + 付款方类型 `individual\|business`（FR-PAY-022/025） | 真实产生一笔 `order.fulfilled`，产品侧 plan 生效 | 🟡 |
| **P1** | MoR 通道（代扣代缴 VAT，个人可开户）（FR-PAY-024） | 沙箱含税结算 + MoR 侧发起的退款级联撤销 | 🟡 |
| **P2** | USDT 多资产 Vault + `doerflow_credit` 支付轨（FR-PAY-020/021） | 链上余额买通一个产品会员；重放 `idempotencyKey` 不二次扣款 | 🟡 |
| **P3** | `PAYMENTS_ENABLED` 硬开关 + VistaCast 接入 + 企业开票（FR-PAY-023） | 关开关后 webhook 路由 404 且产品仍可跑 | 🟡 |
| **P4** | 大陆分站权益断言（FR-GEO-002~005） | 仅 spec + 契约与守卫测试，同步服务不落代码 | ⚪ |

**铁律**：会员真相源只有 LuminaryWorks Entitlement；DoerFlow 不自建会员表。协议费 / Job 单价 / Escrow / Gas 不进 Entitlement。不做法币提现。

### 4.3 v1.0 之后展望

| 版本 | 主题 |
|------|------|
| v1.1 | 完整 P2P Beacon、争议仲裁增强、信誉 |
| v1.2 | IoT 设备收款 / 数据微市场规模化（复用 M2 账本） |
| v1.3 | 能源与冷链 SLA 契约 |
| v1.4 | Omnichain（CCTP / LayerZero）；状态通道 1:1 拓展（FR-PAY-010，A2A 真高频） |
| v0.7+ | `$DOER` **非结算**效用代币：费率折扣 / 质押 / ve gauge（FR-TOK-001） |
| v1.x+ | MasterChef / DAO 治理扩大；自建 L2 **仅规模证明后评估** |

#### 代币铁律（FR-TOK-001 / FR-TOK-002）

- A2A 小额高频的**结算与计价单位永远是稳定币**。自有币若兼任计价货币，其波动会直接破坏 Agent 定价 —— 设计红线。
- `$DOER` 只做效用与治理，**不作结算货币**。
- **不发行** 1:1 锚定美元、可赎回的平台内记账币（属储值 / 预付工具，与 [ONRAMP.md](./ONRAMP.md) 的"不托管"立场冲突）。
- 发币前置门槛（缺一不可）：主网真实成交量 · 已注册经营主体 · 法律意见书 · 明确「非证券、无收益承诺」定位。

---

## 5. 团队与资源倾斜

| 阶段 | 资源重心 |
|------|----------|
| **M2** | 合约结算 + api 账本引擎（实验室已验收） |
| **M3** | 移动端 + admin + 任务治理体验 | ✅ AI |
| **M4** | SDK / 对外 API + 场景联调 | ✅ AI |
| **M5** | 安全披露 + 创始人值班 + 发版 | 🟡 工程闸门已关；主网资金待人类；前期不赔付 |

建议规模：M2 起 5–8 人；M3–M4 扩至含移动端；M5 加安全与运维。

---

## 6. 风险与缓冲

| 风险 | 影响 | 缓解 |
|------|------|------|
| Merkle / Vault 审计延迟 | M5 推迟 | M2 结束即启动审计预审 |
| 客户端跨端进度不及预期 | M3 拉长 | 先保 wallet 发单 + worker 接单 + admin 审批三角 |
| SDK 生态冷启动 | M4 验收弱 | 先官方示例 Agent + 沙箱水龙头 |
| 过早投入 MetaDEX / IoT / 自建链 | 主线失血 | 支线隔离；定制 L3 不做 |

每个主线里程碑预留 **约 15% 时间缓冲**。

---

## 7. 进度追踪

**当前阶段: M5a — 封闭 Beta 工程清单（主网资金仍人工；公开 1.0 见 M5b）**

M2 实验室验收已通过（2026-08-25）。M3/M4 由 `pnpm run smoke:m3` / `smoke:m4` AI 验收（2026-08-29）。顺序仍是 **清算底座 → 客户端 → 场景 → 生产闸门**；继续留在 Base Sepolia 打磨，**不伪造主网地址**。

| 里程碑 | 版本 | 状态 |
|--------|------|------|
| M0 项目启动 | — | ✅ |
| M1 身份与交易 | v0.1 | 🟡 |
| **M2 链下账本 + Merkle** | **v0.2** | **✅ 实验室验收（10 万笔 → 1 Root · Hardhat 强制提现）** |
| M3 客户端完善 | v0.3 | ✅ **AI：`pnpm run smoke:m3`** |
| M4 赚钱场景落地 | v0.4 | ✅ **AI：`pnpm run smoke:m4`** |
| **M5 工程 1.0-rc** | **v1.0-rc** | **✅ `pnpm run smoke:m5`** |
| **M5a 封闭 Beta** | closed-beta | **✅ 工程（白名单/限额/pause/`use:base`/`smoke:vault`）** · ⚪ 主网资金 |
| M5b / 公开运行 | v1.0 | ⚪ 取消邀请制 · 主网地址页；审计/Bounty 有资金再做 |
| 支线 MetaDEX | v0.15.x | 🟡 合约进度另计 |
| **五通道实验室** | **v1.1-channels-lab** | **✅ `pnpm run smoke:channels`（P0–P4）** |
| **生态商业实验室** | **v1.2-ecosystem-commerce** | **`pnpm run smoke:ecosystem-commerce`**（默认关，未接真实对端） |
| **部署边界四档 + 探针** | **v0.1-profiles** | **`pnpm run compose:preflight` · `smoke:m5`** |
| **smart-site 最小契约** | **v0.1-smart-site-lab** | 🟡 契约与深链已实现；默认关 |
| 支线 IoT 规模化 / 能源 / Omnichain | v1.2+ | ⚪ P4 仅为单设备 HTTP PoC |

*状态: ✅ 完成 | 🟡 进行中 | ⚪ 未开始 | 🔴 阻塞*

---

## 8. 五通道实验室（P0–P4 · v1.1-channels-lab）

商业 1.0 宣布仍待审计/主网。本段是工程实验室：把 FR-ST-006 做成可本地验证的五通道，**不新开 Git 仓**。

规范：[CHANNELS.md](./CHANNELS.md) · [AGENT_RUNTIME.md](./AGENT_RUNTIME.md) · [ENDPOINT.md](./ENDPOINT.md)

| 阶段 | 目标 | 落点 |
|------|------|------|
| **P0** | 统一 `channel` / `executorKind` / `settlementRail` / 关联 ID | spec + `GET /channels` + OpenAPI |
| **P1** | Agent ↔ Cloud：发现→报价→执行适配器→Receipt | `trading` 持久化 job、`execute`、MCP、CloudEvents |
| **P2** | Agent ↔ Agent：Card → claim → deliver | `/a2a/*` + `POST /agent-tasks/:id/deliver` |
| **P3** | 电脑/手机 Endpoint 白名单执行 | `/endpoints` |
| **P4** | 单设备 IoT 注册/心跳/遥测入账 | `/devices`（无 DeviceRegistry 合约） |

验收：`pnpm run smoke:channels`。示例 Runtime：`scripts/example-agent-runner.mjs`。

**明确不做**：Matter 收款、公网 MQTT 控制面、Rust SDK、完整 libp2p、用 MCP/A2A 替换任务状态机。

---

## 9. 生态商业实验室（VistaCast / SyncroBrain）

与五通道并行的工程实验室：[luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md) · FR-ST-007 · FR-PAY-018。

| 项 | 落点 |
|----|------|
| Job 授权结算 | `authorize` 不入账 → 2xx+hash 后 `capture`；5xx `void` |
| Inbox | `POST /integrations/events` CloudEvents |
| TB 时间窗入账 | `POST /integrations/syncrobrain/telemetry-credits`；asset↔payee 绑定；Gateway UTC 窗闭合后自动出站（FR-IOT-008） |
| 回调 | durable outbox |
| 鉴权 | 生产 M2M+Entitlement+Casbin；`COMMERCE_AUTH_MODE=lab\|off`（生产禁用） |
| 验收 | `pnpm run smoke:ecosystem-commerce`（别名 `smoke:ecosystem`） |

**Creator UI**：web `/ecosystem`（只读 catalog / jobs；实验室 readiness Tags）。见 [CLIENTS.md](./CLIENTS.md) · [ECOSYSTEM.md](./ECOSYSTEM.md)。

**现状诚实标注**：VistaCast / SyncroBrain 对接是**已实现的工程实验室**，`DEPLOYMENT_PROFILE` 未开时**默认关**；未接真实生产对端。

---

## 10. 部署边界与 smart-site

规范：[DEPLOYMENT.md](./DEPLOYMENT.md)（`FR-DEP-*`）· [SMART_SITE.md](./SMART_SITE.md)（`FR-SITE-*`）。

| 项 | 落点 |
|----|------|
| 四档累进 | `DEPLOYMENT_PROFILE=standalone\|control-plane\|agent-commerce\|smart-site` |
| 最小后端 | API + Indexer + Postgres + Redis；客户端可选 |
| Compose | `core` 基座 + `dev`/`prod`/`external-db`/`control-plane`/`smoke` overlay |
| 探针 | `/ready` 降级 **503**；新增 `/version` 与 `/capabilities` |
| 启动校验 | capability manifest fail-closed（生产禁 `COMMERCE_AUTH_MODE=lab\|off`） |
| smart-site | 人工介入深链 + DataLuminary 导出关联；**不自动远控、不自动 resolve** |
| 验收 | `pnpm run compose:config` · `pnpm run compose:preflight` · `pnpm run smoke:m5` |

Creator UI 同 §9（web `/ecosystem`）。

---

## 11. 客户正式接入（FR-DEV-001~006）

规范：[DEVELOPER.md](./DEVELOPER.md) §5。目标是云 / Agent 客户能自助接生产，而不是只靠仓内路径 + 实验室模式。

| 项 | 落点 |
|----|------|
| 开发者 API Key | `dfk_live_` / `dfk_test_`；生产拒 test；绑定 Logto `sub`；不绕过 Entitlement/Casbin |
| 工程 SLA | 按套餐 30/300/1200 rpm；429 + `X-RateLimit-*` |
| 控制台 | web `/developers`：发 Key、注册 Skill、轮换 webhook、看流水 |
| Python 闭环 | `authorize_session` + `pay_quote` 与 TS EIP-712 字节一致 |
| 发布面 | `@vibe-agent/shared` / `doerflow` 可 dry-run pack；**不代发 npm/PyPI** |
| 主网 | 地址只由部署脚本写入；AI 禁止填 `"8453"` |

生产默认仍是 M2M + Entitlement + Casbin；`NODE_ENV=production` 下 `COMMERCE_AUTH_MODE=lab\|off` 启动即失败。API Key 是第三条生产路径，不是实验室后门。

*主线规范入口：[ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [CHANNELS.md](./CHANNELS.md) · [CLIENTS.md](./CLIENTS.md) · [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)*
