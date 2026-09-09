---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.ps1
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# SyncroBrain 遥测时间窗 → DoerFlow 账本入账

**版本**: v0.1-lab · **最后更新**: 2026-09-09  
**需求**: [FR-IOT-008](./traceability.md)  
**关联**: [IOT.md](./IOT.md) · [luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md) · [CHANNELS.md](./CHANNELS.md) `agent-iot` · [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)

本文件是 **「TB 遥测 → DoerFlow 链下账本入账」** 的 REST 合同。第一步只冻结这条入账路径；**不**在 DoerFlow 建 MQTT broker，**不**把 Matter 当结算轨，**不**把 ThingsBoard topic 当跨产品总线。

SyncroBrain 侧镜像：[SyncroBrain `spec/integrations/doerflow.md`](https://github.com/syncrobrain/syncrobrain/blob/main/spec/integrations/doerflow.md) · schema `contracts/schemas/doerflow-telemetry-credit.schema.json`。字段表冲突时 **以本文件为准**（钱在 DoerFlow）。

---

## 1. 链路

```text
设备 ──MQTT──► ThingsBoard CE（设备平面，SyncroBrain 拥有）
                 └── Gateway 时间窗聚合（digestSha256，无原始点序列）
                        └── HTTPS CloudEvents ──► DoerFlow
                              POST /api/v1/integrations/syncrobrain/telemetry-credits
                              └── 幂等 ledger.credit(payee)
```

| 产品 | 拥有 | 本步不拥有 |
|------|------|------------|
| SyncroBrain | TB 设备、MQTT、asset 主键、时间窗 digest | 账本、Escrow、payee 铸造 |
| DoerFlow | 链下账本、Merkle、payee 余额 | TB token、RPC、逐点遥测 |

已有两条跨产品路径 **不要混用**：

| 路径 | 钱怎么走 | HTTP |
|------|----------|------|
| **买入处置** | 告警/工单 → 任务 inbox | `POST /integrations/events`（`incident` / `work-order`） |
| **卖方 invoke** | DoerFlow 买家付款后调 Gateway | Gateway `POST /integrations/doerflow/invoke` |
| **本合同：设备入账** | 时间窗 digest 证明 → **给 payee 入账** | `POST /integrations/syncrobrain/telemetry-credits` |

`POST /integrations/events` **不得** 入账。收到 `com.syncrobrain.telemetry-credit.v1` 时返回 `400 USE_TELEMETRY_CREDIT_PATH`。  
`POST /devices/:id/telemetry` 仍是 P4 实验室直连设备，**不是** TB 网关合同。  
`POST /payments/ledger/credit` 是运维铸造（`PaymentServiceGuard`），Gateway **不得**持有 `payments:ledger:credit`。

---

## 2. REST

| 项 | 值 |
|----|----|
| 方法 / 路径 | `POST /api/v1/integrations/syncrobrain/telemetry-credits` |
| Content-Type | `application/cloudevents+json`（亦接受 `application/json`） |
| CloudEvents `type` | `com.syncrobrain.telemetry-credit.v1` |
| 鉴权 | 与 inbox 相同：`CommerceAuthGuard`。生产 M2M scope `integration.event.submit`；`COMMERCE_AUTH_MODE=lab\|off` 供本机 smoke |
| 档位 | `DEPLOYMENT_PROFILE=agent-commerce+`，或本机 `lab\|off`（与三类商业入站同一例外）。`standalone` + `production` **关** |
| 幂等 | CloudEvents `id`；去重键 `sourceProduct=syncrobrain` + `eventId`。账本 `operationId=telemetry-credit:{id}` |
| 结算轨 | 仅 `ledger`（实验室铸造式 `credit`，与 P4 相同；**不是** Job `capture`，也不是买方扣款） |

推荐 `id`：

```text
sb:telemetry-credit:{sourceTenantId}:{assetId}:{window.start}
```

长度 ≤ 128。同一租户 + 资产 + 时间窗重放必须返回 `deduped: true` 且 **不再加余额**。

可选回调：`data.callbackUrl` → durable outbox，类型 `com.doerflow.ledger.credited.v1`（HMAC `X-DoerFlow-Signature`）。**不得**带设备命令，**不得**要求对端 close Incident 或下发 TB RPC。

---

## 3. 信封（白名单）

`specversion` 必须 `1.0`。信封键仅：`specversion` · `id` · `source` · `type` · `time?` · `datacontenttype?` · `subject?` · `data`。

`data` **允许**：

| 字段 | 必需 | 说明 |
|------|------|------|
| `sourceTenantId` | 是 | SyncroBrain 项目/租户 |
| `sourceId` | 是 | **领域 assetId**（禁止 TB device token） |
| `sourceRef` | 否 | 如 `{projectId}:{assetId}:{windowStart}` |
| `orgId` | 否 | 组织映射 |
| `callbackUrl` | 否 | HTTPS（实验室允许 loopback HTTP） |
| `offeringCode` | 是 | 固定 `syncrobrain.telemetry-digest.v1` |
| `window.start` / `window.end` | 是 | RFC 3339；`end` > `start` |
| `digestSha256` | 是 | 64 位小写 hex；时间窗摘要，**不是**逐点 hash |
| `amount` | 是 | 正整数字符串（wei/最小单位，与 P4 `1000` 同形） |
| `asset` | 否 | 默认 `USDC`（符号或 `0x` 地址） |
| `payee` | 是 | EIP-55 / 任意 checksum 的 20 字节地址 |
| `sampleCount` / `assetCount` | 否 | 非负整数计数；**无** min/max/avg 序列 |
| `channel` | 否 | 默认 `agent-iot` |
| `settlementRail` | 否 | 若出现必须是 `ledger` |

`subject` 建议等于 `sourceId`。

**禁止**（出现即 `400 SENSITIVE_FIELD_REJECTED`）：`video` / `rtsp` / 凭据 / `mqtt*` / `token` / `tbDeviceId` / `deviceToken` / `series` / `reading(s)` / `value` / 原始点 / TelemetryEnvelope 全文。卖方 digest 的 `series[]` 聚合曲线也 **不得** 出现在本入账信封里——入账只带 hash 与计数。

实验室 **信任** Gateway 提供的 `payee`。生产映射表（asset → 已链接 SIWE 钱包）是后续步，本版不冻结。

---

## 4. 请求 / 响应例

```json
{
  "specversion": "1.0",
  "id": "sb:telemetry-credit:t1:asset-1:2026-09-09T00:00:00.000Z",
  "source": "syncrobrain/t1",
  "type": "com.syncrobrain.telemetry-credit.v1",
  "time": "2026-09-09T01:00:05.000Z",
  "datacontenttype": "application/json",
  "subject": "asset-1",
  "data": {
    "sourceTenantId": "t1",
    "sourceId": "asset-1",
    "sourceRef": "proj-1:asset-1:2026-09-09T00:00:00.000Z",
    "offeringCode": "syncrobrain.telemetry-digest.v1",
    "window": {
      "start": "2026-09-09T00:00:00.000Z",
      "end": "2026-09-09T01:00:00.000Z"
    },
    "digestSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "sampleCount": 12,
    "assetCount": 1,
    "amount": "1000",
    "asset": "USDC",
    "payee": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "channel": "agent-iot",
    "settlementRail": "ledger",
    "callbackUrl": "http://127.0.0.1:13200/api/v1/integrations/doerflow/callbacks"
  }
}
```

成功：

```json
{
  "success": true,
  "data": {
    "eventId": "sb:telemetry-credit:t1:asset-1:2026-09-09T00:00:00.000Z",
    "dispatchStatus": "credited",
    "deduped": false,
    "payee": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "amount": "1000",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "balance": "1000",
    "digestSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "channel": "agent-iot",
    "settlementRail": "ledger"
  }
}
```

| HTTP | code | 何时 |
|------|------|------|
| 200 | — | 入账或幂等重放（`deduped`） |
| 400 | `USE_TELEMETRY_CREDIT_PATH` | 误打到 `/integrations/events` |
| 400 | `EVENT_TYPE_NOT_ALLOWED` | 档位未开，或 `type` 不是本事件 |
| 400 | `INVALID_EVENT` / `SENSITIVE_FIELD_REJECTED` | 信封/白名单 |
| 401 | `COMMERCE_AUTH_REQUIRED` | 生产缺 M2M |
| 403 | `CROSS_TENANT` / `POLICY_DENIED` | 租户或 Casbin |

`GET /capabilities` 的 `integrations.settlement` 列出本 `type`（**不**并进任务 inbox 的 `integrations.inbound`）。

机器可读 schema：[schemas/syncrobrain-telemetry-credit.v1.schema.json](./schemas/syncrobrain-telemetry-credit.v1.schema.json)。

---

## 5. 明确不做（本步）

- DoerFlow 订阅 TB MQTT / 解析 `v1/devices/me/telemetry`
- 按遥测点计费、把 `series` 写进账本
- 自动注册 `/devices` 或链上 `DeviceRegistry`
- Gateway 在未设 `DOERFLOW_ENABLED=true` 时出站（必须 no-op）
- 把本事件当 Job `authorize`/`capture`（那是买方付费买 digest 的另一条路）

下一步（未立项实现）：Gateway 在 TB 遥测落入时间窗后 **聚合 digest** 再调本接口；asset↔payee 绑定表；真实买方扣款而非实验室铸造。

---

## 6. 验收

- [ ] 规范 + JSON Schema 与 SyncroBrain 镜像一致（无 TB topic / token）
- [ ] `POST /integrations/syncrobrain/telemetry-credits` 入账；相同 `id` 第二次 `deduped: true`、余额不变
- [ ] 带 `series` / `tbDeviceId` / MQTT 口令 → `SENSITIVE_FIELD_REJECTED`
- [ ] 同事件打到 `/integrations/events` → `USE_TELEMETRY_CREDIT_PATH`，不建任务、不入账
- [ ] 单元测试：`repos/api` `telemetry-credit.service.spec.ts`
