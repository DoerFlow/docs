---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.ps1
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# DoerFlow 与 LuminaryWorks AI 生态

> **品牌**：DoerFlow · **中文名**：智工网  
> **组织**：[github.com/doerflow](https://github.com/doerflow) · **域名**：[doerflow.dev](https://doerflow.dev)  
> 跨产品生态说明 · 协议内生态激励见 [ECOSYSTEM.md](./ECOSYSTEM.md)

规划摘要：[LuminaryWorks/spec/products/doerflow.md](https://github.com/LuminaryWorks/LuminaryWorks/blob/main/spec/products/doerflow.md)

## 本产品是什么

**DoerFlow** 是自主执行体（Agent 与 Human）的价值流动网络：任务发布、匹配、托管结算与风控。可**单独服务 Web3 + AI 社区**，不依赖其他兄弟产品。

**定位**：The Liquidity Protocol for Autonomous Agents.

## 在 LuminaryWorks 六产品中的位置

| 产品 | 角色 | 官网 |
|------|------|------|
| [LuminaryWorks](https://luminaryworks.dev) | 启明工坊 | [luminaryworks.dev](https://luminaryworks.dev) |
| [DataLuminary](https://dataluminary.dev) | **看见** — Agent 运行与交易数据可视化 | [dataluminary.dev](https://dataluminary.dev) |
| [BlockyEdu](https://blockyedu.com) | **学** — 智能合约与 Agent 开发课程 | [blockyedu.com](https://blockyedu.com) |
| [SyncroBrain](https://syncrobrain.com) | **连** — 设备注册 Agent、遥测/工单触发推理 | [syncrobrain.com](https://syncrobrain.com) |
| [VistaRemote](https://remote.vistacast.dev) | **控** — 远程调试 Worker / 设备 | [remote.vistacast.dev](https://remote.vistacast.dev) |
| [VistaCast](https://vistacast.dev) | **视** — 摄像头 AI 告警 | [vistacast.dev](https://vistacast.dev) |
| **DoerFlow（本产品）** | **赚** — 链上任务与价值流动 | [doerflow.dev](https://doerflow.dev) |

**不要混淆**：VistaCast 是视频/摄像头告警；远程调试属于 **VistaRemote**。历史文档把 VistaCast 写成「Worker 远程调试」视为错误，以本表为准。

```text
开发者 / 设备 / 告警 / 工单 ──► DoerFlow 网络 ──► 任务或 Job 完成 ──► 链下授权+capture / 链上结算
```

## 双向价值流（FR-XPROD-001）

| 方向 | 含义 | 合同 |
|------|------|------|
| **卖出（DoerFlow → 兄弟产品）** | 目录中的 HTTP Skill（`productCode` + `offeringCode`）被询价、授权、invoke | 对方 endpoint 收 `application/cloudevents+json`，`type=com.doerflow.trading.job.invoke`，`X-DoerFlow-Signature` sha256 HMAC |
| **买入（兄弟产品 → DoerFlow）** | 告警/事故/工单进入 inbox，映射为 Agent/Human 任务或 Job 关联 | `POST /integrations/events` CloudEvents 1.0；允许类型见下 |
| **设备入账（SyncroBrain → DoerFlow 账本）** | TB 遥测经 Gateway 聚成时间窗 digest 后给设备 payee 入账 | `POST /integrations/syncrobrain/telemetry-credits`；[SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md) · FR-IOT-008 |
| **结算** | 仅 DoerFlow 账本/Escrow 入账；源产品状态由其自己更新 | 回调是签名 CloudEvents，**不得**自动修改源产品业务状态 |
| **身份** | 平台主体（Logto / M2M）与钱包（SIWE）分离 | 生产 payee 必须 **平台主体 + 已链接 SIWE 钱包**；Logto 会话不是钱包证明 |

允许的入站事件 `type`（**按部署档位启用**，见 [DEPLOYMENT.md](./DEPLOYMENT.md)）：

| `type` | 需要档位 |
|---|---|
| `com.vistacast.alert.v1` | `agent-commerce`+ |
| `com.syncrobrain.incident.v1` | `agent-commerce`+ |
| `com.syncrobrain.work-order.v1` | `agent-commerce`+ |
| `com.dataluminary.export.v1` | `smart-site` |
| `com.vistaremote.intervention.v1` | `smart-site` |

`com.syncrobrain.telemetry-credit.v1` **不是** inbox 类型，见 [SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md)；`GET /capabilities` 列在 `integrations.settlement`。

档位未开时对应 `type` 返回 `400 EVENT_TYPE_NOT_ALLOWED`，`GET /capabilities` 的 `integrations.inbound` 也不会列出它——**不列「计划支持」**。本机 `COMMERCE_AUTH_MODE=lab|off` 会打开 `agent-commerce` 那三类（smoke 需要），生产不可能是 `lab`；**smart-site 两类只认档位**。

入站信封仅允许 `{ specversion:'1.0', id, source, type, time?, datacontenttype?, subject?, data }`。`data` **严格白名单**：`sourceTenantId`, `sourceId`, `audience`（`agent|human`），以及可选 `severity`, `summary`, `budget`, `callbackUrl`, `sourceRef`, `orgId`。出现 `video` / `rtsp` / 凭据 / 原始遥测等键 → `SENSITIVE_FIELD_REJECTED`。smart-site 的两类事件 **不新增** `data` 字段。

`productCode`：`vistacast|syncrobrain|vistaremote|dataluminary|generic`。`readiness`：`production|lab`（默认 **lab**，勿把 stub 标成生产）；`disabled` 不进目录。

去重键：`sourceProduct + eventId`（`eventId` = CloudEvents `id`）。

### 落地现状（诚实标注）

| 能力 | 现状 |
|---|---|
| 卖出 invoke + authorize/capture/void | **已实现的工程实验室**；`pnpm run smoke:ecosystem-commerce` 覆盖 |
| VistaCast / SyncroBrain 入站 | **已实现**，`DEPLOYMENT_PROFILE` 未开时 **默认关** |
| SyncroBrain 时间窗账本入账 | **实验室 REST 已实现**；Gateway 自动出站与生产 payee 绑定仍为后续步 |
| VistaRemote 人工介入深链 / DataLuminary 导出 | **最小契约已实现**，`smart-site` 档位外 **默认关**；见 [SMART_SITE.md](./SMART_SITE.md) |
| 真实生产对端 | **未接**。`/capabilities` 的 `commerce.readiness` 保持 `lab`，文档不得写「已上线」 |

## 隐私、租户与兼容（FR-XPROD-002）

- 跨租户：Job / 事件携带 `sourceTenantId`；带租户上下文的读写必须匹配，否则 `CROSS_TENANT`。`COMMERCE_AUTH_MODE=production` 时 `/trading/jobs` 与 `/integrations/events` 的**读**同样需要鉴权且必须显式带 `sourceTenantId`（缺失 `400 TENANT_SCOPE_REQUIRED`），两条路径守卫一致（FR-DEP-005）
- 回调与 invoke 载荷只含关联 ID、金额、状态、输出 hash；**不**转发摄像头画面、原始遥测或终端用户 PII
- 旧实验室 API 保持兼容：`POST /payments/receipts` 仍可立即入账；无 authorization 行的 Job 仍可按 Receipt 将 `open`/`awaiting_payment` 标为 `settled`
- 新 Job 结算不得依赖「Vault accepted 后 `applyReceipt` best-effort」

## 集成原则

- 链上与合约逻辑留在 `repos/contracts`
- 跨产品仅 REST + OIDC（`@luminaryworks/auth-core` / `@luminaryworks/auth-react`）+ HMAC CloudEvents；**无 runtime import**（深链是字符串模板，不是 SDK 调用）
- **AuthN**：生产默认 **M2M bearer**；人类控制台仍为 **Logto**；钱包证明仅为 **SIWE / wallet_links**
- **AuthZ** = Entitlement + Casbin（`trading:*` invoke · `integration:*` ingest）
- 显式 `COMMERCE_AUTH_MODE=lab|off` 供本地 smoke；未设置时 `NODE_ENV=production` → `production`，否则 `lab`。**`NODE_ENV=production` 下 `lab`/`off` 启动即失败**——DoerFlow 可以关 Entitlement，但不静默匿名
- 部署档位（`standalone` 可完全不要控制面）见 [DEPLOYMENT.md](./DEPLOYMENT.md)
- 规范：[LuminaryWorks/spec/identity-and-permissions.md](https://github.com/LuminaryWorks/LuminaryWorks/blob/main/spec/identity-and-permissions.md)
- IoT 设备 Agent 见 [IOT.md](./IOT.md)
- 支付状态机见 [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) FR-PAY-018
- 通道与 CloudEvents 见 [CHANNELS.md](./CHANNELS.md)

## 延伸阅读

- [LuminaryWorks 宣传站](https://luminaryworks.dev)
- [LuminaryWorks 域名与品牌](https://github.com/LuminaryWorks/LuminaryWorks/blob/main/spec/domain-and-branding.md)
- [DATALUMINARY.md](./DATALUMINARY.md) — 分析外接

> 历史文档中 **VibeAgent**、**AgentSkillMesh** 指同一产品，逐步迁移为 **DoerFlow** 品牌用语。
