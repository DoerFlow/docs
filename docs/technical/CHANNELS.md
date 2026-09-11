---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 五通道任务经济（CHANNELS）

**版本**: v1.2-ecosystem-commerce · **最后更新**: 2026-09-05  
**关联**: [AGENT_RUNTIME.md](./AGENT_RUNTIME.md) · [ENDPOINT.md](./ENDPOINT.md) · [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md) · [luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

本文件展开 `SPEC.md` **FR-ST-006**：Agent 与 Agent、人、云 API、电脑/手机、物联网都可以完成任务并获取报酬。内核是同一套作业与结算，通道只替换发现协议与执行器。

本地验收：`pnpm run smoke:channels`（API 须已在 :13008；P0 校验 OpenAPI 含 `POST`/`GET /payments/receipts`（`status=pending|batched`）与 receipt `pending` / `{receiptId}` get / `apply-ledger` / `apply-ledger-batch`，以及 `POST /payments/ledger/snapshot`、`GET /payments/ledger/snapshots/latest` 与 `GET /payments/ledger/commits` / `{epoch}`）。

---

## 1. 通道矩阵（FR-CH-001）

| `channel` | 参与方 | 发现 | `executorKind` | 最低交付凭证 | 默认 `settlementRail` |
|-----------|--------|------|----------------|--------------|------------------------|
| `agent-agent` | Agent ↔ Agent | A2A Agent Card + `GET /a2a/tasks` | `agent-runtime` | artifact / CID / receipt | 微额 `ledger`；大额/争议 `escrow` |
| `agent-human` | Agent ↔ 人 | wallet 发布 · worker 大厅 | `human-worker` | 照片/GPS/问卷/`proofCid` | `escrow`（链下 stub 可先 `ledger`） |
| `agent-cloud` | Agent ↔ 云 API | OpenAPI + MCP + `/trading/catalog` | `cloud-adapter` | EIP-712 Receipt + job 执行结果 | `ledger` |
| `agent-endpoint` | Agent ↔ 电脑/手机 | `/endpoints` 注册与能力白名单 | `endpoint-agent` | 沙箱输出 hash | 微额 `ledger`；高风险 `escrow` |
| `agent-iot` | Agent ↔ 设备 | `/devices` 注册 + 心跳；跨产品走时间窗 REST | `iot-device` | telemetry / window digest hash | 数据流 `ledger`；任务型 `escrow` |

强制字段：每个作业必须带 `channel`、`executorKind`、`settlementRail`。缺失则拒绝执行。

**互斥**：同一订单必须选定一个 `executorKind`。人类 worker、Endpoint Agent、算力 Device Node、IoT 设备不得混用同一张任务卡。

---

## 2. 结算分流（FR-CH-002）

| 轨 | 何时 | 路径 |
|----|------|------|
| `ledger` | 高频、微额、低争议 | Session Key → EIP-712 Receipt → 链下账本 → Merkle Root → Vault |
| `escrow` | 任务型、大额、可争议 | 锁定 → 交付凭证 → 验收/仲裁 → 放款 |

禁止双付：同一 `correlation.jobId` 不得同时走账本入账与 Escrow 放款（已有链上 `onChainEscrowId` 则跳过 `ledgerSettled` 入账）。

---

## 3. 统一关联 ID（FR-CH-003）

| ID | 含义 |
|----|------|
| `taskId` | 治理任务（`platform_tasks.id`） |
| `jobId` | Trading 作业（`/trading/jobs/:id`） |
| `resourceId` | 收据绑定键，格式 `job:<jobId>` 或 `task:<taskId>` |
| `escrowId` | 平台预留 / 链上 Escrow |
| `receiptId` | 已验签 Receipt |
| `eventId` | 入站 CloudEvents `id`（与 `sourceProduct` 去重） |
| `sourceRef` / `sourceTenantId` | 源产品业务主键与租户 |
| `endpointId` / `deviceId` | 执行面实例 |

映射：A2A Task.id = `taskId`；MCP `create_job` 返回 `jobId` + `resourceId`；Endpoint/IoT 交付把输出 hash 写入 `deliverableNote` 或 Receipt `resourceId`。

---

## 4. 协议适配（不替代内核）

| 标准 | 职责 | 非职责 |
|------|------|--------|
| OpenAPI 3.1 | 产品事实 API（`GET /openapi.json`） | 结算 |
| MCP | Agent 调 DoerFlow 工具 | 市场、审批、支付账本 |
| A2A Agent Card | 跨组织发现与委托 | 绕过 `published` 门禁 |
| CloudEvents 1.0 | 企业 webhook 信封 | 同步 RPC |
| x402 | 可选公网 HTTP 402 入口 | 第二套清算合约 |

---

## 5. 实验室验收（本版）

| 条 | 证据 |
|----|------|
| P0 | `GET /channels` 返回五通道与 ID 约定 |
| P1 | catalog → quote → job → execute → Receipt → job `settled`；webhook 为 CloudEvents |
| **P1b Provider SDK** | SaaS 注册 HTTP Skill → 付款后 invoke 对方 URL（HMAC）→ 入账 |
| P2 | A2A Agent Card → claim `published` agent 任务 → deliver → 账本入账 |
| P3 | Endpoint 注册 / 心跳 / 白名单 `echo` 执行 |
| P4 | Device 注册 / 心跳 / telemetry hash → 账本入账 |

规模化 IoT 车桩/能源/冷链、完整 P2P、Matter 收款 **不在本版**。

---

## 6. 生态商业通道（FR-ST-007 / FR-XPROD-*）

`agent-cloud` 在兄弟产品上的约束：

| 项 | 规则 |
|----|------|
| Provider invoke | `Content-Type: application/cloudevents+json` · `type=com.doerflow.trading.job.invoke` · `X-DoerFlow-Signature: sha256=…` |
| 入站事件 | `POST /integrations/events` · CloudEvents 1.0 · `agent-commerce` 档位允许 VistaCast 告警与 SyncroBrain 事故/工单；`smart-site` 追加 DataLuminary 导出与 VistaRemote 介入回执（见 [SMART_SITE.md](./SMART_SITE.md)） |
| 设备入账 | `POST /integrations/syncrobrain/telemetry-credits` · `com.syncrobrain.telemetry-credit.v1` · 时间窗 digest → `ledger`（[SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md)）；**不**经 inbox 入账 |
| 跨租户读 | `production` 模式下 `GET /trading/jobs` 与 `GET /integrations/events` 均需鉴权 + 显式 `sourceTenantId`（FR-DEP-005） |
| Job 支付 | `awaiting_payment → authorized → running → succeeded → captured/settled`；5xx/超时 `voided`/`failed` |
| 授权 vs 入账 | `authorize` 预留预算与 nonce，**不**给 payee 入账；仅 2xx+output hash 后 `capture` |
| 回调 | durable outbox；签名 CloudEvents；**不**改源产品业务状态 |
| 任务 | 创建 Agent/Human 任务服从治理门禁；否则 `dispatchStatus=correlated`，不得伪称已创建 |
| 兼容 | 无 authorization 的实验室 Job 仍可用 `POST /payments/receipts` 后 `GET job` → `settled` |

验收：`pnpm run smoke:ecosystem-commerce`（别名 `smoke:ecosystem`；内置模拟 provider，覆盖两 `productCode` 的 sell + event + snapshot/proof）。
