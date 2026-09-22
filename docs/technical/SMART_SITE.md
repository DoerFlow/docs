---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# smart-site 场景最小契约（SMART_SITE）

**版本**: v0.1-smart-site-lab · **最后更新**: 2026-09-22
**关联**: [DEPLOYMENT.md](./DEPLOYMENT.md) · [CLIENTS.md](./CLIENTS.md) · [luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md) · [CHANNELS.md](./CHANNELS.md) · [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md) · [DATALUMINARY.md](./DATALUMINARY.md)

`smart-site` 是 `agent-commerce` 之上的站点/工地场景档位（见 [DEPLOYMENT.md](./DEPLOYMENT.md) §1）。本文件只定义 **稳定的 env 与契约面**，实现是 **工程实验室**，`DEPLOYMENT_PROFILE` 未设为 `smart-site` 时**默认关**。

**客户端**（[CLIENTS.md](./CLIENTS.md)）：DoerFlow 各端 **没有** 自动远控界面。深链只给人点；API 不发起会话。档位默认关，见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

**状态诚实标注**：本档位未接过真实 VistaRemote / DataLuminary 生产对端。`/capabilities` 里 `commerce.readiness` 为 `lab`，文档不得写「已上线」。

**Creator UI**：Creator 面向 catalog/jobs 仍是 web `/ecosystem`（读 `/capabilities`）。`remoteIntervention.deepLink` **主 UI** 可为 **web** `/ecosystem` **Events**；**admin + worker 亦**展示人工 Intervene（打开深链；catalog/jobs ≠ 介入）。admin / worker **不做**远控控制台。本档位只追加人工介入深链 + DataLuminary 导出关联——**无**自动远控。见 [ECOSYSTEM.md](./ECOSYSTEM.md) §5.1 · [CLIENTS.md](./CLIENTS.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

## 0. 三条不可协商的边界

| 边界 | 含义 |
|---|---|
| **不自动远控** | DoerFlow **只产出人工介入深链**，绝不代替人去连设备、下指令、开阀、复位。`capabilities.integrations.autoRemoteControl` 恒 `false`，不是开关。 |
| **不自动 resolve** | 收到 VistaRemote 介入回执或 DataLuminary 导出完成，**不得**自动把任务/事件标成已解决、已验收、已结算。人工验收路径见 [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)。`capabilities.integrations.autoResolve` 恒 `false`。 |
| **不引入 runtime import** | 不得 `import` / 依赖任何兄弟产品的包。跨产品只有 **签名 CloudEvents + REST + OIDC**。深链是**字符串模板**，不是 SDK 调用。 |

---

## 1. 稳定 env

| 变量 | 默认 | 说明 |
|---|---|---|
| `DEPLOYMENT_PROFILE` | `standalone` | 设为 `smart-site` 才启用本档位 |
| `SMART_SITE_REMOTE_BASE_URL` | `https://remote.vistacast.dev` | VistaRemote 站点根；仅用于校验模板同源 |
| `SMART_SITE_REMOTE_DEEP_LINK_TEMPLATE` | `https://remote.vistacast.dev/sessions/new?ref={sourceRef}&tenant={sourceTenantId}` | **必须含 `{sourceRef}`**；否则 `smart-site` 启动失败 |
| `SMART_SITE_EXPORT_CALLBACK_URL` | 空 | 可选；DataLuminary 导出关联后的签名回调地址 |

占位符（只有这三个，缺省替换为空串）：`{sourceRef}` · `{sourceTenantId}` · `{eventId}`。

模板校验（启动时）：必须是 `https:`（或本地 `http://127.0.0.1` / `http://localhost`），必须含 `{sourceRef}`，且不得含 `host.docker.internal`。

---

## 2. 入站事件（买入）

在 `agent-commerce` 的三类之外，`smart-site` 追加两类。**只有档位为 `smart-site` 时才被接受**，否则 `400 EVENT_TYPE_NOT_ALLOWED`。

| `type` | `sourceProduct` | 语义 | DoerFlow 的动作 |
|---|---|---|---|
| `com.dataluminary.export.v1` | `dataluminary` | 一次数据导出/报表已生成 | 去重落库 + 关联 `sourceRef`；按治理门禁尝试建任务，失败则 `correlated`。**不自动 resolve** |
| `com.vistaremote.intervention.v1` | `vistaremote` | 一次人工远程介入会话的回执 | 去重落库 + 关联 `sourceRef`，作为**证据**。**不自动 resolve、不自动放款** |

信封与 `data` 白名单**沿用** [luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md)，不新增字段：`sourceTenantId`（必填）、`sourceId`（必填）、`audience`（必填 `agent|human`）、可选 `severity` / `summary` / `budget` / `callbackUrl` / `sourceRef` / `orgId`。

出现 `video` / `rtsp` / 凭据 / 原始遥测 / 画面 / PII 键 → `400 SENSITIVE_FIELD_REJECTED`。导出事件**只传引用**（`sourceRef`），**不传数据集内容**。

`productCode` 扩展为 `vistacast|syncrobrain|vistaremote|dataluminary|generic`。

---

## 3. 人工介入深链（出站，只读引导）

`smart-site` 档位下，事件记录额外返回：

```jsonc
{
  "remoteIntervention": {
    "mode": "manual",                                  // 恒 "manual"
    "sourceRef": "site-7/alert-9",
    "deepLink": "https://remote.vistacast.dev/sessions/new?ref=site-7%2Falert-9&tenant=tenant-vc",
    "autoRemoteControl": false                          // 恒 false
  }
}
```

| 规则 | 说明 |
|---|---|
| 触发条件 | 档位 `smart-site` **且** 事件带 `sourceRef` **且** 模板已配 |
| `sourceRef` 编码 | 逐个占位符做 `encodeURIComponent`，防止拼接注入 |
| 没有 `sourceRef` | 不返回 `remoteIntervention`，**不猜**、不用 `eventId` 或 `sourceId` 顶替。深链只认信封里源产品**主动声明**的 `data.sourceRef`；`sourceId` 是摄像头/设备 id，不是业务引用 |
| 谁点 | **人**。主 UI 可为 **web** `/ecosystem` Events；**admin + worker 亦**人工 Intervene。API 不发起会话、不持有 VistaRemote 凭据 |
| 回调 | 若事件带 `callbackUrl`，durable outbox 发签名 CloudEvents `com.doerflow.site.intervention.requested.v1`，载荷只含 `eventId` / `sourceProduct` / `sourceTenantId` / `sourceRef` / `deepLink` / `mode`；**不改源产品业务状态** |

---

## 4. DataLuminary 导出关联

| 项 | 契约 |
|---|---|
| 入站 | `com.dataluminary.export.v1`，`sourceRef` = 导出批次引用 |
| 落库 | `integration_events`，去重键 `sourceProduct + eventId`（`dataluminary` + CloudEvents `id`） |
| 建任务 | 走任务治理门禁；不可安全建任务时 `dispatchStatus=correlated` + `rejectReason`，**不得伪称已建任务** |
| 结算 | 与其他 Job 一致：`authorize` → provider 2xx + 输出 hash → `capture`；导出事件本身**不入账** |
| 回调 | `com.doerflow.task.created` / `com.doerflow.task.correlated`（沿用），载荷只含关联 ID 与状态 |
| 数据 | 只有引用与状态；**不转发**数据集行、指标明细或终端用户 PII |

---

## 5. 需求 ID

| ID | 简述 |
|---|---|
| FR-SITE-001 | `smart-site` 档位与稳定 env（模板必须含 `{sourceRef}`，启动校验） |
| FR-SITE-002 | 人工介入深链：`sourceRef` → `deepLink`，`mode=manual`，`autoRemoteControl=false`；主 UI 可为 web `/ecosystem` Events；admin + worker 亦人工 Intervene |
| FR-SITE-003 | DataLuminary 导出事件最小契约：去重、关联、治理门禁或 `correlated` |
| FR-SITE-004 | 不自动 resolve：介入回执与导出完成都不改任务终态 |
| FR-SITE-005 | 无 runtime import：跨产品仅签名 CloudEvents + REST + OIDC |

---

## 6. 验收

```bash
pnpm --dir repos/api test -- smart-site        # 深链模板 / 占位符编码 / 档位关闭时不返回
pnpm run compose:preflight
pnpm run smoke:ecosystem-commerce              # 默认档位下这两类事件必须被拒
```

清单（实验室单测已对照；未接真实对端前 `commerce.readiness` 仍为 `lab`）：

- [x] 档位非 `smart-site` 时 `com.dataluminary.export.v1` → `EVENT_TYPE_NOT_ALLOWED`
- [x] 模板缺 `{sourceRef}` → 启动失败
- [x] `sourceRef` 含 `/` `&` `?` 时深链已编码
- [x] 无 `sourceRef` 的事件不返回 `remoteIntervention`
- [x] `capabilities.integrations.autoRemoteControl` 与 `autoResolve` 恒 `false`
- [x] 代码里没有对兄弟产品包的 `import`

证据：`repos/api` `integrations.service.spec.ts`（非 smart-site → `EVENT_TYPE_NOT_ALLOWED`）、`deployment-profile.spec.ts`（`assertCapabilityManifest` 拒缺 `{sourceRef}`；inbound 在 lab 也不含 export 类型；`autoRemoteControl`/`autoResolve` 恒 false）、`smart-site.spec.ts`（占位符 `encodeURIComponent`；无 sourceRef → `null`）。`pnpm run smoke:ecosystem-commerce` / `smoke:m5` 同样断言档位外拒收与恒 false。`package.json` 无 `@vistaremote` / `@dataluminary` / `@vistacast` / `@syncrobrain`；`src/` 无对应 runtime import。
