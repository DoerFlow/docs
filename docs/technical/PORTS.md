---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 本地开发端口

**默认 API 端口 `13008`**（避免与多项目默认 3000 冲突）。各仓通过环境变量覆盖。

| 服务 | 端口 | 环境变量 |
|------|------|----------|
| **API** | **13008** | `PORT` · compose: `${DOERFLOW_API_BIND:-127.0.0.1}:${DOERFLOW_API_PORT:-13008}` |
| Site 官网 | 13010 | `next dev --port` |
| Web DApp | 5174 (compose publishes `${DOERFLOW_WEB_BIND:-127.0.0.1}:${DOERFLOW_WEB_PORT:-5174}`) | `DOERFLOW_WEB_BIND` / `DOERFLOW_WEB_PORT` |
| Admin 运营台 | 13011 | `DOERFLOW_ADMIN_BIND` / `DOERFLOW_ADMIN_PORT` |
| Hardhat | 8545 | — |
| **Ledger Postgres** | **5439** | `LEDGER_DATABASE_URL`（compose 映射，避开本机 5432 与 Identity :5433；账本 **与** Agent/Skill/Escrow 索引行。跨机器 API 必须共用同一 URL） |
| **Ledger Redis** | **6379** | `REDIS_URL`（BullMQ + 账本缓存 + Indexer 选主/心跳） |
| **Entitlement 控制面** | **3040** | `ENTITLEMENT_BASE_URL`（仅 `control-plane` 及以上档位；必须是服务名或域名，**禁止** `host.docker.internal`） |
| Logto Identity | 3001 | `IDP_ISSUER`（`pnpm id:up`；仅 `control-plane` 及以上） |
| Expo Metro | 8081+ | — |

部署档位与哪些端口属于「最小后端」见 [DEPLOYMENT.md](./DEPLOYMENT.md)。`standalone` 档位不需要 3040 / 3001。

```bash
# API
PORT=13008
# 浏览器跨域：web + admin（逗号分隔）。`pnpm run use:sepolia|localhost` 须保留两端，不得只写 :5174
CORS_ORIGIN=http://localhost:5174,http://localhost:13011

# 客户端指向 API
EXPO_PUBLIC_API_URL=http://localhost:13008/api/v1
VITE_API_URL=http://localhost:13008
NEXT_PUBLIC_API_URL=http://localhost:13008/api/v1
```

真机调试时将 `localhost` 换为电脑局域网 IP。
