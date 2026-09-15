---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 部署边界与档位（DEPLOYMENT）

**版本**: v0.1-profiles · **最后更新**: 2026-09-09
**关联**: [PRODUCTION.md](./PRODUCTION.md) · [PORTS.md](./PORTS.md) · [luminaryworks-ecosystem.md](./luminaryworks-ecosystem.md) · [SMART_SITE.md](./SMART_SITE.md) · [CHANNELS.md](./CHANNELS.md)

本文件定义 **DoerFlow 能独立部署到什么程度**，以及哪些能力必须依赖 LuminaryWorks 控制面。

**铁律**：

1. **可独立**：`standalone` 档位不需要 Logto / Entitlement / 兄弟产品即可跑通任务、账本、Merkle、链上 Escrow。
2. **不静默匿名**：任何档位、任何 `ENTITLEMENT_MODE`，写路径都必须有已验证主体（SIWE / 平台 JWT / M2M）。「关掉 Entitlement」**不等于**「关掉 AuthN」。
3. **生产平台档位**：面向多租户公开收款的托管平台必须开 **AuthN（Logto/M2M）+ Entitlement + Casbin**，钱包证明单独走 **SIWE**（双轨，见 §4）。
4. **诚实标注**：`agent-commerce` / `smart-site` 的兄弟产品对接目前是 **已实现的工程实验室**，默认 **关**；未接真实对端前不得在文档或 `/capabilities` 里标成 `production`。

---

## 1. 四个档位

| 档位 `DEPLOYMENT_PROFILE` | 面向 | 必需后端 | AuthN | Entitlement | Casbin | 兄弟产品 |
|---|---|---|---|---|---|---|
| **`standalone`**（默认） | 自托管、单组织、课堂、私有部署 | API + Indexer + Postgres + Redis | **必需**（SIWE + 平台 JWT） | `off` 或 `offline_license` | 产品内置策略 | 无 |
| **`control-plane`** | LuminaryWorks 托管平台、多租户公开收款 | 同上 + Entitlement 服务（`:3040`） | **Logto OIDC + M2M** | `enforce`（或 `shadow_read` 灰度） | **必需** | 可选 |
| **`agent-commerce`** | 在 `control-plane` 之上开双向商业作业 | 同 `control-plane` | 同上 | `enforce` | **必需** | VistaCast · SyncroBrain（**已实现实验室，默认关**） |
| **`smart-site`** | 在 `agent-commerce` 之上加工地/站点场景 | 同上 | 同上 | `enforce` | **必需** | 追加 VistaRemote 人工介入深链 · DataLuminary 导出事件（**最小契约，默认关**） |

档位是**累进**的：`smart-site` ⊃ `agent-commerce` ⊃ `control-plane` ⊃ `standalone` 的能力集合。`DEPLOYMENT_PROFILE` 未设置时按 `standalone` 处理。

### 1.1 各档位能力

| 能力 | standalone | control-plane | agent-commerce | smart-site |
|---|---|---|---|---|
| 任务治理 / 人类任务 / Agent 任务 | ✅ | ✅ | ✅ | ✅ |
| 链下账本 + Merkle Root + `forceWithdraw` | ✅ | ✅ | ✅ | ✅ |
| 链上 Escrow / Vault | ✅ | ✅ | ✅ | ✅ |
| Trading 目录 / 报价 / Job authorize-capture-void | ✅ | ✅ | ✅ | ✅ |
| 组织席位 / 配额 / 订阅计费 | ❌ | ✅ | ✅ | ✅ |
| 跨租户读写守卫（强制显式 `sourceTenantId`） | 不适用（单租户） | ✅ | ✅ | ✅ |
| `POST /integrations/events` 商业事件入站 | ❌ | ❌ | ✅ | ✅ |
| `POST /integrations/syncrobrain/telemetry-credits` 时间窗入账 | ❌ | ❌ | ✅ | ✅ |
| VistaRemote 人工介入深链 · DataLuminary 导出事件 | ❌ | ❌ | ❌ | ✅ |

**本机实验室例外**：`COMMERCE_AUTH_MODE=lab|off` 时，`agent-commerce` 那三类入站事件在任何档位都开着——这个模式的存在就是为了在笔记本上跑 `pnpm run smoke:ecosystem-commerce`，而 §4.2 已经禁止它出现在 `NODE_ENV=production`。**smart-site 的两类事件不吃这个例外**，只认档位。

---

## 2. 最小后端

**必需**（任何档位）：

