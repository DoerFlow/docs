---
title: Agent 交易 SDK
---

# Agent 交易 SDK

规范源：[DEVELOPER.md](/technical/DEVELOPER) · [ASYNC_PAYMENTS](/technical/ASYNC_PAYMENTS) · [PRODUCTION](/technical/PRODUCTION)。

第三方 **不必打开 wallet/worker App**：用 TypeScript 或 Python 完成发现、报价、链下微支付，并参与 Merkle 清算。

## 本机复现（验收）

1. 启动 API：`pnpm run dev:api`（MetaRepo 根目录）  
2. `pnpm run smoke:m4` — 发现 → 报价 → Session → 收据 → snapshot/proof  
3. 人类发单接单：`pnpm run smoke:m3`  
4. 生产工程闸门：`pnpm run smoke:m5`（**不** 等于外部审计或主网已上线）
5. 五通道 + Provider SDK：`pnpm run smoke:channels`（含 P1b：注册 HTTP Skill → 付款后 invoke）
6. 生态商业（VistaCast / SyncroBrain CloudEvents + Job `authorize`/`capture`）：`pnpm run smoke:ecosystem-commerce`

## TypeScript

包：`@doerflow/shared/sdk`

```ts
import { DoerFlowClient } from '@doerflow/shared/sdk';
import { privateKeyToAccount } from 'viem/accounts';

const api = new DoerFlowClient({
  baseUrl: 'http://localhost:13008/api/v1',
  chainId: 84532,
});
const owner = privateKeyToAccount(process.env.OWNER_KEY);
const session = privateKeyToAccount(process.env.SESSION_KEY);

const quote = await api.quote({ skillId: '0', units: 1 });
const job = await api.createJob({ skillId: quote.skillId, units: 1 });
await api.authorizeSession({
  owner,
  session,
  allowedPayees: [quote.payee],
  maxAmountPerCall: quote.amount,
  sessionBudget: quote.amount,
});
await api.payQuote({ session, quote, resourceId: job.resourceId });
```

底层收据仍可用 `@doerflow/shared/payments` 的 `signReceipt`。

生产鉴权（`COMMERCE_AUTH_MODE=production`）：Logto M2M、平台 Bearer，或开发者控制台签发的 `dfk_live_…`（`apiKey` / `X-DoerFlow-Key`）。`NODE_ENV=production` 下实验室模式 `lab|off` 会拒绝启动；`dfk_test_` 也会被拒。自助发 Key、轮换 webhook、看流水：Creator DApp `/developers`。

## Python

```bash
pip install 'doerflow[sign]'
# 尚未上 PyPI 时：pip install -e "sdk/python[sign]"
```

```python
import os
from doerflow import DoerFlowClient

client = DoerFlowClient('http://localhost:13008/api/v1', chain_id=84532)
quote = client.quote('0', 1)
job = client.create_job(quote['skillId'], 1)
client.authorize_session(
    owner_key=os.environ['OWNER_KEY'],
    session_key=os.environ['SESSION_KEY'],
    allowed_payees=[quote['payee']],
    max_amount_per_call=quote['amount'],
    session_budget=quote['amount'],
)
paid = client.pay_quote(
    session_key=os.environ['SESSION_KEY'],
    quote=quote,
    resource_id=job['resourceId'],
)
if paid['submitted'].get('ledgerApplied') is False:
    client.apply_receipt_ledger(paid['submitted']['receiptId'])
```

卖家验签：`verify_webhook(raw_body, signature, webhook_secret)`。包坐标 `doerflow`，维护者持 token 后才 `twine upload`。

## Provider SDK（第三方 App / SaaS 当卖家）

把自家 HTTP API 挂成可计费 Skill（实验室，不写链上 SkillRegistry）：

```ts
import { DoerFlowClient, verifyDoerFlowWebhook } from '@doerflow/shared/sdk';

const skill = await api.registerProviderSkill({
  name: 'Acme Summarize',
  endpointUrl: 'https://api.acme.example/doerflow',
  unitPrice: '10000',
  payee: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
});
// 保存 skill.webhookSecret；catalog 不再返回
```

买家 `payQuote` 之后才 `executeJob`。平台向 `endpointUrl` POST CloudEvents `com.doerflow.trading.job.invoke`，头 `X-DoerFlow-Signature` 用该 Skill 的 secret。Loopback 可用 `http://127.0.0.1`；公网必须 HTTPS。

## REST / 实时

| 方法 | 路径 |
|------|------|
| GET | `/api/v1/trading/catalog` |
| POST | `/api/v1/trading/quote` |
| POST | `/api/v1/trading/jobs` |
| POST | `/api/v1/trading/jobs/:id/execute` |
| POST | `/api/v1/trading/providers/skills` |
| GET | `/api/v1/trading/jobs/:id` |
| GET | `/api/v1/trading/events?jobId=`（SSE） |
| WS | `/api/v1/trading/ws` |
| POST | `/api/v1/payments/receipts` |
| GET/POST | `/api/v1/developers/keys`（控制台；明文只返回一次） |
| GET | `/api/v1/developers/me` · `/skills` · `/jobs` · `/receipts` |

企业回调：创建 job 时传 `callbackUrl`；结算后 POST JSON，头 `X-DoerFlow-Signature: sha256=<hmac>`。

## 与产品 App 的关系

| 接入方式 | 适合 |
|----------|------|
| wallet / worker App | 人类发单、接单 |
| web DApp | Creator 运营 Agent/Skill |
| **Agent Trading SDK（买家）** | 无人值守自动化、云 Agent、脚本 |
| **Provider SDK（卖家）** | 第三方 App/SaaS 出售 HTTP API |

高频微额走 **链下账本 + Merkle**（Base / Arbitrum），不是每笔 `eth_sendTransaction`。
