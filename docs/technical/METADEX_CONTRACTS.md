---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# MetaDEX 合约实现计划（合约优先）

**版本**: v0.1-draft · **最后更新**: 2024-10-10  
**产品**: [METADEX.md](./METADEX.md) · **排期**: [ROADMAP.md](./ROADMAP.md) § M1b

## 1. 原则：合约是核心

MetaDEX 的价值捕获、ve 模型、Swap/LP 逻辑 **全部在链上**。api / web / DataLuminary 均为 **读链 + 交互壳**；**未完成合约部署与测试前，不启动 DEX 前端主路径开发**。

```
Phase A  合约 Fork + 测试 + Base Sepolia 部署     ← 当前优先级
    ↓ export-abi → shared
Phase B  api 对接 Router/Pool（Port 层读链）
    ↓ deployments.json
Phase C  web /dex Swap · LP · Vote
    ↓
Phase D  DataLuminary 分析外接（非阻塞）
```

## 2. Fork 参考

| 优先级 | 仓库 | 说明 |
|--------|------|------|
| **P0** | [aerodrome-finance/contracts](https://github.com/aerodrome-finance/contracts) | Base 同源，**首选** |
| P1 | [velodrome-finance/contracts](https://github.com/velodrome-finance/contracts) | 架构对照、单测参考 |

**许可**：Fork 前核对原仓库 License（多为 GPL/MIT），保留 SPDX 与 NOTICE。

## 3. 合约目录（`repos/contracts`）

在现有 `identity/`、`registry/`、`settlement/` 旁新增：

```
src/
├── metadex/
│   ├── tokens/           # 治理/ve 相关 ERC20（或测试网 Mock）
│   ├── amm/
│   │   ├── Factory.sol
│   │   ├── Pair.sol
│   │   └── Router.sol
│   ├── ve/
│   │   ├── VotingEscrow.sol
│   │   ├── Voter.sol
│   │   ├── Gauge.sol
│   │   └── FeeDistributor.sol   # 可选 v0.15.0 简化
│   └── interfaces/
test/
├── metadex/
│   ├── Router.t.sol
│   ├── VotingEscrow.t.sol
│   └── integration.t.sol
script/
├── deploy-metadex.ts       # Base Sepolia / localhost
└── export-abi.ts           # 含 metadex 产物 → shared / api / web
```

与 **Agent/Escrow** 合约 **同仓不同命名空间**，共享 `hardhat.config.ts` 与 `deployments.json` 键名前缀 `metadex.*`。

## 4. Phase A 交付清单（v0.15.0 · 合约）

| # | 交付物 | 验收 |
|---|--------|------|
| A1 | `Factory` + `Pair` + `Router` | Hardhat 单测：创建 Pool、Swap、Add/Remove LP |
| A2 | `VotingEscrow` + `Voter` + `Gauge` | 单测：Lock LP → ve 余额 → 投票权重 |
| A3 | 部署脚本 `deploy-metadex` | localhost + **Base Sepolia** 可重复部署 |
| A4 | `export-abi` 写入 shared | api/web 可 import ABI + 地址 |
| A5 | ≥2 个稳定/蓝筹 Pool 初始化 | 例：USDC/WETH、USDC/USDbC（测试网 Mock 或官方测试代币） |
| A6 | 集成测试 `integration.t.sol` | 完整路径：Add LP → Swap → Lock → Vote |

**Phase A 完成标志**：Sepolia 上 Etherscan 可验证合约；README 记录地址；**无 api/web 依赖也可验收**。

### 4.1 刻意裁剪（v0.15.0）

- Bribe 市场、复杂 emission 曲线微调  
- 多 Factory（仅 stable/volatile 一种即可）  
- 链上 Oracle 聚合（TWAP 留 v0.2）

## 5. Phase B（v0.15.1 · api）

| # | 交付物 | 依赖 |
|---|--------|------|
| B1 | `TsDexChainReader` 读 Pair reserves | A4 ABI |
| B2 | `TsDexQuoteEngine` 调 Router.getAmountsOut | A4 |
| B3 | `TsDexPoolSync` allowlist 同步 | deployments `metadex.pools` |
| B4 | Indexer 可选：监听 Swap/Mint 事件（**仅 allowlist**） | A3 地址 |

## 6. Phase C（v0.15.2 · web）

| # | 交付物 | 依赖 |
|---|--------|------|
| C1 | `/dex` Swap（wagmi → Router） | B2 |
| C2 | Add/Remove LP + Lock ve | A2 |
| C3 | Gauge 投票页（只读 + write） | A2 |

## 7. Phase D（并行 · 分析）

- DataLuminary Dashboard；不阻塞 A/B/C  
- 见 [DATALUMINARY.md](./DATALUMINARY.md)

## 8. 部署与配置

`deployments.json` 示例键：

```json
{
  "84532": {
    "metadex": {
      "factory": "0x...",
      "router": "0x...",
      "votingEscrow": "0x...",
      "voter": "0x...",
      "pools": ["0x...", "0x..."]
    }
  }
}
```

## 9. 变更传播顺序

```
1. spec/METADEX*.md（本文件）
2. contracts: Fork → test → deploy-metadex → export-abi
3. shared: ABI + 类型
4. api: Port Adapter 读 deployments
5. web: /dex
6. sync-spec-to-docs
```

## 10. 需求追溯

| ID | Phase | 说明 |
|----|-------|------|
| FR-DEX-001a | A | AMM 三件套 |
| FR-DEX-001b | A | ve 三件套 |
| FR-DEX-001c | A | 部署 + ABI |
| FR-DEX-002 | B | api Port |
| FR-DEX-UI-001 | C | web |

---

*链下 Port 设计见 [METADEX_ARCHITECTURE.md](./METADEX_ARCHITECTURE.md)。*
