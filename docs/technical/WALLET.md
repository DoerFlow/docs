---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 统一 DoerFlow App 规格（React Native 主壳）

**版本**: v0.3-draft · **最后更新**: 2026-10-10
**仓库**: `repos/wallet` → `AgentSkillMesh/wallet`（私有）

---

## 1. 定位

`repos/wallet` 是统一 **DoerFlow App** 主壳，也是要持续做深的**一等钱包产品**：密钥与签名只在设备。购买 ETH 等资产默认进入这把 DoerFlow 钱包；用户可以改选已连接的自托管钱包。Vault、余额四态和平台收单结算都落在用户选定的钱包上，不进平台混池。所有人使用同一 Platform Account；发布者、执行者与 Creator 只是当前任务/Workspace 上下文，不是不同账号类型。DoerFlow 是平台交易的收单方，不托管 KYC / 法币。

| 能力 | 说明 |
|------|------|
| **币交易** | 转账、收款、历史记录。EVM：ETH / USDC / USDT。比特币：BTC。非 EVM 稳定币先做 Tron USDT |
| **查看收益** | Escrow 入账、任务支出、协议费明细 |
| **发布任务** | 创建任务草稿 → 确认清单 → 提交审批 → 跟踪状态 |
| **工作与接单** | 浏览 `published` 任务、接单、原生证据、交付与争议；由 worker 渐进迁入 |
| **账户与资产** | Platform Account、Linked Wallets、Workspaces、Capabilities、Assets |

Creator `/ecosystem` 合作方 catalog UI 仍留在 Web。社交任务仍禁止代操作或绕过目标 App；迁移 worker 能力不放宽任何安全约束。

## 2. 主导航与迁移边界

| 主 Tab | 能力 |
|--------|------|
| **首页** | Workspace 摘要、待办、资产与能力状态 |
| **工作** | 大厅、我的执行、证据与交付 |
| **发布** | 草稿、审核、发布管理、验收 |
| **资金** | 余额四态、流水、Vault、Onramp/Swap/Bridge |
| **我的** | Platform Account、Linked Wallets、Workspaces、Capabilities、安全与无障碍设置 |

`repos/worker` 在迁移期继续承载既有接单/证据功能。新产品面只进入本 App；能力对等后旧 worker 保留两个正式版本迁移窗口再退役。迁移期间允许同一账号在两个 App 登录，但同一任务动作仍须服务端幂等与 Casbin 裁决。

## 3. 功能需求

### FR-WLT-001 钱包账户
- 助记词 / WalletConnect
- 多链余额（Base 优先）
- 生物识别解锁
- 私钥、助记词与签名只在设备；不得上传到 Logto、Entitlement 或 DoerFlow API
- **注册不分配钱包。** Platform Account 只建立登录身份。服务端不生成、不保存助记词或私钥，也不在注册时写入一个收款地址
- **在 App 里创建。** 用户第一次进入 DoerFlow App 资金页时创建 DoerFlow 钱包：助记词只在本机生成并展示一次，用户确认已备份后才写入设备安全存储。该地址成为购买 ETH 等资产的默认收款地址。这不是运营开通审批
- **Web 不创建这把钱包。** 浏览器没有 DoerFlow 钱包地址时，买币只能改选已连接的自托管钱包
- **本地链例外：** `CHAIN_ID=31337` 继续用实验室账户，不生成新的 DoerFlow 钱包
- **资产分两层。** 任务、Escrow 与账本结算仍用 EVM 上的 USDC / USDT。DoerFlow 钱包同时还持有并收付 ETH、BTC，以及非 EVM 稳定币（先做 Tron USDT）。BTC 不作任务计价单位
- **签名分两套，同一套助记词。** EVM 的 ETH / USDC / USDT 用 viem 转账。比特币与 Tron USDT 用本机的 `@tetherto/wdk-wallet-btc` 与 `@tetherto/wdk-wallet-tron` 派生地址并签名广播，不把助记词交给 WDK 的服务器
- 可选平台 Logto 会话仅用于平台门禁调用与套餐/组织展示；不能代表、解锁或恢复钱包  
- 首页（平台会话提示、快速体验）文案走 en/zh locale
- 同一 Platform Account 可切换个人/组织 Workspace，并管理多个 Linked Wallet；钱包绑定必须是平台 JWT + 新鲜 SIWE
- UI 只按 API 返回的 capabilities/permissions 启用动作，不允许“发布者/接单者”切换器授予权限

