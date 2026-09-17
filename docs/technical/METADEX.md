---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# MetaDEX · 轻量 ve 模型 DEX

**版本**: v0.1-draft · **最后更新**: 2026-09-16  
**关联**: [CLIENTS.md](./CLIENTS.md)  
**路线图**: v0.15（**合约优先**，见 [ROADMAP.md](./ROADMAP.md) § M1b）  
**合约计划**: [METADEX_CONTRACTS.md](./METADEX_CONTRACTS.md) ← **当前实施入口**  
**链下架构**: [METADEX_ARCHITECTURE.md](./METADEX_ARCHITECTURE.md)  
**分析外接**: [DATALUMINARY.md](./DATALUMINARY.md)

## 0. 交付顺序（合约是核心）

| 阶段 | 版本 | 内容 | 阻塞关系 |
|------|------|------|----------|
| **A** | v0.15.0 | Solidity Fork、测试、Sepolia 部署、export-abi | — |
| B | v0.15.1 | api Port 读链报价 | 依赖 A |
| C | v0.15.2 | web `/dex` | 依赖 B |
| D | 并行 | DataLuminary 分析 | 不阻塞 A |

**Phase A 未完成前，不启动 DEX 前端主路径。**

## 1. 产品定位

**专注的轻量 MetaDEX**：在 **单一目标链**（首发 **Base**）上提供 **稳定币 / 蓝筹** 高效 Swap 与流动性，用 **ve（vote-escrowed）模型** 捕获协议价值，为 Agent/IoT/任务生态提供 **低滑点结算资产** 与 **协议收入**。

| 做 | 不做（盈利前） |
|----|----------------|
| 精选 Pool（USDC/USDbC/ETH/WETH 等） | 全链实时区块扫描 |
| Swap + Add/Remove LP + Lock → veNFT | 上万 Pool 全量日志解析 |
| Gauge 投票（简化 UI） | 毫秒级链重组回滚引擎 |
| 参考 Aerodrome/Velodrome **开源合约** Fork | 自研 AMM 数学 |
| NestJS **Port 抽象**（TS 实现，可换 Rust） | 在 VibeAgent 内建 TVL/套利/历史分析 |
| **仅 canonical 桥接资产**（见 [BRIDGE.md](./BRIDGE.md)） | 非官方 wrapped 代币 |

## 2. ve 模型（摘要）

参考 Velodrome/Aerodrome **(3,3)** 思路：

```
LP Token ──lock──▶ veNFT ──vote──▶ Gauge 权重
                              └──▶ 交易手续费 + 激励分配
```

| 组件 | 作用 |
|------|------|
| **Pair / Pool** | 稳定/蓝筹交易对（Solidity） |
| **Router** | Swap 路由 |
| **VotingEscrow** | 锁仓得 ve，治理/emission 权重 |
| **Voter** | 向 Gauge 投票 |
| **Gauge** | 流动性挖矿 / 手续费定向 |

**价值捕获**：协议费进入 `FeeDistributor` / Treasury；ve 持有人投票决定激励流向 → 对齐长期 LP 与协议。

## 3. 合约策略（仅 Solidity）

