---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 需求追溯矩阵

将 `SPEC.md` 中的需求 ID 映射到实现仓库与模块，用于 Spec 驱动开发与 Code Review。

**最后更新**: 2026-09-10

| 需求 ID | 简述 | 主仓库 | 模块/路径 | 版本 |
|---------|------|--------|-----------|------|
| FR-ID-001 | Agent 铸造 | contracts + web | `AgentNFT.sol`；Studio `MintFlowPanel`（四步进度、pin 后可重试钱包） | v0.1 |
| FR-ID-002 | Agent 管理 | contracts + api | 合约 + `agents` 模块 | v0.1 |
| FR-ID-003 | 钱包集成 | web | `wagmi` injected + EIP-6963 选择；可选 thirdweb RPC（非 Connect） | v0.1 |
| FR-ID-003b | SIWE 登录 | api + web | `auth` 模块、`/account` | v0.1 🟡 |
| FR-ID-004 | 双身份 + 无 Trial 会员权益 | api, web, admin, wallet, worker | `platform/membership`、wallet-links、客户端 401/402/403 | v0.3 🟡 |
| FR-SK-001 | Skill 注册 | contracts + web | `SkillRegistry.sol`；Studio `MintFlowPanel` kind=skill（201 pin 后钱包确认） | v0.1 |
| FR-SK-002 | Skill 验证 | contracts | v0.2 EAS | v0.2 |
| FR-SK-003 | Skill 绑定 | contracts + web | Studio `MintFlowPanel` kind=bind（钱包→上链→Agent 可见） | v0.1 |
| FR-SK-004 | Skill 搜索 | api + web | `GET /skills?q=`、市场 Skill 列表 | v0.1 |
| FR-ST-001 | Escrow 创建 | contracts + web | `Escrow.sol`；雇佣等上链后再轮询新 escrowId | v0.1 |
| FR-ST-002 | 交付 | contracts + web + api | `EscrowDelivered` + 开放订单 `getEscrow` 刷新；任务中心摘要 | v0.1 |
| FR-ST-003 | 争议仲裁 | contracts, api, admin, wallet, worker | M3 平台工单 + `refundTimedOut`；DAO 分账 v0.4+ | **M3** 🟡 |
| FR-ST-004 | 分账 | contracts + web | 协议费 + 任务卡/工作台实收拆分 | v0.1+ |
| FR-IPFS-001 | 元数据 / 任务 CID pin | api + web | `storage` 默认 local；`STORAGE_BACKEND=pinata` 才走 Pinata | v0.1 ✅ |
| FR-P2P-001~004 | P2P | p2p | Beacon 等 | v0.2 |
| FR-DV-001~003 | 设备/人类任务 | api + wallet + worker | v0.3 | v0.3 |
| FR-WLT-* | 纯粹钱包 RN | wallet | 发任务、转账 | v0.3 |
| FR-WRK-* | 综合端 RN | worker | 众包 + 社交 | v0.3+ |
| FR-ADM-* | 管理平台 | admin | 审批、告警 | v0.3+ |
| FR-GOV-* | 任务治理 | api | `tasks` 模块 | MVP+ |
| FR-GOV-SUBMIT | 人类交付进入 `submitted` 再验收 | api, wallet, worker | `deliver` → `submitted`；`verify` 接受 `submitted\|verifying`；wallet 收益页验收按钮 | **v0.3 / M3** 🟡 |
| FR-UI-* | DApp 页面 | web | `pages/*` | v0.1 |
| FR-UI-001 | 公开市场（无需平台登录） | web | `pages/Home` 默认可雇佣 Agent + Skill 列表搜索、`/agents/:id` · en+zh | **v0.3 / M3** 🟡 |
| FR-UI-002 | Agent 详情雇佣进度 + 未绑定引导 | web | `pages/AgentDetail`、托管历史、自雇提示、`MintFlowPanel` kind=hire | v0.1 |
| FR-UI-004 | 任务中心待办队列 + 超时退款 | web | `pages/Tasks`、上链回执 + 状态对齐；人类任务只读列表 + wallet/worker CTA · locale | **v0.3 / M3** 🟡 |
| FR-UI-003 | Creator 工作台网络/gas 引导；托管收入 | web + MetaRepo | `NetworkGasAlert`、Studio `waitMined`、收入卡、`scripts/use-chain.mjs` · locale | **v0.3 / M3** 🟡 |
| FR-IDX-001 | 索引分片与游标 + RPC 健康 | api, web | `indexer/` 历史追块可走 RPC_URL、链头可选 thirdweb；`catchupPercent` | **v0.3 / M3** 🟡 |
| FR-IDX-002 | Indexer worker + Redis 选主 + PG 游标与索引行 | api | `INDEXER_ROLE` · `indexer.main.ts` · leader 锁 · `indexer_cursors` · `agents`/`skills`/`escrows` 在账本 Postgres | **v1.0-rc / HA** |
| FR-IOT-001 | 设备注册认证 | contracts + api | 链上 `DeviceRegistry` 仍为 v1.2+；实验室 HTTP `/devices` 见 FR-IOT-007 | v1.2+ |
| FR-IOT-002 | 车桩支付 | contracts | `IoTEscrow` | v0.4 |
| FR-IOT-003 | IoT SDK BYOD | shared / iot-sdk | 设备 SDK | v0.4 |
| FR-IOT-004 | 数据流微额 | contracts + api | `MicroPaymentStream` | v0.5 |
| FR-IOT-005 | 能源市场 | contracts | `EnergyMarket` | v0.6 |
| FR-IOT-006 | 冷链 SLA | contracts | `ConditionalFreight` | v0.6 |
| FR-CHAIN-001~006 | 激励/SDK（现成 L2）；自建链延期 | contracts | 见 AGENT_CHAIN.md | v0.7 / 远期 |
| FR-CHAIN-007 | Multisig + Timelock 持有合约 admin | contracts | `SimpleMultisig` · `DoerFlowTimelock` · `GOVERNANCE=1` | **v1.0 ✅** |
| FR-ECO-* | 生态激励 | contracts + docs | MasterChef、Grant | v0.7+ |
| FR-DEX-001a | AMM Factory/Pair/Router | contracts | `metadex/amm` | v0.15.0 ✅ |
| FR-DEX-001b | ve VotingEscrow/Voter/Gauge | contracts | `metadex/ve` | v0.15.0 ✅ |
| FR-DEX-001c | 部署 + export-abi | contracts, shared | `deploy-metadex` | v0.15.0 🟡 localhost ✅ · Sepolia 核心合约 ✅ MetaDEX 待部署 |
| FR-DEX-002 | Swap/Router API | api | `dex` Port 层 | v0.15.1 |
| FR-DEX-003 | 轻量 Pool 同步 | api | `TsDexPoolSync` | v0.15.1 |
| FR-DEX-004 | Rust Sidecar 替换 | api + dex-engine | `RustDexSidecar` | 盈利后 |
| FR-DEX-005 | 分析外接 | api | DataLuminary Adapter | v0.15.x |
| FR-DEX-UI-001 | Swap/LP/Vote UI | web | `/dex` | v0.15.2 |
| FR-BRIDGE-001 | Base 官方桥引导；lab canonical 只读列表 | wallet, web, api | deep link；`GET /api/v1/tokens/canonical`（非 Registry / 非 OP Stack） | v0.3 |
| FR-BRIDGE-002 | OP Stack + Standard Bridge | infrastructure, contracts | v0.7 | v0.7 |
| FR-BRIDGE-003 | CanonicalTokenRegistry | contracts | `bridge/` | v0.7 |
| FR-BRIDGE-004 | 桥状态 API Port | api | `bridge` 模块 | v0.7 |
| FR-BRIDGE-005 | 原生桥 UI | wallet, web | 存取款 | v0.7 |
| FR-BRIDGE-006 | Circle CCTP USDC | contracts, api | v0.8 | v0.8 |
| FR-BRIDGE-007 | LayerZero Skill 跨链 | contracts, api | v1.1 | v1.1 |
| FR-ONRAMP-001 | Onramp Port + shared | shared | `@vibe-agent/onramp` | v0.3 |
| FR-ONRAMP-002 | MoonPay + Stripe Adapter | wallet, web, api | Widget | v0.3 |
| FR-ONRAMP-003 | wallet 买币页 | wallet | WebView | v0.3 |
| FR-ONRAMP-004 | web Creator 买币 Modal | web | `/payments` `OnrampBuyModal` · GET `/onramp/providers` · POST `/onramp/session` · en+zh · 非 live charge | **v0.3 / M3** 🟡 |
| FR-ONRAMP-005 | 地区路由 + 披露 | api, docs | v0.3 | v0.3 |
| FR-ONRAMP-007 | 入金向导 Onramp+Bridge | wallet | v0.7 | v0.7 |
| FR-PAY-001 | 公链/现成 L2 only（弃联盟链） | spec, docs | **已定** | **已定** |
| FR-PAY-002 | EIP-712 Receipt schema | shared, api | v0.2 | v0.2 |
| FR-PAY-003 | Receipt Vault 验签与 nonce 去重 | api | **默认 Postgres**；`memory` 仅 `LEDGER_STORE=memory` | v0.2 ✅ |
| FR-PAY-004 | Session Key scoped 授权 | contracts, wallet, api | 链下策略默认 Postgres（与账本同库） | v0.3 ✅ |
| FR-PAY-005 | Session 预算与撤销 | contracts, api | 链下 spent 默认 Postgres | v0.3 ✅ |
| FR-PAY-009 | signReceipt SDK | shared, api, sdk/python | `@vibe-agent/shared/sdk` + `POST /payments/receipts` | **v0.4 / M4 ✅** |
| FR-PAY-014 | Trading API + 作业回调 | api | `/trading/catalog|quote|jobs` · SSE/WS · HMAC webhook | **v0.4 / M4 ✅** |
| FR-PAY-015 | 生产就绪探针与 Runbook | api, deploy, spec | `/ready` `/live` · `deploy/production.env.example` · PRODUCTION.md | **v1.0-rc / M5 ✅ 工程** |
| FR-PAY-016 | 封闭 Beta 商业控制 | api, contracts, web, spec | `COMMERCIAL_MODE` · allowlist · 限额 · Vault `pause` · 未审计披露 · `use:base` · `smoke:vault` | **M5a ✅ 工程** |
| FR-PAY-017 | 前期不予赔付 | docs, web, wallet, worker | 文档 `legal/terms` · 注册/登录勾选；disclosure 字段保留、资金页不横幅 | **M5a** |
| FR-PAY-018 | Job 授权收据 authorize/capture/void | api, shared | `/trading/jobs/:id/authorize|capture|void` · `payment_authorizations` · 5xx 不入账 | **生态商业** |
| FR-PAY-019 | Durable outbox 回调 | api | `outbox_callbacks` 替换 trading fire-and-forget | **生态商业** |
| FR-XPROD-001 | 双向价值流 VistaCast/SyncroBrain | spec, api | sell invoke + buy inbox CloudEvents | **生态商业** |
| FR-XPROD-002 | 租户隔离 / 无 PII / 旧 API 兼容 | spec, api | `sourceTenantId` · `CROSS_TENANT` · receipts 旧路径 | **生态商业** |
| FR-INT-001 | CloudEvents inbox | api | `POST /integrations/events` | **生态商业** |
| FR-INT-002 | sourceProduct+eventId 去重与映射 | api | `integration_events` | **生态商业** |
| FR-INT-003 | 治理门禁或 correlated（不得伪称已建任务） | api | TasksService 或 `dispatchStatus=correlated` | **生态商业** |
| FR-PRV-004 | Provider 元数据 product/offering/tenant/readiness | api, shared/sdk | `POST /trading/providers/skills` | **生态商业** |
| FR-PRV-005 | 生产 M2M+Entitlement+Casbin；lab/off smoke | api | `COMMERCE_AUTH_MODE` | **生态商业** |
| FR-PRV-006 | payee=平台主体+SIWE；生产禁止开放注册 | api | wallet_links；Logto ≠ 钱包 | **生态商业** |
| FR-UI-ECO-001 | Web 生态服务目录/来源/Job 结算 | web | `/ecosystem` · en+zh · 部署档位徽标 | **生态商业** |
| FR-DEP-001 | 四档部署边界 / 最小后端 | spec, api, deploy | `spec/DEPLOYMENT.md` · `deployment-profile.ts` · `DEPLOYMENT_PROFILE` | **部署边界** |
| FR-DEP-002 | Compose core/dev/prod/external-db/control-plane/smoke | deploy, MetaRepo | `deploy/docker-compose.*.yml` · `deploy/env/*` · `pnpm run compose:config\|preflight` | **部署边界** |
| FR-DEP-003 | `/ready` 降级返回 503 | api | `health/probe.controller.ts` | **部署边界** |
| FR-DEP-004 | `/version` + `/capabilities` 与启动期 fail-closed 校验 | api | `health/version.controller.ts` · `health/deployment-profile.ts` · `main.ts` | **部署边界** |
| FR-DEP-005 | Trading/Integrations 跨租户读写守卫一致 | api | `commerce/tenant-scope.ts` · trading/integrations controller | **部署边界** |
| FR-SITE-001 | smart-site 档位与稳定 env | spec, api | `spec/SMART_SITE.md` · `SMART_SITE_REMOTE_DEEP_LINK_TEMPLATE` | **smart-site 实验室** |
| FR-SITE-002 | 人工介入深链（不自动远控） | api | `commerce/smart-site.ts` · `remoteIntervention.mode="manual"` | **smart-site 实验室** |
| FR-SITE-003 | DataLuminary 导出事件最小契约 | api | `com.dataluminary.export.v1` · `integration_events` | **smart-site 实验室** |
| FR-SITE-004 | 不自动 resolve | api | 介入回执/导出不改终态 | **smart-site 实验室** |
| FR-SITE-005 | 无 runtime import（仅 CloudEvents + REST + OIDC） | api, spec | 深链为字符串模板 | **smart-site 实验室** |
| FR-PAY-006 | Merkle Root 批量清算 | contracts, api, shared | `MicroPaymentSettler` + `/ledger/snapshot`；10 万笔 → 1 Root | **v0.2 / M2** ✅ |
| FR-PAY-007 | 双向轧差净额 | contracts, api, shared | `CreditLineNetting` + `/ledger/nets` · Vault `internalTransfer` | **v1.0 ✅** |
| FR-PAY-008 | Bundler 微支付批次 | contracts, api | `SettlementBatcher` + `LabEntryPoint` + `SettlementPaymaster` · `/ledger/bundle` | **v1.0 ✅** |
| FR-PAY-010 | 状态通道拓展（非大厅默认） | contracts, p2p | v1.1+ | v1.1+ |
| FR-PAY-011 | 不做定制 L3 作微支付主路径 | spec | **已定** | **已定** |
| FR-PAY-012 | 链下记账引擎 + Vault 充提 | api, contracts | Fastify；默认 `LEDGER_STORE=postgres` + BullMQ；10 万笔引擎单测仍用 memory；显式 `memory` 仅无 Docker | **v0.2 / M2** ✅ |
| FR-PAY-013 | Merkle 强制提现 | contracts, shared | Hardhat 任意账户 `forceWithdraw`；Sepolia 已部署未重部 | **v0.2 / M2** ✅ |
| FR-WLT-001 | wallet 账户与首页 | wallet | 首页平台会话/快速体验 · 链名 en+zh | **v0.3 / M3** 🟡 |
| FR-WLT-002 | wallet ETH 转账（去演示化） | wallet | `/transfer` gas 估算 + 回执 + explorer · en+zh | **v0.3 / M3** 🟡 |
| FR-WLT-003 | wallet 收益：Escrow 锁定/放款/争议 | wallet | `earnings` 文案 en+zh；Escrow 错误 locale；争议输入框；fund/confirm/refund；**`submitted` 验收** · **进度只读 + 待办置顶** | **v0.3 / M3** 🟡 |
| FR-WLT-004 | wallet 发任务 + 驳回原因回显 | wallet, api | `earnings` 展示 `alertReason`；发布即时 Alert · **说明 / 线下地点** · **社交须声明平台与步骤** · **published 接单进度** · locale | **v0.3 / M3** 🟡 |
| FR-WLT-005 | 审批状态应用内通知 | wallet | `notifyStore` 轮询 mine（**assigned** + 交付 `submitted`）；系统 Push → v0.4 | **v0.3 / M3** 🟡 |
| FR-WLT-006 / FR-ONRAMP-003 | wallet 买币 Onramp | wallet, api | `/onramp` + `POST /onramp/session` · en+zh | **v0.3 / M3** 🟡 |
| FR-ST-001/002 | 链上 Escrow fund/release（平台任务） | wallet, worker, api, contracts | bind-onchain-escrow · create/fund · deliver · confirm · **`pnpm run smoke:escrow:local`**（Hardhat 31337）· **`pnpm run smoke:escrow`**（Sepolia 可选；拒绝 Hardhat 公开钥 / EIP-7702） | **v0.3 / M3** 🟡 |
| FR-WLT-008 | wallet Vault 充提 | wallet | `app/vault.tsx` + 入金 Tab · disclosure · en+zh | **v0.3 / M3** 🟡 |
| FR-ADM-001 | admin Logto 登录 | admin, api | 本地 `pnpm id:up`；`doerflow_admin` → Casbin；禁止 SIWE 冒充运营 | **v0.3 / M3** 🟡 |
| FR-ADM-003 | admin 审批工作台 | admin, api | approve 绑 Escrow 预留；request-revision → needs_revision · **社交展示 App/步骤** · locale | **v0.3 / M3** 🟡 |
| FR-ADM-004 | admin 自动审批监控 | admin, api | `/auto-approval` ← auto-decisions / escalate / mark-reviewed · locale | **v0.3 / M3** 🟡 |
| FR-ADM-009 | admin 治理参数 | admin, api | `/governance` ← GET/PUT governance/config；驱动 scoreTask · locale | **v0.3 / M3** 🟡 |
| FR-ADM-010 | admin 发单方观察/黑名单 | admin, api | `/publishers` ← aggregate + flag；黑名单禁发 · locale | **v0.3 / M3** 🟡 |
| FR-ADM-011 | admin 审计日志 | admin, api | `/audit` ← `GET /admin/audit`；审批/治理/拉黑落库 · locale | **v0.3 / M3** 🟡 |
| FR-ADM-012 | admin 争议仲裁工单 | admin, api | `/disputes` ← list/claim/resolve；`POST /tasks/:id/dispute` | **v0.3 / M3** 🟡 |
| FR-ADM-002 | admin 任务列表 | admin, api | `/tasks` ← GET /admin/tasks + 行内审批 · locale | **v0.3 / M3** 🟡 |
| FR-ADM-005 | admin 风控告警 | admin, api | `/risk-alerts` ← alerts + clear-alert · locale | **v0.3 / M3** 🟡 |
| FR-ADM-006 | admin 仪表盘 KPI | admin, api | `/dashboard` 真实 GMV ETH + 待审队列 + Indexer + 争议；图表 → DataLuminary · locale | **v0.3 / M3** 🟡 |
| FR-ADM-013 | admin 界面文案 locale | admin | `en` + `zh-CN`；禁止页面硬编码 fallback | **v0.3 / M3** 🟡 |
| FR-ADM-007 | admin 支付 Commits 运维 | admin | `/payments/commits` | **v0.3 / M3** 🟡 |
| FR-ADM-008 | admin 费率等级只读 | admin, api | `/payments/fees` ← `GET /fees/tiers` | **v0.3 / M3** 🟡 |
| FR-WRK-002/003/005 | worker published 大厅 + 相机/GPS/问卷交付 + Vault/账本 | worker, api | Expo 大厅 · proof · GPS · 社交清单 · accept **仅未接单** · 详情状态/待验收 · deliver → **submitted** · deliverEscrow · earnings **原生 ETH + 链上放款标记** · **en+zh** | **v0.3 / M3** 🟡 |
| FR-WRK-004 | worker 社交任务（清单+截图） | worker, wallet | `social/[id]` · 打开目标首页 · wallet 声明平台与步骤 · 人工审后上架 | **v0.3 / M3 要做** 🟡 |
| FR-WRK-010/011/012 | 社交步骤引导 Accessibility Service | worker | v0.4；**不是** 残障无障碍 | **v0.4** ⚪ |
| FR-A11Y | 聋哑盲等残障无障碍（读屏/字幕/WCAG） | 全客户端 | **前期不做**（至商业 1.0 前；单独立项后再议） | **不做** |
| FR-PAY-SETTLE | 任务完成链下放款 stub | api | `ledgerSettled` + LEDGER.credit(WETH wei) | **v0.3 / M3** 🟡 |
| FR-ST-005/006 | 账本清算主路径 + 场景矩阵 | spec, api, contracts | ASYNC_PAYMENTS · CHANNELS | **v0.2 / M2** · **v1.1-channels-lab** |
| FR-ST-007 | 跨产品 Job 与 CloudEvents 变现 | spec, api, shared, web | luminaryworks-ecosystem · authorize/capture · `/integrations/events` | **v1.2-ecosystem-commerce** |
| FR-CH-001~004 | 五通道、结算分流、统一 ID、交付凭证 | spec, api | `CHANNELS.md` · `GET /channels` · OpenAPI | **v1.1-channels-lab** ✅ |
| FR-RT-001~003 | Agent Runtime 循环、Session、工具策略 | spec, api, scripts | `AGENT_RUNTIME.md` · `/mcp` · `example-agent-runner.mjs` | **v1.1-channels-lab** ✅ |
| FR-A2A-001~002 | Agent Card + claim/complete 映射治理状态机 | api | `/a2a/*` · `POST /agent-tasks/:id/deliver` | **v1.1-channels-lab** ✅ |
| FR-CLD-001 | Cloud adapter 执行 + Receipt | api, shared/sdk | `POST /trading/jobs/:id/execute` · job SQLite | **v1.1-channels-lab** ✅ |
| FR-PRV-001 | 第三方 HTTP Skill 注册（SaaS/App） | api, shared/sdk, sdk/python | `POST /trading/providers/skills` | **v1.1-channels-lab** ✅ |
| FR-PRV-002 | 付款后才 invoke 对方 endpoint | api | execute 校验 Receipt；CloudEvents `job.invoke` | **v1.1-channels-lab** ✅ |
| FR-PRV-003 | 每 Skill HMAC + SSRF 限制 | api, shared/sdk | `verifyDoerFlowWebhook`；loopback HTTP / 公网 HTTPS | **v1.1-channels-lab** ✅ |
| FR-EP-001~003 | Endpoint 注册/心跳/白名单执行 | api | `/endpoints` · `ENDPOINT.md` | **v1.1-channels-lab** ✅ |
| FR-IOT-007 | 实验室 Device HTTP（非链上 Registry） | api, shared/sdk, sdk/python | `/devices` 注册·心跳·telemetry；SDK `registerDevice` / `heartbeatDevice` / `postDeviceTelemetry` | **v1.1-channels-lab** ✅ |
| FR-IOT-008 | TB 时间窗 digest → 账本入账 | spec, api, SyncroBrain Gateway | `POST /integrations/syncrobrain/telemetry-credits` · 可选 `data.payer` → `applyReceipt` · `PUT`/`GET …/payee-bindings` · Gateway UTC 窗闭合出站 · [SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md) | **实验室 REST + 出站 + asset↔payee 绑定 + 可选买方划转** |