| 组件 | 说明 |
|---|---|
| **API**（`INDEXER_ROLE=http`） | Fastify HTTP；可多副本 |
| **Indexer**（`INDEXER_ROLE=worker`） | 追链；Redis 选主，**只能有一个 leader** |
| **Postgres** | 账本 + Agent/Skill/Escrow 索引行；所有 API 副本与 indexer 共用同一 `LEDGER_DATABASE_URL` |
| **Redis** | BullMQ（`commitRoot`）+ 账本缓存 + Indexer 选主心跳 |

**可选**（客户端不属于最小后端）：`web`（Rsbuild DApp）、`admin`、`wallet`、`worker`、`site`、`docs`。客户端可以完全不部署，API + SDK 即可运行；见 [CLIENTS.md](./CLIENTS.md)。

**不是最小后端**：Logto、Entitlement、Hardhat 节点、任何兄弟产品。

---

## 3. Compose 标准化

`deploy/docker-compose.core.yml` 是**基座**（只有 `doerflow-api` + `indexer`），其余文件都是 **overlay**，用 `-f` 叠加：

| 文件 | 作用 | DB / Redis |
|---|---|---|
| `docker-compose.core.yml` | 基座：doerflow-api + indexer + web + admin | 不含 |
| `docker-compose.dev.yml` | 本机开发 | 内置，**映射到宿主** `5439` / `6379` |
| `docker-compose.prod.yml` | 生产单机 | 内置，**不映射宿主端口** |
| `docker-compose.external-db.yml` | 生产 + 外部托管 DB | 不含；必须提供外部 URL |
| `docker-compose.control-plane.yml` | 叠加 Entitlement / Logto 接入 | 不含（只加 env 与网络） |
| `docker-compose.smoke.yml` | 一次性 smoke 容器 | 不含 |

```bash
# 本机开发
docker compose -f deploy/docker-compose.core.yml -f deploy/docker-compose.dev.yml up -d

# 生产单机（DB 不暴露宿主）
docker compose -f deploy/docker-compose.core.yml -f deploy/docker-compose.prod.yml up -d

# 生产 + 托管 Postgres/Redis
docker compose -f deploy/docker-compose.core.yml -f deploy/docker-compose.external-db.yml up -d

# 生产平台档位（Entitlement 控制面）
docker compose -f deploy/docker-compose.core.yml -f deploy/docker-compose.prod.yml \
  -f deploy/docker-compose.control-plane.yml up -d
```

### 3.1 Compose 硬约束（`pnpm run compose:preflight` 断言）

| 约束 | 原因 |
|---|---|
| **禁止 `container_name`** | 固定容器名无法多副本、无法蓝绿；`docker compose scale` 直接失败 |
| **禁止 `host.docker.internal`** | 在 Linux 主机不存在；控制面必须用服务名或真实 DNS |
| **禁止跨档位共享同一 env 文件** | `doerflow-api` / `indexer` / `postgres` 各自 `env_file`；DB 口令不进 API 容器环境，反之亦然 |
| **生产不得映射 DB / Redis 宿主端口** | `prod` 与 `external-db` overlay 里 `postgres`/`redis` 不允许出现 `ports:` |
| **Entitlement 走 `:3040` + DNS** | `ENTITLEMENT_BASE_URL` 必须是服务名或域名，端口 `3040`（见 [PORTS.md](./PORTS.md)） |
| **每个长驻服务有 healthcheck** | `/live` 用于容器存活，`/ready` 用于流量准入；web `/health`、admin `/health` |
| **API/Web/Admin 默认绑 loopback** | `DOERFLOW_API_BIND` / `DOERFLOW_WEB_BIND` / `DOERFLOW_ADMIN_BIND` 默认 `127.0.0.1`；对外反代再改 bind |

### 3.2 env 文件划分

| 文件 | 归属 | 内容 |
|---|---|---|
| `deploy/env/api.env`（模板 `deploy/production.env.example`） | doerflow-api | 应用配置、密钥、链、商业开关 |
| `deploy/env/indexer.env` | indexer | 只有 `INDEXER_ROLE=worker` 与追链参数 |
| `deploy/env/db.env` | postgres | `POSTGRES_*` 口令，**不进 doerflow-api 容器** |
| `deploy/env/web.env` | doerflow-web | 仅公开前端变量，无密钥 |
| `deploy/env/admin.env` | doerflow-admin | 仅公开前端变量，无密钥 |

`LEDGER_DATABASE_URL` / `REDIS_URL` 由 compose 的 `environment:` 组装，不写进共享 env 文件。

