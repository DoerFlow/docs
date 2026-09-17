---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 管理平台规格

**版本**: v0.1-draft · **最后更新**: 2026-09-17  
**仓库**: `repos/admin` → `AgentSkillMesh/admin`（私有）

---

## 1. 定位

**平台运营后台**（Web），对全平台 **任务订单** 进行治理：

| 能力 | 说明 |
|------|------|
| **订单总览** | 全状态筛选、搜索、导出 |
| **审批发布** | L2 复杂任务人工通过/驳回 |
| **自动审批监控** | L0/L1 规则命中日志、异常回放 |
| **风控告警** | L3 危险任务红色队列、实时刷新 |
| **争议仲裁** | Escrow / 平台争议工单（**M3 工单**；链上仲裁 v0.4+） |
| **参数配置** | 自动审批阈值、敏感词、模板白名单 |

用户：**平台运营、风控、客服**（RBAC，非普通 C 端用户）。

- **不托管** VistaCast / SyncroBrain 伙伴控制台，也**不做** smart-site 远控（深链 / 导出关联是 API + integrations 实验室面）；运营仍在 DoerFlow 任务/支付面板。生态 catalog / jobs UI 在 **web** `/ecosystem`（不在 admin）；运营用 smoke + API 实验室，不要期待 admin 商业控制台。见 [ECOSYSTEM.md](./ECOSYSTEM.md) · [SMART_SITE.md](./SMART_SITE.md)。
- 平台会员 / commerce checkout UI 在 **web** `/membership`（不在 admin）。见 [CLIENTS.md](./CLIENTS.md)。
- 开发者 API Key / Skill 自助 UI 在 **web** `/developers`（不在 admin）。见 [CLIENTS.md](./CLIENTS.md) · [DEVELOPER.md](./DEVELOPER.md)。

## 2. 功能需求

### FR-ADM-001 登录与权限
- Logto OIDC 平台账号 + 2FA（v0.4）
- `/login`：`HeadlessLoginPanel` 且 `showRegister={false}`（运营控制台；自助注册仅 web `/login`）。见 [CLIENTS.md](./CLIENTS.md)。
- 本地：MetaRepo `pnpm id:up`（委托相邻 `LuminaryWorks`）→ OIDC `:3001`；运营登录 `admin.doerflow@luminaryworks.dev`（seed）
- JWT 角色 `doerflow_admin` 仅用于引导 Casbin `agent_admin`；审批按钮仍只看资源 `permissions`
- 资源响应附 `permissions`；审批、风控、治理控件只按该映射启用
- Logto roles、JWT claims、前端 mock role 和角色切换器均不是授权依据；API Casbin 为唯一资源授权裁决
- 页头/设置展示中央 `effectivePlan` 与组织上下文；商业门禁 `402` 与资源拒绝 `403` 分开处理

### FR-ADM-002 任务列表
- 列：ID、类型、发单方、金额、风险分、状态、创建时间  
- 筛选：`pending_review` | `published` | `rejected` | 告警中  
- **实现（M3）**：`/tasks` ← `GET /admin/tasks`；行内 approve/reject；**批量通过** ← `POST /admin/tasks/batch-approve`  

### FR-ADM-003 审批工作台
- 任务详情：描述、附件、发单方历史、风控命中规则；**社交任务须展示解析出的平台与步骤**（`App:` / `Steps:`，FR-WRK-004）；审批队列与任务列表同样标出平台  
- 操作：通过（→ `published` + **绑定 Escrow 预留** `escrowId`）、驳回、要求修改（→ `needs_revision`）  
- **批量通过（M3）**：默认 `pending_review` 且非 L3、非 `alertFlag`（超额人类任务多为 L2）；`force=true` 可含告警任务（仍跳过 L3）  
- **实现（M3）**：`/review` 单条 + 勾选批量；`/tasks` 行选批量；approve 写入平台 Escrow 预留；待审队列含 `pending_review` 与 `needs_revision`  

### FR-ADM-004 自动审批监控
- 展示规则引擎决策日志  
- L0/L1 通过率、误放抽检标记  
- **实现（M3）**：`/auto-approval` ← `GET /admin/tasks/auto-decisions`（`autoDecision` + 规则回放）  
  - 抽检标记已处理 → `POST .../mark-auto-reviewed`  
  - 升级人工 → `POST .../escalate-auto`（`published` 且未接单 → `pending_review`）  

### FR-ADM-005 危险任务告警
- 实时列表（WebSocket 或轮询）  
- 级别：高 / 中  
- 操作：拦截、升级人工、加入黑名单  
- **实现（M3）**：`/risk-alerts` ← `GET /admin/tasks/alerts`；拦截 → `POST .../reject`（待审或未接单的 `published`）；升级人工 → `POST .../escalate`；加入黑名单/观察 → `POST /admin/publishers/flag`；标记已处理 → `POST .../clear-alert`  