| 来源 | 链 | 用途 |
|------|-----|------|
| [Aerodrome](https://github.com/aerodrome-finance/contracts) | Base | **首选 Fork 参考**（同链） |
| [Velodrome V2](https://github.com/velodrome-finance/contracts) | Optimism | 架构对照、测试网对照 |

**VibeAgent 改造原则**：

1. 仅 Fork **核心路径**：Factory、Pair、Router、VotingEscrow、Voter、Gauge（按需裁剪）  
2. 治理 Token / ve 命名与 Agent 生态品牌对齐（`spec/NAMING.md`）  
3. 与现有 `Escrow`、稳定币结算 **地址配置** 同仓 `deployments.json`  
4. **不** 在 v0.15 引入复杂 bribe 市场；可 Phase 2  

部署目标：**Base Sepolia 测试网 → Base Mainnet**。

## 4. 链下与应用层（现有技术栈）

| 层 | 技术 | 职责 |
|----|------|------|
| 合约 | Solidity / Hardhat | AMM + ve |
| 索引/报价 | NestJS + **Port/Adapter** | 见 METADEX_ARCHITECTURE |
| 前端 | web（Rsbuild + wagmi） | Swap / LP / Vote 页 |
| 重型分析 | **DataLuminary** | TVL、历史费、套利、Dashboard |

## 5. API  surface（MVP）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/dex/pools` | 精选 Pool 列表（链上 + 轻量缓存） |
| GET | `/dex/quote` | 报价（经 `IDexQuoteEngine`） |
| GET | `/dex/gauges` | Gauge 元数据 |
| POST | `/dex/sync` | 手动/定时触发轻量同步（非全链） |
| GET | `/dex/analytics/*` | **代理或跳转 DataLuminary**（可选配置） |

## 6. 与 VibeAgent 生态关系

| 场景 | 关联 |
|------|------|
| wallet/worker 结算 | 稳定币 Swap 入口 |
| IoT 设备收款 | USDC 流动性深度 |
| Agent 链 Gas | ve 收入反哺 MasterChef（v0.7+） |
| Escrow | 可选 DEX 价格 Oracle（TWAP v0.2+） |

## 7. 验收（按 Phase）

### Phase A — 合约（v0.15.0，必达）

- [x] Factory / Pair / Router 单测通过
- [x] VotingEscrow / Voter / Gauge 单测通过
- [ ] Base Sepolia 部署 + `deployments.json`（当前仅 localhost `31337.metadex`；禁止填假 Sepolia 地址）
- [x] 集成测试：Add LP → Swap → Lock → Vote
- [x] `export-abi` 可供 shared/api 使用

Hardhat（本机、无网络）：`repos/contracts/test/metadex/Router.test.ts`、`VotingEscrow.test.ts`、`integration.test.ts` 均已通过。本地合约集成保持 `pnpm run smoke:metadex:local`（包装 `test/metadex/integration.test.ts`：Add LP → Swap → Lock → Vote → Gauge reward）。`pnpm run smoke:m5` 只确认该包装脚本与 `package.json` 的 `smoke:metadex:local` 存在，不运行 Hardhat，也不表示 web 已挖出 Swap。`export-abi.ts` 含 MetaFactory/Pair/Router/VotingEscrow/Voter/Gauge；`repos/api/src/abis/` 已有对应 JSON。Sepolia MetaDEX 与 web Swap **未**勾。  

### Phase B/C — api & web（v0.15.1–.2）

- [x] API `quote/pools` 读真实 Router/Pair  
- [ ] web Swap 页完成一笔 Swap  
- [ ] Lock LP → ve → 投 1 个 Gauge  

本地合约集成仍走 `pnpm run smoke:metadex:local`；web Swap / Lock 框保持未勾（需 web `/dex` 页 + DApp 挖出的交易）。Phase C lab（web `/dex`）：quote/pools UI 已落地。Swap CTA 在 `health.router` 为 0x、已报价且钱包已连接时调用 `swapExactTokensForTokens`（先 ERC-20 approve）。Lock/Vote 在 `GET /dex/gauges` 返回真实 VotingEscrow/Voter 且已填金额/tokenId/gauge 时调用 `createLockForToken` / `vote`（权重 100，与合约集成测试一致）。本验收未挖出 Swap 或 Vote，故对应两项保持打开。  

### Phase D — 分析（可选）

- [x] 配置 `DATALUMINARY_*` 后 analytics 外接（Jest mock：`dataluminary-analytics.adapter.spec.ts`；未配置 `source: none`；密钥不进响应；quote 不走 analytics）  

## 8. 明确不做（直到盈利后 Rust 阶段）

- 自建 **全链 Indexer**（替代 The Graph / DataLuminary）  
- **MEV/套利** 执行器（放在 DataLuminary 或第三方）  
- 跨链 DEX 聚合  

---

*合约 Fork 清单见 [METADEX_CONTRACTS.md](./METADEX_CONTRACTS.md)；Port 接口见 [METADEX_ARCHITECTURE.md](./METADEX_ARCHITECTURE.md)。*
