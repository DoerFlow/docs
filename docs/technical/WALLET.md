---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 钱包 App 规格（纯粹钱包 · React Native）

**版本**: v0.2-draft · **最后更新**: 2026-09-12  
**仓库**: `repos/wallet` → `AgentSkillMesh/wallet`（私有）

---

## 1. 定位

**轻量非托管钱包**，面向 **发单方、持币用户、轻量 Creator**：

| 能力 | 说明 |
|------|------|
| **币交易** | 转账、收款、历史记录（ETH / USDC） |
| **查看收益** | Escrow 入账、任务支出、协议费明细 |
| **发布任务** | 创建任务草稿 → 确认清单 → 提交审批 → 跟踪状态 |

**不包含**：接单大厅、拍照交付、社交平台自动化 — 见 [WORKER.md](./WORKER.md)。

## 2. 与综合端分工

| | wallet（本 App） | worker |
|--|------------------|--------|
| 用户 | 付钱发任务的人 | 接单赚钱的人 |
| 发布 | ✅ | ❌ |
| 接单 | ❌ | ✅ |
| 转账 | ✅ | 收款为主 |

## 3. 功能需求

### FR-WLT-001 钱包账户
- 助记词 / WalletConnect  
- 多链余额（Base 优先）  
- 生物识别解锁  
- 私钥、助记词与签名只在设备；不得上传到 Logto、Entitlement 或 DoerFlow API
- 可选平台 Logto 会话仅用于平台门禁调用与套餐/组织展示；不能代表、解锁或恢复钱包  
- 首页（平台会话提示、快速体验）文案走 en/zh locale

### FR-WLT-002 转账交易
- 地址转账（ETH）；扫码 v0.4  
- **Gas 估算**（`estimateGas` + 展示预估费用）  
- 提交后等待回执；展示 txHash；Base Sepolia / Basescan 可打开浏览器  
- 收款地址默认留空（不再预填 Hardhat 演示地址）；仅本地链可选填入测试收款方  
- 转账页文案走 en/zh locale  

### FR-WLT-003 收益与账单
- Escrow 收入/支出流水  
- 按任务 ID 聚合  
- **M3**：`assigned` 任务可链上 `createEscrow` + `fundEscrow`（锁定报酬）；`submitted` / `verifying` 验收前 `confirmDelivery` 放款；收益页对这两态均可点通过/驳回  
- **M3**：收益页按状态展示只读进度（上架等待接单 / 已接单待锁定 / 待交付 / 待验收）；需要发单方操作的任务（锁定、验收、再提交）置顶，不得把待验收埋在已完成列表里  
- **本机自动测**：`pnpm run smoke:m3` 默认 `CHAIN_ID=31337`（勿默认 84532），接单/交付后断言 `GET /tasks/mine` 状态（`assigned` → `submitted`/`completed`）；`pnpm --dir repos/wallet test` 覆盖进度文案与通知差分。本地链上锁仓：`pnpm run smoke:escrow:local`（Hardhat 31337）。Sepolia 可选：`pnpm run smoke:escrow:check` → `pnpm run smoke:escrow`。Playwright 只覆盖 **admin 登录页**（`pnpm run e2e:admin`）；wallet/worker 是 Expo，不在浏览器里点。  
- **Sepolia demo 钥**：发单/接单不得使用公开 Hardhat 账户（`#0`/`#1` 等）；这些地址在公共测试网常被 EIP-7702 委托，放款会被转走。本地 `31337` 仍可用 Hardhat `#0`/`#1`。接单钥不安全时先 `pnpm run demo:worker:sepolia`。  
- **M3**：收益页 `GET /escrows?consumer=` 展示预留/链上 Escrow 流水  
- **M3**：`assigned|submitted|verifying` 可 `POST /tasks/:id/dispute` 开争议（原因用输入框，不依赖 iOS `Alert.prompt`）；链上托管超时可 `refundTimedOut`  
- 收益页、发布页与 Tab 文案走 en/zh locale；Escrow 签名/配置错误同样走 locale  
- 本 App **不** 展示接单大厅或离线演示人类任务  
- 导出（v0.4）  