### FR-WLT-002 转账交易
- 地址转账：ETH、USDC、USDT、BTC、Tron USDT。扫码 v0.4  
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
- 余额统一展示 `available`、`held`、`pending`、`withdrawable`；流水展示 `gross`、`fee`、`royalty`、`net`
- 禁止把内部 `ledger.credit`、预留额或未清算余额显示为可提现；同一任务链上放款与账本入账必须互斥
- 导出（v0.4）  

### FR-WLT-003A 工作与原生证据迁入
- 工作页仅列出 `published`/可接任务；接单、交付、争议沿用 [WORKER.md](./WORKER.md) 的服务端状态机
- 相机、GPS、问卷、社交清单与截图分批从 worker 迁入；每项迁入需先达到行为、安全、i18n 与无障碍对等
- Android Accessibility Service 仅用于用户明确授权后的受限步骤引导；保持 `canRetrieveWindowContent=false`、无 auto-click、无节点抓取、无自动交付
- 公开测试网禁止回退公开 Hardhat 私钥；私钥、助记词、照片原件和不必要的设备数据不得上传

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
- DoerFlow 是平台交易收单方；法币与 KYC 由持牌方处理，平台不托管
- 购买 ETH 等资产默认打到 **本机 DoerFlow 钱包地址**；用户可改选已连接的外部钱包。买币文案先说到账钱包和持牌合作方，再说明任务结算与买币付款分开
- 买币只是入金工具；钱包本身（密钥、Vault、余额、结算）继续做深  
- 买币页文案走 en/zh locale  
- 无合作伙伴密钥时为 **stub**；课堂与本地默认 **不得** 打开真买币（无 Stripe/MoonPay 必做路径）  
- 见 [ONRAMP.md](./ONRAMP.md)  
- 买币、Swap 与 Bridge 是资金工具，不构成交易所主定位；首页不得以币价/投机交易为核心

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

- 栈屏 `/devices` 列出 HTTP `GET /devices` 库存（状态 chips + 搜索；kind / payee / label 缺失为 —；过滤后/总数走 i18n `devices.count` 的 `{{shown}}` / `{{total}}`）；**不是**链上 `DeviceRegistry`
- 入金（Fund）Tab 链到该页

## 4. 技术栈

React Native · Expo · expo-router · viem · Biome · 依赖 `api` 任务治理接口。

平台门禁调用可附加安全存储中的 OIDC access token，并区分 `401` / `402` / `403`。普通转账、收款、链上签名与协议费路径不依赖平台套餐。DoerFlow 无 Trial，wallet 不显示试用 CTA 或倒计时。Agent Session Key 页（`/session`）文案走 en/zh locale。

- Android 正式 APK 由 Meta `pnpm pack:publish` 发到 GitHub `DoerFlow/downloads`，主稳定文件名为 `DoerFlow-App.apk`（`releases/latest/download`）；`DoerFlow-Wallet.apk` 作为同一 APK 的兼容别名至少保留两个正式版本；**不**上 Play Store。
- 发布基线：移动核心流程须具备 TalkBack/VoiceOver 标签、正确焦点顺序、动态字体与减少动效；Android Accessibility Service 与这些残障无障碍要求是两套独立机制

## 5. 里程碑

| 版本 | 交付 |
|------|------|
| v0.3 | 历史钱包 + 发任务能力；统一 App 五 Tab 主壳与账户/Workspace/能力模型 |
| v0.4 | 渐进吸收 worker 大厅、详情、相机/GPS/问卷、社交清单与证据；WalletConnect、账单导出 |
| 后续两个正式版本 | worker 只做兼容/安全修复、迁移提示与深链；完成后退役 |
| v0.7 | Agent L2 原生桥 UI + 入金向导 |

---

*历史上 wallet 与 worker 分别承载发布和接单；自本版起以 `repos/wallet` 为统一 App 主壳，旧分工仅用于迁移期定位。*