### FR-ADM-006 仪表盘
- 今日发布/完成/**GMV（已完成任务 `rewardEth` 合计，单位 ETH）**、待审数量、告警数  
- 首页须可干活：待审队列预览（点进 `/review?id=`）、开放争议数、Indexer 健康（`GET /health` 的 `indexer.rpcOk` / `catchupPercent` / `leader`）、最近审计  
- 不得展示占位假金额（如固定 `$128,400 USDC`）  
- **实现（M3）**：KPI 条接 `GET /admin/stats/overview`（含 `gmvSettledTodayEth`、`needsRevision`、`openDisputes`）  
- **图表**：不做自建图表；后续嵌入 [DataLuminary](./DATALUMINARY.md) Dashboard（iframe / 外链）  

### FR-ADM-007 支付清算运维（M3）
- 只读面板：`GET /payments/ledger/commits`  
- 列：epoch · status · root · txHash（Basescan）· error · updatedAt  
- 展示账本引擎 / 队列模式（disclosure）  
- 路由：`/payments/commits`  

### FR-ADM-008 费率等级只读（M3）
- 面板：`GET /fees/tiers`（ERC-4337 等级协议费 bps）  
- 路由：`/payments/fees`  
- 与 FEE_TIERS_AA 文档一致；配置写入链上 FeeTierRegistry 见后续版本  

### FR-ADM-009 治理参数（M3）
- 路由：`/governance`  
- `GET|PUT /admin/governance/config`：自动审批 ETH 阈值、硬拒/风控关键词、发单限流、L0–L3 开关  
- 保存后立即作用于新提交任务的规则引擎（不回溯已决策任务）  

### FR-ADM-010 发单方治理（M3）
- 路由：`/publishers` ← `GET /admin/publishers`（任务聚合 + 观察/黑名单）  
- `POST /admin/publishers/flag`：`watchlist` / `blacklist`（持久化于 governance config）  
- 黑名单地址 `POST /tasks` 拒绝（`PUBLISHER_BLACKLISTED`）  

### FR-ADM-011 审计日志（M3）
- 路由：`/audit` ← `GET /admin/audit`  
- 记录：审批通过/驳回/要求修改、清告警、自动决策抽检、治理配置变更、发单方拉黑/观察、争议裁决  
- 支持按 action / 关键词筛选与 CSV 导出  

### FR-ADM-012 争议仲裁工单（M3）
- 路由：`/disputes` ← `GET /admin/disputes`  
- 开单：`POST /tasks/:id/dispute`（发单方 / 接单方 / 运营），状态限于 `assigned|submitted|verifying`  
- 运营：`POST /admin/disputes/:id/claim`（→ reviewing）、`POST /admin/disputes/:id/resolve`  
  - `refund_publisher` → 任务 `cancelled`，平台 Escrow `Refunded`  
  - `release_worker` → 任务 `completed` + 账本结算（链上已锁定则要求已有 `releaseTxHash` 或仅结案标注）  
  - `split` → 按 `splitBps` 账本部分打款后 `completed`  
- 裁决写入审计 `DISPUTE_RESOLVED`  

### FR-ADM-013 界面文案（M3）
- 运营控制台用户可见文案走 locale：`lib/i18n/messages/en.json`（类型源）+ `zh-CN.json`（简体中文必填）
- 另有 `zh-TW` 及其他语言包；缺 key 时与 `en` 对齐，禁止页面硬编码中文/英文 fallback
- 禁止 `t(key) || "中文"`、`t(key) !== "key"` 这类缺 key 兜底；缺文案修 locale JSON

### 实验室设备库存（只读，非链上 Registry）

- 路由 `/devices`：只读列出 HTTP `GET /devices`（轮询 + 搜索 + 状态筛选 + `lastSeenAt`/`kind`/`label`/`id`/`payee` 排序；筛选空结果走 `filterEmpty` 文案；计数徽章 `shown / total`，筛选后数量 vs 全量，i18n `devices.count` 插值 `{{shown}}`/`{{total}}`）；**不是**链上 `DeviceRegistry`

## 3. 技术栈

| 项 | 选型 |
|----|------|
| 框架 | React 19 + **Next.js** + Ant Design 6 |
| 状态 | TanStack Query + Zustand |
| 鉴权 | JWT / SIWE（运营钱包可选） |
| 规范 | Biome |
| i18n | 自定义 locale JSON（`en` + `zh-CN`；其余语言包 key 与 `en` 对齐） |
| API | `api` 模块 `/admin/*` |

与 `web` DApp 分离：**web** 面向链上 Creator，**admin** 面向平台内部。

## 4. 依赖

```
admin → api（admin 模块）
api → contracts（索引）
admin → shared（类型）
```

## 5. 里程碑

| 版本 | 交付 |
|------|------|
| v0.3 | 登录、待审列表、单条/批量审批、告警列表、**支付 Commits 运维**、**治理参数**、**任务总览**、**发单方治理**、**审计日志**、**争议工单**；仪表盘 KPI + 待审队列预览 + 真实 GMV（图表 → DataLuminary）；**界面 en + zh-CN** |
| v0.4 | Webhook 告警、链上争议结算、DataLuminary 仪表盘嵌入 |
| v1.0 | 完整 RBAC + 审计留存策略 |

## 6. 验收

- [x] `pending_review` 任务可在后台通过并出现在 worker 列表（API 联调；E2E 冒烟 2025-01-13 ✅）  
- [x] L3 告警任务默认不在 worker 可见（`alertFlag` 过滤；审批通过后清 flag）  
- [x] 驳回任务发单方 wallet 可见原因（`alertReason` → 收益「我发布的任务」）  
- [x] 运营界面用户文案走 en + zh-CN locale（审批 / 任务 / 仪表盘 / 治理 / 发单方 / 审计 / 告警 / 登录）  
- [x] 无 API `permissions.review|manage` 时写控件不可用，即使 JWT 带同名角色
- [x] `401` 返回登录，`402` 显示套餐/配额上下文，`403` 显示资源无权且不展示升级误导

---

*审批规则见 [TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)。*