### FR-WLT-004 发布任务
- 选择任务类型：`human` | `social`（社交类标记高风险，**须声明平台与步骤**，进入人工审核；社交任务是 M3 要做的发单能力）  
- **人类 / Agent**：须填写任务说明；人类众包可标线下地点（`remote=false` 时 worker 交付须 GPS）  
- 模板表单 + 报酬 + 截止时间  
- **发单方确认清单**（见 [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)）  
- 提交 → `pending_review` → 展示审批状态  
- 连接钱包后自动 **SIWE**（`GET /auth/nonce` + `POST /auth/siwe`），任务写接口带 Bearer；测试网不强制 Logto 钱包绑定  
- `published` 后显示接单进度（只读：大厅等待接单；`assigned` 显示接单地址；交付后待验收）  
- **`rejected` 须展示驳回原因**（API：`alertReason` / `rejectReason`；运营驳回或违禁硬拒）  

### FR-WLT-005 通知
- 审批通过/驳回、Escrow 锁定、任务完成结算  
- **M3**：收益页可见驳回原因、社交任务的平台与步骤；worker 接单进入 `assigned` 时应用内通知；接单方交付进入 `submitted` 时应用内通知「待验收」；系统推送（Push）见 v0.4  

### FR-WLT-006 买币（Onramp）
- 「买币」入口 → `/onramp` → `POST /onramp/session` → 第三方 Hosted URL  
- crypto 直达 **用户钱包地址**；平台不碰法币/KYC  
- 买币页文案走 en/zh locale  
- 无合作伙伴密钥时为 **stub**；课堂与本地默认 **不得** 打开真买币（无 Stripe/MoonPay 必做路径）  
- 见 [ONRAMP.md](./ONRAMP.md)  

### FR-WLT-007 跨链充值
- Phase 1：deep link [Base Bridge](https://bridge.base.org)（Ethereum ↔ Base）  
- Phase 2（v0.7）：Agent L2 **原生桥** 存取款 UI  
- 见 [BRIDGE.md](./BRIDGE.md)

### FR-WLT-008 Vault 充提（M3）
- 「入金」与钱包首页入口 → `/vault`  
- Mock/测试 USDC mint（测试网）→ Approve → `PaymentVault.deposit`  
- `withdraw`；可选同步链下账本 `POST /payments/ledger/credit`  
- 展示 `GET /payments/disclosure`（引擎 / 队列 / latestEpoch）  
- 首次连接钱包须勾选 [用户协议](https://docs.doerflow.dev/legal/terms)（含前期不予赔付）  
- 环境：`EXPO_PUBLIC_PAYMENT_VAULT_ADDRESS` · `EXPO_PUBLIC_VAULT_ASSET_ADDRESS`  
- 入金 Tab 与 Vault 页文案走 en/zh locale  
- 见 [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)

### 实验室设备库存（非链上 Registry）

- 栈屏 `/devices` 列出 HTTP `GET /devices` 库存（状态 chips + 搜索；kind / payee / label 缺失为 —）；**不是**链上 `DeviceRegistry`
- 入金（Fund）Tab 链到该页

## 4. 技术栈

React Native · Expo · expo-router · viem · Biome · 依赖 `api` 任务治理接口。

平台门禁调用可附加安全存储中的 OIDC access token，并区分 `401` / `402` / `403`。普通转账、收款、链上签名与协议费路径不依赖平台套餐。DoerFlow 无 Trial，wallet 不显示试用 CTA 或倒计时。Agent Session Key 页（`/session`）文案走 en/zh locale。

## 5. 里程碑

| 版本 | 交付 |
|------|------|
| v0.3 | 钱包 + 发任务（含社交平台与步骤）+ 审批状态查询 + **买币 Onramp** + Base 桥引导 + **Vault 充提** + **发单进度 / 待办置顶** |
| v0.4 | WalletConnect、账单导出、Transak/Alchemy Pay |
| v0.7 | Agent L2 原生桥 UI + 入金向导 |

---

*原 v0.1「wallet=接单」描述已迁移至 WORKER.md。*
