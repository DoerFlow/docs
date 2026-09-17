---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 开发者接入（Agent Trading SDK · M4）

**版本**: v0.4 · **最后更新**: 2026-09-17  
**关联**: [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [ROADMAP.md](./ROADMAP.md) · [SPEC.md](./SPEC.md) §8.1

第三方 **无 App** 即可：发现 Skill → 报价 → Session Key 授权 → `signReceipt` → 链下记账 → 参与 Merkle 清算。

公开叙事页：[docs/developers/agent-trading-sdk](https://docs.doerflow.dev/developers/agent-trading-sdk)（`repos/docs`，非本文件自动同步）。

产品内 Creator 控制台为 web `/developers`（Key、HTTP Skill 注册、作业/收据表）；无头 Agent 仍以 SDK 为主。见 [CLIENTS.md](./CLIENTS.md)。

---

## 1. 包

| 语言 | 包 | 入口 |
|------|-----|------|
| TypeScript | `@doerflow/shared/sdk` | `repos/shared/src/sdk` |
| Python | `doerflow` | MetaRepo `sdk/python` |

底层收据类型仍从 `@vibe-agent/shared/payments` 导出（`signReceipt` / Merkle）。

---

## 2. REST（`/api/v1`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/trading/catalog` | Agent + Skill 目录；无链上 Skill 时含 `demo` 技能 |
| POST | `/trading/quote` | `{ skillId, units }` → 金额、资产、payee、`resourceId` |
| POST | `/trading/jobs` | 创建计费作业；返回 `jobId` + 须写入收据的 `resourceId`（SQLite 持久化） |
| POST | `/trading/providers/skills` | 注册 HTTP Skill；返回 `skillId` + **一次性** `webhookSecret` |
| POST | `/trading/jobs/:id/execute` | 云适配器；HTTP Skill **须已有 Receipt** 才转发 |
| GET | `/trading/jobs/:id` | 作业状态（`open` → `settled` 当收据 `resourceId` 匹配） |
| GET | `/channels` | 五通道矩阵 |
| GET | `/openapi.json` | OpenAPI 3.1（lists receipt `GET/POST` + `pending` / `{receiptId}` get / `apply-ledger` / `apply-ledger-batch`, plus `POST /payments/ledger/snapshot` with `data.batchedCount`, `GET /payments/ledger/snapshots/latest` / `commits` / `commits/{epoch}` / `proof`, `GET /payments/disclosure`, and `GET /fees/tiers`） |
| GET | `/trading/events?jobId=` | SSE 作业事件 |
| WS | `/trading/ws` | WebSocket 作业事件（`{"jobId"}` 订阅） |
| POST | `/payments/sessions` | 注册 Session Key（EIP-712 `SessionAuthorization`） |
| GET | `/payments/sessions` | 列出会话；TS `listSessions` / Python `list_sessions` |
| POST | `/payments/sessions/:id/revoke` | 撤销会话；TS `revokeSession` / Python `revoke_session` |
| POST | `/payments/receipts` | 提交已签名收据（payer = session key） |
| POST | `/payments/receipts/apply-ledger-batch` | Lab 批量重试入账（`{ receiptIds? }` ≤50；省略则 pending 且 `ledgerApplied===false`）；返回 `data.results`；TS `applyReceiptLedgerBatch` |
| POST | `/payments/receipts/:receiptId/apply-ledger` | 对已受理收据重试账本入账（Vault `DUPLICATE` 后补余额）；TS `applyReceiptLedger` |
| GET | `/payments/receipts/pending?limit=&ledgerApplied=` | 待批量清算；可选 `ledgerApplied=true\|false`（omit=全部；非法值忽略）；TS `listPendingReceipts({ limit?, ledgerApplied? })`（数字首参仍为 limit） |
| GET | `/payments/receipts?status=&limit=` | 按 status 列表（`pending` \| `batched`；非法/省略 → `pending`）；含 `ledgerApplied`；形状同 pending；TS `listReceipts({ status?, limit? })` |
| GET | `/payments/receipts/:receiptId` | 查询已存 Vault 收据（含 `ledgerApplied`）；缺失 `success: false` `NOT_FOUND`；TS `getReceipt` |
| GET | `/payments/receipts/stats?payer=` | payer lastNonce / pendingCount；TS `payerReceiptStats` / Python `payer_receipt_stats` |
| GET | `/payments/ledger/balances?account=` | 链下余额 |
| POST | `/payments/ledger/credit` | 链下入账（PaymentServiceGuard）；TS `creditLedger` / Python `credit_ledger` |
| POST | `/payments/ledger/credit-batch` | 批量入账 `{ entries }` ≤10000；TS `creditLedgerBatch` / Python `credit_ledger_batch` |
| POST | `/payments/ledger/snapshot?enqueue=0` | Merkle Root + `batchedCount`（`PaymentServiceGuard`）；TS `snapshot` → `LedgerSnapshotResult` |
| GET | `/payments/ledger/snapshots/latest` | 最新 Root / epoch |
| GET | `/payments/ledger/commits?status=&limit=` | Root 上链任务列表；TS `listLedgerCommits({ status?, limit? })` |
| GET | `/payments/ledger/commits/:epoch` | 单 epoch 上链任务；缺失 `NOT_FOUND`；TS `getLedgerCommit` |
| GET | `/payments/ledger/nets` | 双向轧差预览；TS `listLedgerNets` / Python `list_ledger_nets` |
| POST | `/payments/ledger/net-settle` | 轧差上链并清零 pair gross（PaymentServiceGuard）；TS `settleLedgerNet` / Python `settle_ledger_net` |
| POST | `/payments/ledger/bundle?includeCommit=` | 打包待轧差 + 可选 commitRoot（PaymentServiceGuard）；TS `createLedgerBundle({ includeCommit? })` / Python `create_ledger_bundle` |
| GET | `/payments/ledger/proof?account=&asset=` | 强制提现 proof |
| GET | `/payments/health` | 支付模块健康（非 `/health`）；TS `paymentsHealth` / Python `payments_health` |
| GET | `/payments/disclosure` | 异步支付披露（含 `commercial`）；TS `disclosure` → `PaymentsDisclosure` / Python `payments_disclosure` |
| POST | `/payments/commercial/assert` | 商业白名单 / Escrow 限额预检 `{ address?, escrowWei? }`；TS `assertCommercial` / Python `assert_commercial` |
| GET | `/ready` | 生产就绪探针（k8s） |
| GET | `/live` | 存活探针 |
| POST | `/integrations/events` | CloudEvents inbox（VistaCast / SyncroBrain 任务事件） |
| POST | `/integrations/syncrobrain/telemetry-credits` | 时间窗 digest 账本入账（FR-IOT-008） |
| PUT | `/integrations/syncrobrain/payee-bindings` | assetId → checksum payee（实验室可 M2M 无 SIWE） |
| GET | `/integrations/syncrobrain/payee-bindings` | 查询 `(sourceTenantId, sourceId)` 绑定 |
| GET | `/devices` | 实验室设备列表；TS `listDevices` → `LabDevice[]` / Python `list_devices` |
| POST | `/devices/register` | P4 实验室设备 `{ kind?, label, payee }` |
| POST | `/devices/:id/heartbeat` | 设备心跳 |
| POST | `/devices/:id/telemetry` | `{ reading, unit? }` → telemetry hash + 账本入账 |
| GET | `/tokens/canonical?chainId=` | Lab canonical 目录；TS `listCanonicalTokens` |
| GET | `/fees/tiers` | 静态 AA 协议费等级表（T0–T3）；TS `listFeeTiers` / Python `list_fee_tiers`（非链上索引） |
| GET | `/onramp/health` | Onramp 模块健康（实验室，非 live charge）；TS `onrampHealth` / Python `onramp_health` |
| GET | `/onramp/disclosure` | 合规披露（非托管、无 PII）；TS `onrampDisclosure` / Python `onramp_disclosure` |
| GET | `/onramp/providers?country=` | 按地区伙伴列表；TS `listOnrampProviders` / Python `list_onramp_providers` |
| POST | `/onramp/session` | 签发 Widget session（`CreateOnrampSessionDto`，非 live charge）；TS `createOnrampSession` / Python `create_onramp_session` |
| GET | `/developers/me` | 当前套餐 + 限流档位（平台登录；FR-DEV-001/002） |
| GET | `/developers/keys` | 列出自己的 API Key（无明文） |
| POST | `/developers/keys` | 创建 Key；响应含**一次性** `token`（`dfk_live_` / `dfk_test_`） |
| POST | `/developers/keys/:id/rotate` | 轮换；明文一次性 |
| DELETE | `/developers/keys/:id` | 撤销 |
| GET | `/developers/skills` | 自己的 Provider Skill（不含 `webhookSecret`） |
| GET | `/developers/jobs` | 自己的最近作业 |
| GET | `/developers/receipts` | 最近收据只读 |

企业回调：创建 job 时带 `callbackUrl`；结算后 POST **CloudEvents 1.0** JSON，头 `X-DoerFlow-Signature: sha256=<hmac>`（`TRADING_WEBHOOK_SECRET`）。信封含 `id` / `source` / `type` / `data`。

五通道实验室（P0–P4）：`GET /channels` · `GET /openapi.json` · `POST /mcp` · `GET /a2a/agent-card` · `POST /trading/jobs/:id/execute` · `/endpoints` · `/devices`。验收：`pnpm run smoke:channels`。

Provider SDK（第三方 App/SaaS **当卖家**）：`POST /trading/providers/skills` 注册 HTTP 端点；买家付款后 `execute` 才会 POST CloudEvents `com.doerflow.trading.job.invoke`；对方用返回的 `webhookSecret` 验 `X-DoerFlow-Signature`。

---

## 3. TypeScript 最短路径

```ts
import { DoerFlowClient } from "@doerflow/shared/sdk";
import { privateKeyToAccount } from "viem/accounts";

const api = new DoerFlowClient({ baseUrl: "http://localhost:13008/api/v1" });
const owner = privateKeyToAccount(process.env.OWNER_KEY);
const session = privateKeyToAccount(process.env.SESSION_KEY);

const quote = await api.quote({ skillId: "0", units: 1 });
const job = await api.createJob({ skillId: quote.skillId, units: 1 });
await api.authorizeSession({
  owner,
  session,
  allowedPayees: [quote.payee],
  maxAmountPerCall: quote.amount,
  sessionBudget: quote.amount,
});
const paid = await api.payQuote({ session, quote, resourceId: job.resourceId });
// if paid.submitted.ledgerApplied === false: await api.applyReceiptLedger(paid.submitted.receiptId)
const snap = await api.snapshot({ serviceToken: process.env.PAYMENT_SERVICE_JWT, enqueue: false });
```

本机验收：`pnpm run smoke:m4`（API 须已启动；成功 `payQuote` 后覆盖 `getReceipt` / `listPendingReceipts`；含 apply-ledger 重试：underfunded submit → DUPLICATE → 补余额后 `applyReceiptLedgerBatch` 再幂等 `applyReceiptLedger`；snapshot 后断言 `batchedCount >= 1` 且 `GET /payments/receipts?status=batched` 含至少一笔本轮已入账 id）。五通道实验室：`pnpm run smoke:channels`。示例 Runtime：`pnpm run example:agent`。实验室烟测 `smoke:channels` / `smoke:m4` / `smoke:ecosystem-commerce` 软窥 Python `list_devices()`（空列表 OK；永不 `register_device`），适用处另软窥 TS `listDevices`。

小批量微收据实验室（N 笔 `payQuote` → 必要时 `applyReceiptLedgerBatch` → `snapshot` `enqueue=0`，日志 `batchedCount`）：`pnpm run example:micropay`（`scripts/example-micropay-batch.mjs`；`MICRO_N` 默认 5、上限 20；**API 须已在 :13008**；注册会话后软断言 `listSessions` 非空且含本实验室会话，**不**调用 `revokeSession`）。这是 lab N-receipt 演示，**不是** [IOT.md](./IOT.md) v0.5「100+ 模拟传感器」验收。

会话列表（可选软撤销）：`pnpm run example:sessions`（`scripts/example-sessions.mjs`；`listSessions` 实验室无需 JWT。仅当 `EXAMPLE_SESSIONS_REVOKE=1` 且 `EXAMPLE_SESSION_ID` 已设才调用 `revokeSession`）。**不是** IOT 100+ 传感器验收，也不勾选 BRIDGE Escrow。

链下账本入账：`pnpm run example:credit`（`scripts/example-credit.mjs`；TS `creditLedger` 后打印 `balances`；**API 须已在 :13008**；PaymentServiceGuard JWT）。实验室入账演示，**不是** IOT 100+ 传感器验收，也不勾选 BRIDGE Escrow。

轧差预览（可选上链结算）：`pnpm run example:nets`（`scripts/example-nets.mjs`；`listLedgerNets` 实验室无需 JWT。**仅当 `EXAMPLE_NETS_SETTLE=1`** 才调用 `settleLedgerNet`；**API 须已在 :13008**）。**不是** IOT 100+ 传感器验收，也不勾选 BRIDGE Escrow。

实验室 HTTP 设备列表：`pnpm run example:devices`（`scripts/example-devices.mjs`；`listDevices` 实验室无需 JWT。**仅当 `EXAMPLE_DEVICES_REGISTER=1`** 才调用 `registerDevice`；**API 须已在 :13008**）。**不是**链上 `DeviceRegistry`，也不勾选 IOT DeviceRegistry。

---

## 4. Python

```bash
pip install -e sdk/python
# 签名可选：pip install -e "sdk/python[sign]"
```

```python
from doerflow import DoerFlowClient, verify_webhook
client = DoerFlowClient("http://localhost:13008/api/v1")
print(client.catalog()["skills"][0]["skillId"])
print(client.quote("0", 1)["amount"])
# seller: client.register_provider_skill(name, endpoint_url, unit_price, payee)
# then verify_webhook(raw_body, signature, webhook_secret)
```

`pip install 'doerflow[sign]'` 后 Python 独立走完：`catalog → quote → create_job → authorize_session → pay_quote`（必要时 `apply_receipt_ledger`）。EIP-712 域与 TS 一致：收据 `VibeAgent`/`1`，会话 `VibeAgent Session`/`1`，`verifyingContract=0x000…0`。另有 `sign_receipt` / `sign_session_authorization`。`submit_receipt` 返回 API `data`（含 `ledgerApplied` / `ledgerError`）；HTTP 200 时 `ledgerApplied` 仍可能为 false。此时勿重放同一签名体（Vault `DUPLICATE`）；补余额后 `POST /payments/receipts/:receiptId/apply-ledger`。

- `list_canonical_tokens(chain_id=None)` → `GET /tokens/canonical`（实验室只读目录，非 CCTP / LayerZero）
- `list_fee_tiers()` → `GET /fees/tiers`（静态 AA 协议费等级表；非链上 FeeTierRegistry）
- `onramp_health()` → `GET /onramp/health`（实验室模块探针，非 live charge）
- `onramp_disclosure()` → `GET /onramp/disclosure`（非托管 / 无 PII）
- `list_onramp_providers(country=None)` → `GET /onramp/providers?country=`
- `create_onramp_session(wallet_address, chain_id, default_asset, country_code, fiat_currency=None, locale=None, provider_id=None)` → `POST /onramp/session`（body 对齐 `CreateOnrampSessionDto`；实验室 session，非 live charge）
- `list_sessions()` → `GET /payments/sessions`
- `revoke_session(session_id)` → `POST /payments/sessions/{id}/revoke`
- `apply_receipt_ledger(receipt_id)` → `POST /payments/receipts/{receipt_id}/apply-ledger`（Vault 已受理后重试入账，勿重放同一签名体）
- `apply_receipt_ledger_batch(receipt_ids=None)` → `POST /payments/receipts/apply-ledger-batch`（body `receiptIds?`；返回 `data.results`）
- `list_pending_receipts(limit=None, ledger_applied=None)` → `GET /payments/receipts/pending`（`ledgerApplied=true|false`）
- `list_receipts(status="pending", limit=None)` → `GET /payments/receipts?status=&limit=`
- `get_receipt(receipt_id)` → `GET /payments/receipts/{id}`
- `payer_receipt_stats(payer)` → `GET /payments/receipts/stats?payer=`
- `credit_ledger(account, asset, amount, token=None)` → `POST /payments/ledger/credit`（PaymentServiceGuard；`token` 或构造 `token=`）
- `credit_ledger_batch(items, token=None)` → `POST /payments/ledger/credit-batch`（body `{ entries }`）
- `list_ledger_commits(status=None, limit=None)` → `GET /payments/ledger/commits`
- `get_ledger_commit(epoch)` → `GET /payments/ledger/commits/{epoch}`
- `create_ledger_snapshot(enqueue=False)` → `POST /payments/ledger/snapshot`（`enqueue=False` → `?enqueue=0`；`True` 省略 query，对齐 TS）；**PaymentServiceGuard** 需 service JWT（构造 `DoerFlowClient(..., token=...)`，`_request` 已发 `Authorization: Bearer`）
- `latest_ledger_snapshot()` → `GET /payments/ledger/snapshots/latest`
- `payments_health()` → `GET /payments/health`（与 `health()` 的 `/health` 不同）
- `payments_disclosure()` → `GET /payments/disclosure`
- `assert_commercial(address=None, escrow_wei=None)` → `POST /payments/commercial/assert`

---

## 4.1 Provider SDK（SaaS / 第三方 App）

第三方把自家 HTTP API 挂上 DoerFlow 出售（实验室，不写链上 SkillRegistry）：

```ts
import { DoerFlowClient, verifyDoerFlowWebhook } from "@doerflow/shared/sdk";

const api = new DoerFlowClient({ baseUrl: "http://localhost:13008/api/v1" });
const skill = await api.registerProviderSkill({
  name: "Acme Summarize",
  endpointUrl: "https://api.acme.example/doerflow",
  unitPrice: "10000",
  payee: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
});
// 保存 skill.webhookSecret；列表/catalog 不再返回

// 对方服务收到 POST 后：
if (!verifyDoerFlowWebhook(rawBody, req.headers["x-doerflow-signature"], skill.webhookSecret)) {
  throw new Error("bad hmac");
}
```

规则：

1. `endpointUrl`：本机可用 `http://127.0.0.1`；非 loopback **必须 HTTPS**。禁止 `file:`、链路本地元数据地址。  
2. 买家 `payQuote` 成功后才 `executeJob`；未付款返回 `PAYMENT_REQUIRED`。  
3. 调用信封为 CloudEvents `com.doerflow.trading.job.invoke`，签名密钥为该 Skill 的 `webhookSecret`（不是全局 `TRADING_WEBHOOK_SECRET`）。  
4. 结算仍走 Receipt + 账本；对方 2xx 才标记 `execution.adapter=http-provider`。

本机验收含在 `pnpm run smoke:channels`（P1b）。

---

## 4.2 P4 实验室设备（register → heartbeat → telemetry）

实验室 HTTP 设备，**不是**链上 `DeviceRegistry` / 车桩收款。活路径证明：`pnpm run smoke:channels`（P4）。示例设备：`pnpm run example:device`（MetaRepo `scripts/example-device-runner.mjs`；实验室 REST，非 v1.2 稳定币充电）。

```ts
import { DoerFlowClient } from "@doerflow/shared/sdk";

const api = new DoerFlowClient({ baseUrl: "http://localhost:13008/api/v1" });
const device = await api.registerDevice({
  kind: "sensor",
  label: "lab-temp",
  payee: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
});
await api.heartbeatDevice(device.id);
const tel = await api.postDeviceTelemetry(device.id, { reading: "22.5", unit: "C" });
// tel.telemetryHash 以 sha256: 开头；payee 账本入账 credited
```

Python（可选）：

```python
from doerflow import DoerFlowClient
client = DoerFlowClient("http://localhost:13008/api/v1")
device = client.register_device("lab-temp", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", kind="sensor")
client.heartbeat_device(device["id"])
tel = client.post_device_telemetry(device["id"], "22.5", unit="C")
```

---

## 5. 客户正式接入（FR-DEV-001~006）

实验室 SDK（§3–4）已经能跑通一笔链下微支付。本节补的是**客户能自己接、能在生产跑、密钥可轮换、限流可计量**。不降低生产鉴权：`NODE_ENV=production` 下 `COMMERCE_AUTH_MODE=lab|off` 仍直接拒绝启动。

### 5.1 生产鉴权三条路径（FR-DEV-001）

| 路径 | 凭证 | 用途 |
|------|------|------|
| Logto M2M JWT | `aud=https://api.doerflow.local` + `integration.*` scope | 企业 / 已有 IdP |
| 平台人类 Bearer | Logto 用户 token + SIWE 钱包绑定 | 控制台操作、卖家注册 |
| **开发者 API Key** | `Authorization: Bearer dfk_live_…` 或 `X-DoerFlow-Key` | 云服务 / Agent 运行时，不必自建 Logto 应用 |

API Key 规则：

- 明文只在创建 / 轮换时返回一次；库里只存 SHA-256。
- 前缀 `dfk_test_`（非生产）/ `dfk_live_`（生产）。`NODE_ENV=production` 拒绝 `dfk_test_`。
- 主体绑定创建者的 Logto `sub`。后续 Entitlement / Casbin 仍按该 `sub` 判定，**Key 不能绕过套餐**。
- 卖家注册 Skill 仍要求 `integration.provider.register`（种子里 Enterprise）。Pro 用户可以调目录 / 报价 / 收据 / 作业，不能开卖。

### 5.2 限流与 SLA 档位（FR-DEV-002）

这是工程 SLA（配额 + 响应头），不是法律服务合同。

| 档位 | 来源 | 每分钟请求 | 并发作业 |
|------|------|------------|----------|
| `none` | 无有效套餐 | 30 | 2 |
| `pro` | Entitlement `effectivePlan=pro` | 300 | 20 |
| `ultra` / `enterprise` | 同上 | 1200 | 100 |

超限返回 **429** `RATE_LIMITED`，头：`X-RateLimit-Limit` / `Remaining` / `Reset`。实现优先 Redis（与账本同套），无 Redis 则进程内令牌桶（单实例实验室）。

### 5.3 开发者控制台（FR-DEV-003）

Creator DApp 路由 `/developers`（需登录；查询加载失败展示 Retry）：

- 创建 / 列出 / 撤销 API Key（明文一次性展示）
- 注册 / 列出自己的 Provider Skill；轮换 `webhookSecret`（明文一次性）
- 最近作业与收据只读表
- 当前套餐与限流档位只读

运营 admin **不**替代此页。Admin 继续只做平台治理。

### 5.4 Python 独立支付闭环（FR-DEV-004）

`pip install 'doerflow[sign]'` 后必须能独立完成，不再依赖 TS：

`catalog → quote → create_job → authorize_session → pay_quote →（必要时 apply_receipt_ledger）`

EIP-712 域必须与 `@vibe-agent/shared/payments` 字节一致：收据域 `VibeAgent` / `1`，会话域 `VibeAgent Session` / `1`，`verifyingContract=0x000…0`。

### 5.5 发布面（FR-DEV-005）

| 包 | 坐标 | 说明 |
|----|------|------|
| TypeScript | `@doerflow/shared`（export `./sdk`） | npm 组织 `doerflow`；`publishConfig.access=public` |
| Python | `doerflow` | `sdk/python`；补 PyPI 元数据 + workflow_dispatch |

自动发布（GitHub Actions）：

| 包 | 仓库 | Workflow | 触发 | Secret |
|----|------|----------|------|--------|
| `@doerflow/shared` | `doerflow/shared` | `.github/workflows/publish.yml` | tag `v*` 或手动 Run | `NPM_TOKEN`（或 npm Trusted Publisher） |
| `doerflow` | MetaRepo | `.github/workflows/publish-python.yml` | tag `py-v*` 或手动 Run | `PYPI_API_TOKEN`（或 PyPI Trusted Publisher） |

PR 仍只跑 dry-run（`.github/workflows/publish-packages.yml`），不会上架。

### 5.6 生产与主网（FR-DEV-006）

- 生产清单见 [PRODUCTION.md](./PRODUCTION.md) 与 `deploy/production.env.example`。
- **禁止 AI 填写 Base 主网合约地址。** 主网 Vault / Escrow 地址只能由部署脚本写入 `deployments.json`。
- 客户接入生产：`COMMERCE_AUTH_MODE` 不设或 `production` + Entitlement `enforce` + 开发者 Key 或 M2M。

## 6. AI 验收（M4）

> ① SDK 在无 App 情况下完成至少一笔链下微支付记账并出现在 Merkle 快照 / proof 中；另覆盖 apply-ledger 重试（submit `ledgerApplied: false` → Vault `DUPLICATE` → 补余额后 `applyReceiptLedger` 幂等 true）；  
> ② 人类发单→审批→接单→结算由 `pnpm run smoke:m3` 覆盖；  
> ③ 本页 + 公开 `agent-trading-sdk` 可按步骤复现。