---

## 4. AuthN / Entitlement / Casbin 与钱包双轨

```text
                ┌─ 平台主体（谁在调用）──► Logto OIDC / M2M bearer / 平台 JWT
AuthN（双轨）───┤
                └─ 钱包证明（钱在谁手里）─► SIWE 签名 → wallet_links
```

| 层 | standalone | control-plane 及以上 |
|---|---|---|
| **平台主体** | SIWE 派生主体 `siwe:0x…` 或平台 JWT | **Logto OIDC**（人）+ **M2M bearer**（服务） |
| **钱包证明** | **SIWE**（必需，收付款主体） | **SIWE**（必需）；Logto 会话 **不是** 钱包证明 |
| **Entitlement** | `off` 或 `offline_license` | `enforce`（灰度可 `shadow_read`） |
| **Casbin** | 产品内置策略（`task|strategy|audit`、`trading:*`、`integration:*`） | 同上 + 控制面下发角色 |

**双轨铁律**：`payee`、提现、Escrow 放款只认 **SIWE 钱包**；席位、配额、订阅只认 **平台主体**。两者通过 `wallet_links` 关联，任一方缺失时生产必须拒绝，不得用另一方顶替。

### 4.1 `ENTITLEMENT_MODE` 取值

| 值 | 含义 | 需要控制面 | 允许档位 |
|---|---|---|---|
| `off` | 不做商业校验；**AuthN 仍然强制** | 否 | `standalone` |
| `offline_license` | 用本地 Ed25519 签名 License 文件做商业校验（无网络） | 否 | `standalone` |
| `shadow_read` | 调控制面但不拦截，只记差异 | 是 | `control-plane`+ |
| `enforce` | 调控制面并拦截 | 是 | `control-plane`+ |

`offline_license` 必须同时提供 `ENTITLEMENT_LICENSE_FILE`、`ENTITLEMENT_DEPLOYMENT_ID`、`ENTITLEMENT_LICENSE_PUBLIC_KEYS`，否则**启动即失败**（不降级为放行）。

### 4.2 `COMMERCE_AUTH_MODE`

| 值 | 用途 |
|---|---|
| `production` | M2M/OIDC bearer + Entitlement + Casbin |
| `lab` | 本地 smoke 放行（**默认非 production 时**） |
| `off` | 完全放行；仅限一次性调试 |

**校验**：`NODE_ENV=production` 时 `lab` / `off` 一律**启动失败**——这就是「不静默匿名」的落点。

---

## 5. `/version` 与能力清单

| 端点 | 鉴权 | 用途 |
|---|---|---|
| `GET /api/v1/live` | 无 | 容器存活。恒 `200`，`{status:"ok"}` |
| `GET /api/v1/ready` | 无 | 流量准入。就绪 `200 {status:"ok"}`；**降级 `503 {status:"degraded"}`** |
| `GET /api/v1/version` | 无 | 服务名、版本、`gitSha`、`chainId`、`profile`、`manifestHash` |
| `GET /api/v1/capabilities` | 无 | 能力清单（下方 manifest） |

**`/ready` 契约（FR-DEP-003）**：`degraded` **不得**再返回 `200`。返回 `200` 的降级会让负载均衡把流量打进坏副本，而 Prometheus 的 `probe_success` 也看不出问题。降级判据：账本 disclosure 不可用。`live` 不受影响，容器不会被反复重启。

### 5.1 Capability manifest

```jsonc
{
  "profile": "standalone",          // DEPLOYMENT_PROFILE
  "profileSource": "default",       // "env" | "default"
  "authn": {
    "siwe": true,                   // 恒 true：钱包证明
    "platformJwt": true,
    "oidc": false,                  // IDP_MODE=logto 且配了 issuer
    "m2m": false,
    "anonymousWrites": false        // 恒 false，否则视为配置错误
  },
  "entitlement": { "mode": "off", "controlPlane": null },
  "authz": { "casbin": true },
  "commerce": { "authMode": "lab", "readiness": "lab" },
  "integrations": {
    "inbound": [],                  // 档位未开时为空数组，不列「计划支持」
    "outbound": [],
    "autoRemoteControl": false,     // 恒 false
    "autoResolve": false            // 恒 false
  },
  "channels": ["P0", "P1", "P2", "P3", "P4"]
}
```

**manifest 校验（FR-DEP-004）** 在**启动时**执行，任一条不满足直接抛错退出（fail-closed），不进入「跑起来但不安全」状态：

