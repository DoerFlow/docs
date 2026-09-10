---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 跨链互通 · 官方桥与 Omnichain

**版本**: v0.3 · **最后更新**: 2026-09-10  
**关联**: [AGENT_CHAIN.md](./AGENT_CHAIN.md) · [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) · [ROADMAP.md](./ROADMAP.md) · [ONRAMP.md](./ONRAMP.md)

## 1. 设计原则

| 层级 | 方式 | 定位 |
|------|------|------|
| **P0 · 现成 L2 官方桥** | Base / Arbitrum 等官方桥 | **当前主路径**；Vault / Escrow / Merkle 清算落此 |
| **P1 · 官方映射资产** | 桥接 USDC/USDT/PYUSD/ETH | 生态结算与 MetaDEX / Vault 的 **canonical 资产** |
| **P2 · Omnichain 协议** | LayerZero / CCTP / CCIP 等 | **扩展**多链 Skill、资产可达性；**不替代**官方桥安全模型 |
| **P3 · 自建链原生桥** | L1 锁仓 → 自建 L2 铸造 | **延期**；仅当自建 Agent L2 立项后（非微支付前置） |

**铁律**：用户进入结算域的主路径必须是 **现成 L2 官方桥**（或经披露的持牌 Onramp）。定制 L3 / 应用专属 Rollup **现阶段不做**（见 ASYNC_PAYMENTS FR-PAY-011）。

## 2. 链演进三阶段

```
Phase 1  当前（主）     部署在 Base / Arbitrum（现成 L2）
         └─ 用户使用各链官方桥；文档 + wallet 引导
         └─ 高频微支付：链下账本 + Merkle Root（ASYNC_PAYMENTS）
         └─ 不自建 L1 桥合约；不做定制 L3

Phase 2  延期           仅当规模证明需要自建 Agent L2 时
         └─ OP Stack（或等价）+ 原生桥评估立项
         └─ 见 AGENT_CHAIN.md「远期可选」

Phase 3  v0.8–v1.1      Omnichain 扩展
         └─ Circle CCTP（USDC 原生 burn/mint）
         └─ LayerZero OFT / CCIP（Skill 跨链、多链 USDC 可达）
```

## 3. 原生桥架构（Phase 2 · 延期 · 仅自建链立项后）

> **状态**：非当前交付。近中期请用 Phase 1 官方桥。以下规格供远期评估参考。

采用 **Optimism Bedrock 标准桥**（OP Stack 自带），避免自研桥数学。

```mermaid
sequenceDiagram
  participant User
  participant L1 as Ethereum L1
  participant Portal as OptimismPortal
  participant L2 as Agent L2
  participant Bridge as L2StandardBridge

  User->>L1: deposit ETH / approve ERC20
  User->>Portal: depositTransaction / depositERC20
  Portal->>L2: 中继 deposit 事件
  Bridge->>L2: mint WETH / wrapped USDC 至 User
```

### 3.1 核心组件

| 组件 | 链 | 职责 |
|------|-----|------|
| **OptimismPortal** | L1 | 存款入口；绑定 L2 输出根 |
| **L1StandardBridge** | L1 | 锁 ETH、锁 ERC20（USDC/USDT/PYUSD） |
| **L2StandardBridge** | L2 | 铸造/销毁 wrapped 资产 |
| **L1CrossDomainMessenger** | L1 | L1↔L2 消息 |
| **L2CrossDomainMessenger** | L2 | 接收存款、触发 mint |
| **SystemConfig** | L1 | 链 ID、Gas 参数、桥地址注册 |

提款遵循 Rollup 标准：**7 天挑战期**（可配置，主网前审计确认）。

### 3.2 支持资产与映射

| 资产 | L1（Ethereum） | L2（Agent 链）符号 | 优先级 | 用途 |
|------|----------------|-------------------|--------|------|
| **ETH** | 原生 | **WETH**（桥铸造） | P0 | Gas、Escrow |
| **USDC** | Circle 官方 | **USDC**（bridged canonical） | P0 | 主结算稳定币 |
| **USDT** | Tether 官方 | **USDT**（bridged） | P0 | 兼容性与流动性 |
| **PYUSD** | PayPal USD | **PYUSD**（bridged） | P1 | 合规稳定币选项 |

**Canonical 规则**（`deployments.json` → `bridge.tokens`）：

- 每种 L1 资产 **唯一** L2 映射合约；禁止重复 wrapped 符号  
- MetaDEX Pool、Escrow、IoT 结算 **仅引用 canonical 列表**  
- 新增资产须 admin 多签 + 文档公示  

