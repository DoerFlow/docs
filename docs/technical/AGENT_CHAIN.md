---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# Agent 链经济 · 现成 L2 优先 · 自建应用链延期

**版本**: v0.2-draft · **最后更新**: 2025-01-08  
**路线图**: MasterChef / SDK 仍可走 v0.7；**自建 L2/L3 延后**（见 [ROADMAP.md](./ROADMAP.md)）

## 1. 背景与挑战

Agent 交易特征：**高频、微额、自动化、对 Gas 与延迟极度敏感**。

小团队既要：

- 给 Agent **极低有效成本**（尤其 IoT 数据微市场，见 [IOT.md](./IOT.md)）  
- **保留平台控制权**与可持续盈利  
- 支持未来 **渐进式去中心化**  
- **拒绝联盟链**；高频路径走 **链下账本 + Merkle 清算**（见 [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)）

## 2. 战略决策（与支付架构对齐）

| 决策 | 状态 |
|------|------|
| 微支付主路径 | **链下账本 + Merkle Root → Base / Arbitrum 等现成 L2**（已定） |
| 定制 Layer 3 / 应用专属 Rollup | **现阶段不做**（财务与运维过早优化，见 ASYNC_PAYMENTS §3.3） |
| 自建 Agent L2 | **规模证明后再评估**；非微支付前置依赖 |
| MasterChef + UUPS + Trading SDK | 可在 **现成 L2** 上推进，不依赖自建链 |

早期「代币买流动性」→「交易费养生态」仍成立；收入主要来自 **市场抽成 + 清算批次 Gas 摊销**，而非依赖自建 Sequencer 的原生 Gas 垄断。

## 3. 架构：MasterChef + UUPS（部署在现成 L2）

### 3.1 合约层

| 组件 | 模式 | 作用 |
|------|------|------|
| **MasterChef** | 可配置激励池 | Agent/开发者/设备质押与分成；路由协议费分配 |
| **业务合约** | **UUPS** 可升级代理 | Escrow、IoT 市场、费率、Vault 可升级 |
| **FeeModule** | 链上 | 与 [FEE_TIERS_AA.md](./FEE_TIERS_AA.md) AA 等级联动 |
| **Vault / MicroPaymentSettler** | 链上 | 充提 + Merkle Root（[ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)） |

团队早期通过 **SimpleMultisig + DoerFlowTimelock** 掌握 **admin**（换 operator、换 Settler、Vault `owner`）；`commitRoot` 热钥不经 Timelock。路线图后期 Timelock proposer 移交 DAO / Gnosis Safe。

### 3.2 链层策略

| 阶段 | 选择 | 说明 |
|------|------|------|
| **当前～主网早期** | **Base / Arbitrum** 等现成 L2 | Vault、Escrow、Merkle 提交全部落此；Gas 仅用于批次与托管 |
| **高频执行** | **链下** | 单笔微支付不上链（ASYNC_PAYMENTS） |
| **远期可选** | 自建 L2/Orbit（评估门槛：真实 QPS、清算批次成本、生态需求） | 须单独立项；**不是** 默认路径 |

**非目标（近中期）**：为摊薄微支付 Gas 而先上定制 L3；完全去中心化 Sequencer。

## 4. 费率与盈利

| 来源 | 说明 |
|------|------|
| **市场抽成** | Escrow、数据流、能源、物流契约协议费（bps） |
| **清算相关** | Merkle 批次链上成本由协议/用户按规则分摊（极低） |
| **AA Paymaster** | 可为高等级账户补贴 Gas，差额由协议费覆盖 |
| **（远期）自建链 Gas** | 仅当自建链立项后适用 |

微额场景：单笔极低，但 **QPS × Agent/设备数** 形成规模收入。链上 Gas 仅用于 **充提、Escrow、批量 Root**。

## 5. 开发者：开源 Agent 交易模板

**目标**：AI 开发者懂 Python/大模型，不一定懂 Solidity。

| 交付 | 说明 |
|------|------|
| **Agent Trading SDK** | Python/TS：发现任务、报价、签单、回调、`signReceipt` |
| **合约模板** | 一键部署 Escrow/订阅计费包装 |
| **CLI / Cursor Skill** | 本地跑 Agent 即可接入测试网 |

App（wallet/worker）与 **纯 SDK 接入** 并列——同一协议、同一结算层。

## 6. 渐进式去中心化路线（修订）

```
当前   Base/Arbitrum + 链下账本 + Vault/Merkle + UUPS 升级权
  ↓
v0.7   MasterChef 激励 + Trading SDK（仍在现成 L2）
  ↓
v0.8+  费率/参数 DAO；状态通道拓展（可选）
  ↓
v1.0   安全审计；主网 hardening
  ↓
远期   仅当规模需要时评估自建 L2；DAO 扩大治理
```

## 7. 需求 ID（追溯）

| ID | 简述 | 目标版本 |
|----|------|----------|
| FR-CHAIN-001 | （延期）超低 Gas 自建 L2 测试网 | **远期评估** · 非微支付前置 |
| FR-CHAIN-002 | MasterChef 激励分配（现成 L2） | v0.7 |
| FR-CHAIN-003 | UUPS 可升级 Escrow/费率/Vault | v0.7 |
| FR-CHAIN-007 | 部署 admin → Multisig + Timelock（热 operator 除外） | **v1.0 ✅** 见 PRODUCTION §3 |
| FR-CHAIN-004 | （延期）团队 Sequencer 运维 | 随自建链 |
| FR-CHAIN-005 | Agent Trading SDK 模板 | **v0.4 / M4 ✅** |
| FR-CHAIN-006 | DAO 费率治理 | v1.0 |
| FR-BRIDGE-002~005 | 原生桥（随自建链） | **延期**；现阶段用 Base/官方桥 |
| FR-PAY-006/012/013 | Merkle Vault 清算与强制提现 | **v0.2 / M2**（见 ASYNC_PAYMENTS · ROADMAP） |
| FR-PAY-011 | 不做定制 L3 作微支付主路径 | **已定** |

## 8. 风险披露

- 链下账本由平台运营 → 须强制提现与公开披露（ASYNC_PAYMENTS）  
- 微额支付与监管：按司法辖区合规设计  
- UUPS 升级权滥用 → Timelock + 审计 + 社区监督  
- 过早自建链导致资本消耗 → **已用架构决策规避**  

---

*与 [ECOSYSTEM.md](./ECOSYSTEM.md)、[IOT.md](./IOT.md)、[ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) 配套阅读。*