| 规则 | 说明 |
|---|---|
| `DEPLOYMENT_PROFILE` 取值合法 | 只允许四档 |
| `NODE_ENV=production` → `COMMERCE_AUTH_MODE ∉ {lab, off}` | 不静默匿名 |
| `profile != standalone` → `ENTITLEMENT_MODE ∈ {shadow_read, enforce}` | 平台档位必须有控制面 |
| `profile != standalone` → `ENTITLEMENT_BASE_URL` 已配且非 `host.docker.internal` | 控制面 DNS |
| `ENTITLEMENT_MODE=offline_license` → License 三件套齐全，且 `profile=standalone` | 离线许可不做平台多租户 |
| `profile ∈ {agent-commerce, smart-site}` → 入站事件类型集合非空 | 档位与能力一致 |
| `profile=smart-site` → `SMART_SITE_REMOTE_DEEP_LINK_TEMPLATE` 含 `{sourceRef}` | 深链可用 |
| `anonymousWrites` 恒 `false` | 不可配置成 true |

`manifestHash` = manifest 规范化 JSON 的 SHA-256 前 16 位；客户端与 smoke 用它判断对端配置是否变化。

---

## 6. 跨租户守卫一致性（FR-DEP-005）

`/trading/jobs` 与 `/integrations/events` 的读写守卫**必须一致**：

| 模式 | 写（`POST`） | 读（`GET` 列表 / 单条） |
|---|---|---|
| `lab` / `off` | 放行；`sourceTenantId` 不匹配仍 `CROSS_TENANT` | 放行；允许不带 `sourceTenantId` 全量读（实验室） |
| `production` | M2M/OIDC + Entitlement + Casbin；`sourceTenantId` 不匹配 → `403 CROSS_TENANT` | **同样需要鉴权**；**必须显式带 `sourceTenantId`**，否则 `400 TENANT_SCOPE_REQUIRED`；不匹配 → `403 CROSS_TENANT` |

也就是说生产环境下**不存在**「未鉴权列出全部 Job / 全部事件」这条路径。实验室路径保持兼容，`pnpm run smoke:ecosystem-commerce` 不受影响。

---

## 7. 验收

日常开发只起 **一个** 产品栈。把 `agent-commerce` / `smart-site` 当交付物时，在 LuminaryWorks 跑 `pnpm preflight:scenario` 再 `pnpm scenario:up`（一次真实组合）。**不要**每次改动都六产品一起 `up`。备份/`pg_dump` 与 N-1 升级是后续私有化/SaaS 硬化门禁，不是当前 Compose 实验室的阻塞项。见 LuminaryWorks `spec/composable-deployment.md` §11。


```bash
pnpm run compose:config       # docker compose config 对四种叠加组合做语法校验
pnpm run compose:preflight    # §3.1 硬约束静态断言（无需 Docker 守护进程）
pnpm run smoke:m5             # 生产闸门（含 /ready 状态码与 /version）
pnpm run smoke:ecosystem-commerce
```

清单：

- [x] `/ready` 降级时返回 **503**，`/live` 仍 `200`
- [x] `/version` 含 `profile` 与 `manifestHash`
- [x] `/capabilities` 的 `integrations.inbound` 与档位一致，未开档位为空数组
- [x] `NODE_ENV=production` + `COMMERCE_AUTH_MODE=lab` **启动失败**
- [x] `profile=control-plane` + `ENTITLEMENT_MODE=off` **启动失败**
- [x] 生产 compose 里 `postgres` / `redis` 无 `ports:`
- [x] 任何 compose 文件无 `container_name` / `host.docker.internal`
- [x] `production` 模式下 `GET /trading/jobs` 与 `GET /integrations/events` 均需鉴权且需显式 `sourceTenantId`

证据：`probe.controller.spec.ts`（degraded → 503）；`deployment-profile.spec.ts`（inbound 按档位、lab 启动失败、control-plane + `ENTITLEMENT_MODE=off` 启动失败、manifestHash）；`commerce-auth.guard.spec.ts`（production 下 GET `/trading/jobs` 与 `/integrations/events` 无 bearer → 401）；`tenant-scope.spec.ts`（`TENANT_SCOPE_REQUIRED`）；`scripts/compose-preflight.mjs` / `pnpm run smoke:m5`（无 `container_name` / `host.docker.internal`、prod 不映射 postgres/redis `ports:`；`/version` profile+manifestHash）。`/live` 恒 200 见 `probe.controller.ts` 与 `m5-production-gate.mjs`。