### 3.3 合约目录（`repos/contracts`）

与 `identity/`、`metadex/` 并列；**v0.7 前为占位与配置，完整部署随 OP Stack 创世**：

```
src/
└── bridge/
    ├── interfaces/
    │   └── ICanonicalToken.sol      # canonical 注册表接口
    ├── CanonicalTokenRegistry.sol   # L2 官方映射白名单
    └── README.md                    # 指向 OP Stack 上游桥合约，不 fork 重写
infrastructure/
└── chain/                           # MetaRepo 或 contracts 子目录
    ├── op-stack/                    # genesis、rollup.json、deploy-config
    └── bridge-monitor/              # 存款/提款状态监控（可选）
```

> **不自研** L1/L2 StandardBridge 逻辑；通过 OP Stack 部署脚本生成地址，VibeAgent 仅维护 **CanonicalTokenRegistry** 与 `deployments.json`。

### 3.4 Phase 1（Base 时代 · v0.1–v0.6）

| 项 | 做法 |
|----|------|
| 跨链 | 引导用户使用 [Base Bridge](https://bridge.base.org)（Ethereum ↔ Base）；路线说明见 [Bridge to Base](https://docs.base.org/base-chain/network-information/bridges) |
| 资产 | Vault / 账本认 Circle 在 Base 发行的 **原生 USDC**（非任意 wrapped）；USDbC / WETH 仅作生态对照，不写入本页部署表 |
| wallet | 「入金 / Fund」Tab 主按钮 deep link 至 Base Bridge（非埋在二级页） |
| 验收 | 文档 + UI 引导完成一笔 Ethereum → Base USDC 路径说明 |

#### Ethereum → Base USDC（用户路径）

1. **官方桥**：wallet「入金」打开 [Base Bridge](https://bridge.base.org)（Ethereum → Base）。该入口导向 Base 官方文档列出的 Superchain 桥路线；勿使用搜索广告或不明第三方桥。  
2. **Canonical USDC**：到账后使用 Circle 在 Base 发行的原生 USDC，再进入结算。标准 OP 桥可能得到 bridged USDC（USDbC），**不要**把非 canonical 代币存入 Vault。  
3. **Vault / Escrow**：回到 wallet 将原生 USDC 存入 PaymentVault；发任务报酬走 Escrow（ETH）。链下微支付见 [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)。  

**替代**：无链上 USDC 时用法币 Onramp 买到用户 Base 地址，见 [ONRAMP.md](./ONRAMP.md)。Coinbase 账户可直接提现到 Base（无需桥）。

**Lab canonical list**：`GET /api/v1/tokens/canonical?chainId=` 返回 `{ chainId, configured, tokens: [{ symbol, address, kind }] }`。web `/payments` 以只读卡片展示该列表（无 Vault 时也可显示）。Base 主网（`8453`）仅 Circle 原生 USDC（`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`，公开常量，非伪造 DoerFlow 部署）。实验室链 `84532` / `31337` 使用现有 `deployments.json` / 匹配 env 的 Vault asset 与 mock USDC（及 localhost WETH）；未知 `chainId` 为 `configured: false` 且 `tokens: []`。该接口为只读目录，**不是** CanonicalTokenRegistry（FR-BRIDGE-003），也不是 OP Stack / CCTP。

Phase 1 **不**交付 CCTP、LayerZero、OP Stack 原生桥、Agent L2 或 CanonicalTokenRegistry。

## 4. Omnichain 协议（Phase 3）

原生桥负责 **Ethereum ↔ Agent L2**；Omnichain 负责 **Agent L2 ↔ 其他链** 及 **Skill 跨链调用**。

| 协议 | 类型 | 典型用途 | 目标版本 | 备注 |
|------|------|----------|----------|------|
| **Circle CCTP** | 官方 burn/mint | USDC 跨 Base / Ethereum / Agent L2 | v0.8 | USDC **原生**跨链，非 wrapped |
| **LayerZero V2** | 消息 + OFT | Skill 跨链执行、OFT 版 USDT | v1.1 | 已有 ROADMAP v1.1 跨链 Skill |
| **Chainlink CCIP** | 消息 + Token Pool | Oracle 触发的跨链 Escrow | v1.1 | 与 IoT Oracle 协同评估 |
| **Wormhole** | 消息桥 | 备选多链 reach | 评估 | 非默认路径 |

### 4.1 与原生桥关系

```
                    ┌─────────────────┐
   Ethereum L1 ────│ Native Rollup   │──── Agent L2
                    │ Bridge (P0)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
           Base          Arbitrum      (CCTP / LZ)
         Omnichain      Omnichain      扩展链
```

- **存款**：新用户优先 **L1 → Native Bridge → Agent L2**  
- **CCTP**：已有 USDC 在 Base/Ethereum 的用户可 **burn/mint** 直达，降低 wrapped 摩擦  
- **LayerZero**：Agent 跨链调用 Skill，**不**作为用户主存款路径  

### 4.2 api Port 层（链下）

与 MetaDEX 相同模式，**v0.8+** 在 `repos/api/src/modules/bridge/`：

| Port | 职责 |
|------|------|
| `IBridgeStatusReader` | 查询 L1 deposit / L2 mint 状态 |
| `IOmnichainRouter` | 路由 CCTP / LZ 报价（只读 + 构造 calldata） |
| `ICanonicalTokenList` | 读 `CanonicalTokenRegistry` + deployments |

业务 Service 不直连 RPC Adapter。

## 5. 客户端集成

| 客户端 | 原生桥 | Omnichain | 版本 |
|--------|--------|-----------|------|
| **wallet** | 「入金」→ 从 Ethereum 充值到 Base（Phase 1）/ Agent 桥 UI（Phase 2） | 高级入口（v0.8） | v0.3 引导 · v0.7 完整 |
| **web** | Creator 充值引导 | 同 wallet | v0.3 · v0.7 |
| **admin** | 桥监控、canonical 资产审批 | — | v0.7 |

## 6. 安全与运维

| 风险 | 缓解 |
|------|------|
| 桥合约漏洞 | OP Stack 上游审计 + 不自研核心逻辑 |
| 假 wrapped 代币 | `CanonicalTokenRegistry` + UI 只显示 canonical |
| 提款延迟 | 明确 UX：7 天挑战期说明 |
| Omnichain 中继器风险 | 默认隐藏；高级用户 opt-in + 风险披露 |
| Sequencer 停机 | 标准 Rollup 强制 inclusion 窗口 |

## 7. 需求 ID

| ID | 简述 | 主仓库 | 版本 |
|----|------|--------|------|
| FR-BRIDGE-001 | Base 官方桥引导（Phase 1）；lab `GET /api/v1/tokens/canonical` 只读列表 | wallet, web, docs, api | v0.3 |
| FR-BRIDGE-002 | OP Stack 创世 + Standard Bridge 部署 | infrastructure, contracts | v0.7 |
| FR-BRIDGE-003 | CanonicalTokenRegistry + deployments | contracts, shared | v0.7 |
| FR-BRIDGE-004 | 桥状态 Indexer / API Port | api | v0.7 |
| FR-BRIDGE-005 | wallet/web 原生桥存取款 UI | wallet, web | v0.7 |
| FR-BRIDGE-006 | Circle CCTP USDC 集成 | contracts, api | v0.8 |
| FR-BRIDGE-007 | LayerZero Skill 跨链（消息） | contracts, p2p/api | v1.1 |
| FR-BRIDGE-008 | CCIP 跨链 Escrow（评估） | contracts | v1.1 |

## 8. 验收

### Phase 1（v0.3）
- [x] wallet「充值」deep link Base Bridge  
- [x] 文档说明 Ethereum → Base USDC 路径  

### Phase 2（v0.7）
- [ ] Sepolia ↔ Agent L2 测试网：L1 存 0.01 ETH → L2 收到 WETH  
- [ ] L1 存 USDC → L2 canonical USDC 到账  
- [ ] 集成测试：提款发起 → 挑战期后 L1 到账（测试网可缩短）  
- [ ] MetaDEX / Escrow 仅接受 canonical 代币  

实验室已提供 `GET /api/v1/tokens/canonical` 只读列表。上框须等 Escrow 与 MetaRouter **对未知代币 revert** 后再勾；当前 Escrow 只收原生 ETH、Router 只要求 pair 存在，**不得勾选**。

### Phase 3（v0.8 / v1.1）
- [ ] CCTP：Base USDC → Agent L2 USDC（burn/mint）  
- [ ] LayerZero：跨链 Skill 调用 PoC  

---

*法币入口见 [ONRAMP.md](./ONRAMP.md)；链经济见 [AGENT_CHAIN.md](./AGENT_CHAIN.md)。*