## MVP v0.1 验收对照

| SPEC §11 条目 | 仓库 | 状态 |
|---------------|------|------|
| Agent 铸造与市场展示 | contracts, api, web | 进行中 |
| Skill 注册与绑定 | contracts, web | **v0.1** 代码就绪 / 需本机链 |
| Escrow 全流程 | contracts, api, web | **v0.1 ✅** `smoke:escrow:local` · `smoke:m3` |
| 任务治理双通道 | api, wallet, worker, admin | MVP+ |
| P2P Beacon | p2p | 未开始 |
| IoT 设备支付 | contracts, sdk | v0.4 |
| 链下账本 + Merkle（主线 M2） | api, contracts, shared | **v0.2** ✅ 实验室验收 |
| 客户端 wallet/worker/admin（主线 M3） | wallet, worker, admin, web | **v0.3 ✅ AI smoke:m3** |
| 赚钱场景 SDK/API/人类任务（主线 M4） | shared/sdk, api/trading, sdk/python | **v0.4 ✅ AI smoke:m4** |
| 工程生产闸门（主线 M5-rc） | api, deploy, spec/PRODUCTION | **v1.0-rc ✅ smoke:m5** |
| 五通道实验室 P0–P4 | spec CHANNELS/RUNTIME/ENDPOINT, api, scripts | **v1.1-channels-lab ✅ smoke:channels** |
| 封闭 Beta 商业控制（FR-PAY-016） | api, contracts, web, deploy | **M5a ✅ 工程** |
| 前期不予赔付（FR-PAY-017） | api, web, wallet, worker, docs | **M5a** |
| 生态商业（FR-ST-007 / FR-PAY-018） | api, shared, sdk/python, web | **`pnpm run smoke:ecosystem-commerce`** |
| 公开运行（取消邀请制） | 全仓 | **v1.0 / M5b** ⚪ 不阻塞于 Bounty |

变更需求时：**先改 SPEC.md 与本表，再改代码**。
