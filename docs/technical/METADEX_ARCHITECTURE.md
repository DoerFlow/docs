---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# MetaDEX 链下架构 · TS → Rust 无痛升级

**版本**: v0.1-draft · **最后更新**: 2024-10-10

## 1. 设计目标

> **前期**：NestJS + TypeScript 轻量实现（RPC + 少量事件 + 内存/ SQLite 缓存）  
> **盈利后**：仅替换 **Port 实现** 为 Rust Sidecar，**Controller / Service / 前端 / OpenAPI 不变**

```
┌─────────────────────────────────────────────────────────┐
│  web / wallet / 第三方                                    │
└───────────────────────────┬─────────────────────────────┘
                            │ REST /api/v1/dex/*
┌───────────────────────────▼─────────────────────────────┐
│  DexController  （不变）                                  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  DexService  （业务编排，不变）                            │
│  - 参数校验、权限、组合多个 Port                           │
└─────┬─────────────┬─────────────┬───────────────────────┘
      │             │             │
      ▼             ▼             ▼
 IDexChainReader IDexQuoteEngine IDexPoolSync    IDexAnalytics
      │             │             │                  │
      │    ┌────────┴────────┐    │                  │
      │    │  DEX_ENGINE env │    │                  │
      │    └────────┬────────┘    │                  │
      ▼             ▼             ▼                  ▼
 TsAdapter      TsAdapter      TsAdapter      DataLuminaryAdapter
      │             │             │             （外项目）
      └─────────────┴─────────────┴─── 未来 ──▶ RustSidecarAdapter
                                              (HTTP/gRPC 同接口)
```

## 2. Port 定义（稳定契约）

以下接口为 **长期稳定边界**；Rust 重写时必须保持语义等价。

### 2.1 `IDexChainReader`

链上只读：RPC 调用，无全链扫描。

```typescript
// 概念签名 — 实现见 repos/api/src/modules/dex/ports/
getPoolReserves(poolAddress: string): Promise<{ reserve0: bigint; reserve1: bigint; blockNumber: number }>;
getTokenDecimals(token: string): Promise<number>;
callRouterQuote(params: QuoteParams): Promise<QuoteResult>;
```

### 2.2 `IDexQuoteEngine`

Swap 报价（可组合 Reader + 本地 math fallback）。

```typescript
getQuote(params: QuoteParams): Promise<QuoteResult>;
// QuoteParams: tokenIn, tokenOut, amountIn, slippageBps?
```

### 2.3 `IDexPoolSync`

**轻量同步** — v0.15 仅：

- 配置内 **白名单 Pool** 列表  
- `eth_getLogs` 订阅最近 N 块 Swap/Mint/Burn（或定时 poll）  
- SQLite 缓存 Pool 状态  

**非目标**：上万 Pool、重组深度回滚（Rust 阶段可选）。

```typescript
syncPools(poolAddresses: string[]): Promise<SyncReport>;
listPools(): Promise<DexPoolSummary[]>;
```

### 2.4 `IDexAnalytics`

**默认外接** [DataLuminary](./DATALUMINARY.md)。

```typescript
getOverview(): Promise<AnalyticsOverview | { redirectUrl: string }>;
// TVL 历史、手续费、套利信号 — 不在 VibeAgent 实现
```

## 3. 依赖注入（NestJS）

```typescript
// dex.module.ts 伪代码
{
  provide: DEX_CHAIN_READER,
  useFactory: (config) =>
    config.get('DEX_ENGINE') === 'rust'
      ? new RustSidecarChainReader(config)
      : new TsChainReader(config),
}
```

| 环境变量 | 默认 | 说明 |
|----------|------|------|
| `DEX_ENGINE` | `typescript` | `rust` 时走 Sidecar |
| `DEX_RUST_SIDECAR_URL` | — | 如 `http://127.0.0.1:13009` |
| `METADEX_CHAIN_ID` | `84532` | Base Sepolia |
| `METADEX_POOL_ALLOWLIST` | CSV 地址 | 轻量索引范围 |
| `DATALUMINARY_API_URL` | — | 分析外接 |

## 4. Rust Sidecar 契约（未来）

盈利后新增仓库 `repos/dex-engine`（Rust），**不修改** NestJS 业务代码：

| 端点 | 方法 | 对应 Port |
|------|------|-----------|
| `/v1/quote` | POST | IDexQuoteEngine |
| `/v1/pools/sync` | POST | IDexPoolSync |
| `/v1/pools` | GET | IDexPoolSync.listPools |
| `/health` | GET | 探活 |

NestJS `RustSidecarAdapter` 仅为 HTTP 客户端；OpenAPI 与 TS Adapter 返回同 shape。

## 5. 与现有 Indexer 关系

| 模块 | 职责 |
|------|------|
| `indexer/`（现有） | AgentNFT / Skill / Escrow 事件 |
| `dex/`（新增） | **独立** MetaDEX Port 层，不混入 Escrow Indexer |

避免 v0.15 把 DEX 逻辑塞进 `indexer.service.ts`。

## 6. 前端（web）

- 新增 `/dex` 路由：Swap、Pool、Vote（wagmi 调 Router/Voter 合约）  
- 数据 **只调** `/api/v1/dex/*`，不直连 Rust  
- 高级图表 **iframe / 链接** DataLuminary Dashboard  

## 7. 文件布局（api）

```
src/modules/dex/
├── dex.module.ts
├── dex.controller.ts
├── dex.service.ts
├── ports/
│   ├── dex.tokens.ts          # DI tokens
│   ├── dex-chain-reader.port.ts
│   ├── dex-quote.port.ts
│   ├── dex-pool-sync.port.ts
│   └── dex-analytics.port.ts
└── adapters/
    ├── typescript/
    │   ├── ts-chain-reader.adapter.ts
    │   ├── ts-quote-engine.adapter.ts
    │   └── ts-pool-sync.adapter.ts
    ├── rust/
    │   └── rust-sidecar.adapter.ts   # stub / HTTP
    └── external/
        └── dataluminary-analytics.adapter.ts
```

---

*产品范围见 [METADEX.md](./METADEX.md)。*
