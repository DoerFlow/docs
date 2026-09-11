---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 开发者接入（Agent Trading SDK · M4）

**版本**: v0.4 · **最后更新**: 2026-09-11  
**关联**: [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [ROADMAP.md](./ROADMAP.md) · [SPEC.md](./SPEC.md) §8.1

第三方 **无 App** 即可：发现 Skill → 报价 → Session Key 授权 → `signReceipt` → 链下记账 → 参与 Merkle 清算。

公开叙事页：[docs/developers/agent-trading-sdk](https://docs.doerflow.dev/developers/agent-trading-sdk)（`repos/docs`，非本文件自动同步）。

---

## 1. 包

| 语言 | 包 | 入口 |
|------|-----|------|
| TypeScript | `@vibe-agent/shared/sdk` | `repos/shared/src/sdk` |
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
| GET | `/openapi.json` | OpenAPI 3.1 |
| GET | `/trading/events?jobId=` | SSE 作业事件 |
| WS | `/trading/ws` | WebSocket 作业事件（`{"jobId"}` 订阅） |
| POST | `/payments/sessions` | 注册 Session Key（EIP-712 `SessionAuthorization`） |
| POST | `/payments/receipts` | 提交已签名收据（payer = session key） |
| POST | `/payments/receipts/:receiptId/apply-ledger` | 对已受理收据重试账本入账（Vault `DUPLICATE` 后补余额）；TS `applyReceiptLedger` |
| GET | `/payments/receipts/pending?limit=` | 待批量清算列表；TS `listPendingReceipts` |
| GET | `/payments/receipts/:receiptId` | 查询已存 Vault 收据（含 `ledgerApplied`）；缺失 `success: false` `NOT_FOUND`；TS `getReceipt` |
| GET | `/payments/ledger/balances?account=` | 链下余额 |
| POST | `/payments/ledger/snapshot?enqueue=0` | Merkle Root（`PaymentServiceGuard`） |
| GET | `/payments/ledger/proof?account=&asset=` | 强制提现 proof |
| GET | `/ready` | 生产就绪探针（k8s） |
| GET | `/live` | 存活探针 |
| POST | `/integrations/events` | CloudEvents inbox（VistaCast / SyncroBrain 任务事件） |
| POST | `/integrations/syncrobrain/telemetry-credits` | 时间窗 digest 账本入账（FR-IOT-008） |
| PUT | `/integrations/syncrobrain/payee-bindings` | assetId → checksum payee（实验室可 M2M 无 SIWE） |
| GET | `/integrations/syncrobrain/payee-bindings` | 查询 `(sourceTenantId, sourceId)` 绑定 |
| POST | `/devices/register` | P4 实验室设备 `{ kind?, label, payee }` |
| POST | `/devices/:id/heartbeat` | 设备心跳 |
| POST | `/devices/:id/telemetry` | `{ reading, unit? }` → telemetry hash + 账本入账 |
| GET | `/tokens/canonical?chainId=` | Lab canonical 目录；TS `listCanonicalTokens` |

企业回调：创建 job 时带 `callbackUrl`；结算后 POST **CloudEvents 1.0** JSON，头 `X-DoerFlow-Signature: sha256=<hmac>`（`TRADING_WEBHOOK_SECRET`）。信封含 `id` / `source` / `type` / `data`。

五通道实验室（P0–P4）：`GET /channels` · `GET /openapi.json` · `POST /mcp` · `GET /a2a/agent-card` · `POST /trading/jobs/:id/execute` · `/endpoints` · `/devices`。验收：`pnpm run smoke:channels`。

Provider SDK（第三方 App/SaaS **当卖家**）：`POST /trading/providers/skills` 注册 HTTP 端点；买家付款后 `execute` 才会 POST CloudEvents `com.doerflow.trading.job.invoke`；对方用返回的 `webhookSecret` 验 `X-DoerFlow-Signature`。

---

## 3. TypeScript 最短路径

```ts
import { DoerFlowClient } from "@vibe-agent/shared/sdk";
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

本机验收：`pnpm run smoke:m4`（API 须已启动；含 apply-ledger 重试：underfunded submit → DUPLICATE → 补余额后幂等 `applyReceiptLedger`）。五通道实验室：`pnpm run smoke:channels`。示例 Runtime：`pnpm run example:agent`。

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

EIP-712 签名优先用 TS SDK；Python `eth-account` extra 提供 `sign_receipt`。`submit_receipt` 返回 API `data`（含 `ledgerApplied` / `ledgerError`）；HTTP 200 时 `ledgerApplied` 仍可能为 false。此时勿重放同一签名体（Vault `DUPLICATE`）；补余额后 `POST /payments/receipts/:receiptId/apply-ledger`。

- `list_canonical_tokens(chain_id=None)` → `GET /tokens/canonical`（实验室只读目录，非 CCTP / LayerZero）
- `apply_receipt_ledger(receipt_id)` → `POST /payments/receipts/{receipt_id}/apply-ledger`（Vault 已受理后重试入账，勿重放同一签名体）
- `list_pending_receipts(limit=None)` → `GET /payments/receipts/pending`
- `get_receipt(receipt_id)` → `GET /payments/receipts/{id}`

---

## 4.1 Provider SDK（SaaS / 第三方 App）

第三方把自家 HTTP API 挂上 DoerFlow 出售（实验室，不写链上 SkillRegistry）：

```ts
import { DoerFlowClient, verifyDoerFlowWebhook } from "@vibe-agent/shared/sdk";

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
import { DoerFlowClient } from "@vibe-agent/shared/sdk";

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

## 5. AI 验收（M4）

> ① SDK 在无 App 情况下完成至少一笔链下微支付记账并出现在 Merkle 快照 / proof 中；另覆盖 apply-ledger 重试（submit `ledgerApplied: false` → Vault `DUPLICATE` → 补余额后 `applyReceiptLedger` 幂等 true）；  
> ② 人类发单→审批→接单→结算由 `pnpm run smoke:m3` 覆盖；  
> ③ 本页 + 公开 `agent-trading-sdk` 可按步骤复现。
