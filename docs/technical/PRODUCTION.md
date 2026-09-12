---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 生产就绪（M5 工程闸门）

**版本**: v1.0-rc · **最后更新**: 2026-09-09  
**关联**: [ROADMAP.md](./ROADMAP.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [COMMERCIAL.md](./COMMERCIAL.md) · [ONRAMP.md](./ONRAMP.md)

本文件是 **AI 可自动验收** 的生产工程清单。  
**不能** 用 Creator DApp 迭代代替：主网真实地址与资金须人类部署。  
封闭 Beta **先运行**：不把审计、Bounty、商店签名、多人 SRE 当收款前置。前期 **明确不予赔付**（FR-PAY-017）。

---

## 1. 探针

| 路径 | 用途 | 状态码 |
|------|------|--------|
| `GET /api/v1/live` | 进程存活；容器 liveness | 恒 **200** |
| `GET /api/v1/ready` | SQLite 任务库 / Postgres 账本+链上索引(Agent/Skill/Escrow)+Receipt Vault+Session / 披露可读 | 就绪 **200**；**降级 `503`**（FR-DEP-003） |
| `GET /api/v1/version` | 服务名 / 版本 / `gitSha` / `chainId` / `profile` / `manifestHash` | 200 |
| `GET /api/v1/capabilities` | 能力清单（AuthN 双轨、Entitlement、入站事件、`autoRemoteControl`/`autoResolve`） | 200 |
| `GET /api/v1/health` | 链配置 + Indexer 游标 | 200 |
| `GET /api/v1/payments/disclosure` | 异步支付模型与强制提现路径 | 200 |

**`/ready` 不再用 200 表示降级**：返回 200 的降级会让负载均衡把流量打进坏副本，Prometheus 的 `probe_success` 也看不出问题。`live` 保持 200，容器不会被反复重启。

监控：Prometheus 抓 `ready`/`health`；告警规则见 `deploy/prometheus/alerts.yml`。部署档位与 Compose 叠加见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

## 2. 生产环境变量（禁止默认值）

复制 `deploy/production.env.example`。硬性：

| 变量 | 要求 |
|------|------|
| `NODE_ENV` | `production` |
| `DB_SYNCHRONIZE` | `false`（只跑 migration） |
| `PAYMENT_SERVICE_JWT_SECRET` | 强随机；禁止 lab 默认 |
| `SIWE_JWT_SECRET` / `PLATFORM_JWT_SECRET` | 非 `dev-*` |
| `LEDGER_STORE` | `postgres` + `LEDGER_DATABASE_URL`（与本地默认相同；禁止生产用 `memory`） |
| `COMMIT_ROOT_QUEUE` | `bull` + `REDIS_URL` + `SETTLER_OPERATOR_KEY`（生产禁止 `off`） |
| `CORS_ORIGIN` | 显式 allowlist，禁止 `*` |
| `TRADING_WEBHOOK_SECRET` | 企业回调 HMAC |
| `INDEXER_ROLE` | 生产 API 用 `http`；另起 `worker` 进程追块 |
| `REDIS_URL` | BullMQ **与** Indexer 选主/心跳共用 |
| `COMMERCIAL_MODE` | `off`（仅测试网）· `beta` · `public`。**`CHAIN_ID=8453` 禁止 `off`** |
| `COMMERCIAL_ALLOWLIST` | `beta` 必填：逗号分隔地址 |
| `MAX_VAULT_DEPOSIT_USDC` | 单笔 Vault 入账上限；默认 **100** |
| `MAX_ADDRESS_EXPOSURE_USDC` | 单地址账本净敞口；默认 **500** |
| `MAX_TVL_USDC` | 全局账本 TVL；默认 **5,000** |
| `MAX_ESCROW_ETH` | 单笔 Escrow；默认 **0.05** |
| `PAYMENTS_PAUSED` | `true` 时拒绝 credit / credit-batch / receipts；snapshot、proof、健康检查仍可用 |
| `COMMERCIAL_AUDITED` | 默认 false；审计报告公开后才可 `true`（M5b） |
| `COMMERCIAL_COMPENSATION` | 默认 **`none`**（不予赔付）。仅当有可支付赏金池时改为 `bounty` |
| `DEPLOYMENT_PROFILE` | `standalone` \| `control-plane` \| `agent-commerce` \| `smart-site`；未设置按 `standalone`（见 [DEPLOYMENT.md](./DEPLOYMENT.md)） |
| `COMMERCE_AUTH_MODE` | 生产必须 `production`；**`NODE_ENV=production` 时 `lab`/`off` 启动即失败** |
| `ENTITLEMENT_MODE` | `standalone` 可 `off` / `offline_license`；其余档位必须 `shadow_read`/`enforce` |
| `ENTITLEMENT_BASE_URL` | 非 `standalone` 必填；服务名或域名 + `:3040`，**禁止** `host.docker.internal` |

**启动期 fail-closed**（FR-DEP-004）：上面几条由 capability manifest 在 bootstrap 校验，配置矛盾时进程直接退出，不进入「跑起来但不安全」状态。

主网 Vault **资产必须是** Base 原生 USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`。部署脚本在 chainId 8453 **禁止**再部 MockERC20。

---

## 3. 主网部署（脚本就绪，资金人工）

Hardhat 网络 `base`（chainId **8453**）。部署顺序与 Sepolia 相同：AgentNFT → SkillRegistry → Escrow → SessionKeyRegistry → Mock 仅测试网 → PaymentVault → MicroPaymentSettler → CreditLineNetting → SettlementBatcher → LabEntryPoint → SettlementPaymaster。

**主网强制治理（multisig + Timelock）**：

| 角色 | 谁持有 | 说明 |
|------|--------|------|
| **admin / owner** | `DoerFlowTimelock`（proposer = `SimpleMultisig` 或 Gnosis Safe） | `setSettler` / `setOperator` / `setAdmin` / `transferOwnership` |
| **operator**（热钥） | `SETTLER_OPERATOR_KEY`（api 进程） | 仅 `commitRoot` / `settleNetBatch` / Batcher；**不**持有升级/换钥权 |
| **minDelay** | `GOVERNANCE_MIN_DELAY` | 主网默认 **2 天**（172800）；测试网可 1s |

1. 设置 `DEPLOYER_PRIVATE_KEY` 与主网 `RPC_URL`（不得写入 Git）  
2. 设置 `GOVERNANCE=1`、`GOVERNANCE_SIGNERS`（逗号分隔）、`GOVERNANCE_THRESHOLD`、`GOVERNANCE_MIN_DELAY`  
3. `pnpm --dir repos/contracts compile`  
4. 人工确认余额与 **multisig 签名人** 后再 `deploy`（chainId 8453 默认开启治理）  
5. `export-abi` → 写入 `repos/api/deployments.json` 的 `"8453"` 键  
6. 公开披露地址（docs + `/payments/disclosure`），含 Timelock / Multisig

**当前**：Base Sepolia 已部署（见 ROADMAP）；Base Mainnet 地址在资金到位并真实部署前 **不得填写伪造地址**。封闭 Beta 也必须是真地址。

### 3.1 人类一次部署（M5a，不代执行）

准备：Base ETH（部署 + operator gas）、multisig 2–3 签名人、生产域名/TLS、Logto 生产租户、VPS 或同等主机、受邀地址列表。

1. `GOVERNANCE=1` `VAULT_ASSET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` 部署核心合约 + Vault + Settler + Netting/Batcher  
2. 把真实地址写入 `repos/api/deployments.json` 的 `"8453"`（含 `vault.asset`）  
3. `pnpm run use:base`（缺 8453 则失败）  
4. 复制 `deploy/production.env.example` → `deploy/env/api.env`：`COMMERCIAL_MODE=beta`、白名单、限额、`INDEXER_ROLE=http`、`DEPLOYMENT_PROFILE`、`COMMERCE_AUTH_MODE=production`；再按 `deploy/env/*.example` 填 `indexer.env` / `db.env`（口令只在 db.env）  
5. `docker compose -f deploy/docker-compose.core.yml -f deploy/docker-compose.prod.yml up -d`（API + indexer + Postgres + Redis；DB **不**映射宿主端口）。托管 DB 用 `-f deploy/docker-compose.external-db.yml`；控制面档位再叠 `-f deploy/docker-compose.control-plane.yml`  
6. `pnpm run compose:preflight` 绿灯（无 `container_name` / `host.docker.internal`、生产 DB 未暴露）  
7. 白名单钱包小额 Vault 充值 / Escrow 锁定 → 再请受邀用户  

`pnpm run smoke:vault` 须在 **Sepolia** 先绿灯（deposit → snapshot/`commitRoot` → `forceWithdraw`）。

---

## 4. 运维 Runbook

| 项 | 做法 |
|----|------|
| **备份** | SQLite：停写后拷贝 `SQLITE_PATH`（任务/Casbin/用户）。Postgres：`pg_dump` 日备 + WAL（账本 **与** Agent/Skill/Escrow 索引行、`indexer_cursors`）。Proofs `PROOFS_DIR` / IPFS 本地目录一并备份 |
| **Root 提交值班** | `GET /payments/ledger/commits?status=pending`；超时未上链告警；`SETTLER_OPERATOR_KEY` 仅 api 进程 |
| **强制提现演练** | 用最新 epoch `GET /payments/ledger/proof` 在 Hardhat/Sepolia 调 `forceWithdraw`；主网演练用小额 |
| **Indexer** | 生产：`INDEXER_ROLE=http` 的 API ×N + `pnpm start:indexer` worker ×1（可再起 standby，Redis 锁保证单 leader）。`health.indexer.leader` 为 false 超过 30s 告警；游标与 Agent/Skill/Escrow 行在账本 Postgres。可切 `RPC_URL`。平台任务等仍在 SQLite |
| **密钥轮换** | Payment service JWT、SIWE、webhook HMAC 分轨轮换；Settler **admin** 经 Timelock 换热 operator |
| **治理演练** | 本地 `GOVERNANCE=1 pnpm deploy:vault`：Multisig `submit`→`confirm`→Timelock `schedule`→`execute` 才能 `setOperator` |

---

## 5. 产品与合规披露

- Onramp：平台不碰法币/KYC，见 [ONRAMP.md](./ONRAMP.md)  
- 链下 IOU：最终清算在公链稳定币；用户可 Merkle 强制提现（自助退出，不是平台赔付）  
- **前期不予赔付**（FR-PAY-017）：`COMMERCIAL_COMPENSATION=none`；disclosure `noCompensation=true`  
- wallet / worker / admin / web：生产构建命令见 MetaRepo `package.json`（`build:wallet*`、各仓 `pnpm build`）  
- ABI / 测试网地址：`repos/api/deployments.json` + ROADMAP Sepolia 表  

内部预审（非外部审计）：`pnpm --dir repos/contracts test`、`pnpm --dir repos/api test:m2`、本仓库 `pnpm run smoke:m5`。

---

## 6. 人类门槛（AI 不伪造）

| 项 | M5a 封闭 Beta | 称「商业版 1.0」 |
|----|----------------|------------------|
| Base Mainnet 真实部署与资金 | **要** | 要 |
| 邀请制 + 限额 + pause + 未审计披露 | **要** | 可放开白名单 |
| **明确不予赔付**（FR-PAY-017） | **要**（默认） | 仍默认；有赏金池才改 `bounty` |
| 创始人 on-call | **要** | 建议保留 |
| 外部审计报告 | 不阻塞收款 | 建议有再称呼 1.0 |
| Bug Bounty 平台 / 赏金池 | **不上**（赔付不起） | 有资金后再开 |
| 24/7 多人 SRE / 商店签名 | **不要** | 可选 |

**M5a** 必须：邀请制、限额、未审计披露、可 pause、**不予赔付**文案。

---

## 7. AI 验收

```bash
pnpm run compose:config     # 四种 overlay 组合的 docker compose config 语法校验
pnpm run compose:preflight  # Compose 硬约束静态断言（不需要 Docker 守护进程）
pnpm run smoke:m5
pnpm run smoke:vault   # Sepolia；需测试 ETH / Mock USDC 与 operator 钥
```

`smoke:m5` 检查：生产文档与 env 模板（含 `COMMERCIAL_MODE`）、Hardhat `base`、探针与 disclosure（含 `/ready` 状态码与 `/version` 的 `profile`/`manifestHash`）、OpenAPI 源文件字符串（`/payments/sessions` 与 `/payments/sessions/{id}/revoke`、收据重试路径含 `apply-ledger-batch`、`GET /payments/receipts` 的 `pending|batched`、`GET /payments/receipts/stats`、`POST /payments/ledger/credit` / `credit-batch`、`GET /payments/ledger/balances`、`/payments/ledger/snapshot` + `batchedCount`、`/payments/ledger/snapshots/latest`、`/payments/ledger/commits`、`GET /payments/health`、`POST /payments/commercial/assert`、`GET /payments/ledger/nets`、`POST /payments/ledger/net-settle`、`POST /payments/ledger/bundle`、`/fees/tiers`、`GET /onramp/health` · `/onramp/disclosure` · `/onramp/providers`、`POST /onramp/session`、以及 `POST /devices/register` · `/devices/{id}/heartbeat` · `/devices/{id}/telemetry`）、静态 T0–T3 单测文件 `fees.service.spec.ts`、M4 SDK、compose 基座与 overlay、`use:base`。  
`smoke:vault` 检查：已部署 Sepolia Vault 上真实 `deposit` → `commitRoot` → `forceWithdraw`。

---

## 8. M5a 检查表（封闭 Beta）

- [ ] `COMMERCIAL_MODE=beta` 且 `COMMERCIAL_ALLOWLIST` 非空（托管环境真人配置，AI 不勾）
- [x] 非白名单写路径 → `403 COMMERCIAL_NOT_ALLOWLISTED`（`commercial.service.spec.ts`）
- [x] 超额 → `403 COMMERCIAL_CAP_EXCEEDED`（单笔 / 地址敞口 / TVL / Escrow；同上）
- [x] `PAYMENTS_PAUSED=true` 或 Vault `pause()` 后无法新充值；`forceWithdraw` 仍可用
- [x] web `/payments` 与雇佣页展示未审计封闭测试文案（限额 / 白名单 / pause；**不**反复展示不予赔付）
- [x] 不予赔付仅出现在文档 `legal/terms` 与注册/登录勾选协议
- [x] `GET /payments/disclosure` 含 `commercialMode`、`unaudited`、`compensationPolicy`/`noCompensation`、限额
- [x] `pnpm run use:base` 在无 `"8453"` 时失败
- [ ] 未填写伪造主网地址（`deployments.json` 当前无 `"8453"`；真人确认后才可勾。禁止填假地址）
- [x] `/ready` 降级返回 **503**，`/live` 仍 200
- [x] `/version` 的 `profile` 与实际 `DEPLOYMENT_PROFILE` 一致；`/capabilities` 未开档位的 `integrations.inbound` 为空
- [x] `COMMERCE_AUTH_MODE=production`；`lab`/`off` 在 `NODE_ENV=production` 下启动失败
- [x] 生产 compose 的 `postgres` / `redis` 无 `ports:`；无 `container_name` / `host.docker.internal`

工程闸门证据（非托管 live）：`pnpm run smoke:m5` → `scripts/m5-production-gate.mjs`（探针 503/200、`/version` profile+manifestHash、disclosure 字段、`autoRemoteControl`/`autoResolve` 恒 false、compose preflight、无 `"8453"` 时不伪造）；`compose:preflight`；`use-chain.mjs` `ensureBaseProfiles`；`commercial-config.spec.ts`；`commercial.service.spec.ts`（`COMMERCIAL_NOT_ALLOWLISTED` / `COMMERCIAL_CAP_EXCEEDED` / `PAYMENTS_PAUSED`）；`deployment-profile.spec.ts`；`probe.controller.spec.ts`；`PaymentVault.t.ts`（`pause()` 拦 deposit、`forceWithdraw` 仍可用）。web `CommercialBanner` 在 `/payments` 与雇佣页展示未审计/限额/白名单/pause，不展示不予赔付；不予赔付在 `repos/docs/docs/legal/terms.md` 与 web `/login`、wallet、worker 勾选协议。  

公开收款与审计包见 [COMMERCIAL.md](./COMMERCIAL.md)（M5b）。
