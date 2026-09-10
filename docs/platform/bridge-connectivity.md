---
title: 跨链与资产互通
---

# 跨链互通：现成 L2 官方桥优先

DoerFlow 让用户与 Agent 在链上 **安全持有和使用 USDC、USDT、PYUSD、ETH**，并通过 **现成 L2 官方桥** 与以太坊生态打通。高频微支付走 [链下账本 + Merkle](/platform/async-payments)，**不依赖** 自建应用链。

## 分层策略

| 层级 | 方式 | 说明 |
|------|------|------|
| **P0 · 现成 L2 官方桥** | Base / Arbitrum 等 | **当前主通道**；Vault / Escrow / Merkle 清算落此 |
| **P1 · Canonical 资产** | USDC / USDT / PYUSD / WETH | 官方映射；Escrow、MetaDEX、Vault 仅认白名单 |
| **P2 · Omnichain** | CCTP、LayerZero 等 | **扩展**多链与 Skill 跨链；不替代官方桥 |
| **P3 · 自建链原生桥** | L1 锁 → 自建 L2 mint | **延期**；仅规模证明后评估 |

## 现在（Base / Arbitrum 时代）

部署在 **Base**（以及 Arbitrum 等现成 L2）时，使用各链 **官方桥** 存入 USDC/ETH。

wallet 在 **「入金」** Tab 提供 **「从 Ethereum 充值到 Base」** 引导（打开 Base 官方桥入口）；**不做定制 L3**；不自建 L1 桥合约。

## Ethereum → Base USDC（当前主路径）

已有 Ethereum 上资产、要进入 DoerFlow 结算域时，按下列顺序操作：

1. **官方桥**  
   打开 wallet **入金** → **从 Ethereum 充值到 Base**。该按钮 deep link 到 [Base Bridge](https://bridge.base.org)。该入口现导向 Base 官方文档 [Bridge to Base](https://docs.base.org/base-chain/network-information/bridges)；Ethereum L1 路线以文档当前列出的 Superchain 桥为准。只从官方页面进入，不要使用搜索广告或不明第三方桥。

2. **Canonical USDC**  
   到账后请使用 Circle 在 Base 发行的 **原生 USDC**（Vault / 账本的结算资产）。标准 OP 桥可能得到 bridged USDC（常称 USDbC）——名称相似但 **不是** Vault 认的资产，不要存入金库。

3. **DoerFlow Vault / Escrow**  
   回到 wallet 入金页，将原生 USDC 存入 **PaymentVault**；发任务锁定报酬走 **Escrow**（ETH）。高频微支付走 [链下账本 + Merkle](/platform/async-payments)，不经过再一次跨链。

**替代路径**：没有链上 USDC 时，用法币 [Onramp](/platform/fiat-onramp) 直接买到你的 Base 地址。若资金在 Coinbase 账户，可选择提现到 Base 网络（无需桥）。

Phase 1 **不**提供自建 L1 桥、定制 L3、Circle CCTP 产品化入口或自建 Agent L2。

## 自建链（远期可选）

仅当业务规模证明需要时，才评估 OP Stack 等自建 L2 与原生桥——**不是** 微支付主路径的前置条件。详见 [AGENT_CHAIN](/technical/AGENT_CHAIN)。

## Omnichain（后续扩展）

- **Circle CCTP**：USDC 原生 burn/mint 跨链  
- **LayerZero**：Agent **跨链调用 Skill**

高级入口需 **风险披露**；新用户默认走官方桥。

## 技术规格

- [BRIDGE 完整规格](/technical/BRIDGE)  
- [异步支付 / 链下账本](/platform/async-payments)  
- [Onramp 法币入口](/platform/fiat-onramp)

*最后更新：2026-09-10*
