---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 等级费率 · ERC-4337 账户抽象

**版本**: v0.1-draft · **关联**: [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)（Session Keys）

## 1. 目标

在强调**去中心化**的前提下，协议手续费不由中心化后台随意改价，而由：

1. **链上治理** 或不可变配置合约设定费率表；  
2. 用户通过 **ERC-4337 Smart Account** 绑定 **信誉/质押等级**；  
3. 结算时 Paymaster / `FeeModule` 按等级读取 `protocolFeeBps`。

## 2. 等级（示例）

| 等级 | 条件（链上） | 协议费 bps | 说明 |
|------|--------------|------------|------|
| T0 | 新账户 | 250 (2.5%) | 默认 |
| T1 | 完成 ≥10 笔 Escrow | 200 | 活跃用户 |
| T2 | 质押 ≥ X ETH 或 DAO 徽章 | 150 | 贡献者 |
| T3 | 验证 Skill Creator | 100 | 生态伙伴 |

MVP：API 返回静态表；**v1.0** 实验室 `SettlementPaymaster` 已部署（FR-PAY-008）；链上 `FeeTierRegistry` 仍见 v0.2+ 验收。

## 3. ERC-4337 集成要点

```
UserOperation (bundler)
    → Smart Account (ERC-4337)
        → 读取 accountTier(account)
        → Escrow.settleWithFee(escrowId, tierBps)
```

- **不托管用户私钥**：等级绑定在 Smart Account 地址  
- **可升级**：费率表 `UUPS` 或治理 Timelock 修改（主网前审计）  
- **与任务系统**：任务 `published` 时 Escrow 创建记录 `publisherTier` / `workerTier`，结算取双方较高档或加权（产品可配）

## 3.1 Session Keys（v0.3 · 微支付）

与 [ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md) 衔接：

| 策略字段 | 说明 |
|----------|------|
| `allowedTargets` | 可调用的 Skill / 合约地址列表 |
| `maxAmountPerCall` | 单笔收据上限 |
| `sessionBudget` | 会话总预算 |
| `validUntil` | 过期时间戳 |
| `nonce` | 链下收据起始 nonce |

Smart Account 持有主密钥；Agent 运行时仅加载 **Session Key**，泄露面可控。

## 4. API

`GET /api/v1/fees/tiers` → `{ tiers: [{ id, name, protocolFeeBps, requirements }] }`

## 5. 验收（v0.2+）

- [ ] Sepolia 上 Smart Account 完成一笔带等级费率的 Escrow 结算  
- [ ] 链下索引与 `GET /fees/tiers` 一致  

MVP 的 `GET /api/v1/fees/tiers` 仍返回本文件第 2 节静态 T0–T3 表（`FeesService`），尚无链上 `FeeTierRegistry` 索引。实验室单元测试 `fees.service.spec.ts` 校验静态表 `protocolFeeBps` 250/200/150/100；`pnpm run smoke:m4` 覆盖 SDK `listFeeTiers` 静态表（4 档 / T0=250）；`smoke:m5` 廉价断言 OpenAPI 源含 `/fees/tiers` 且该单测文件存在；**不**覆盖 Sepolia / 链上索引（上表勾选框保持未勾）。
