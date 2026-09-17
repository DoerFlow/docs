---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 商业收款：封闭 Beta（M5a）与公开 1.0（M5b）

**最后更新**: 2026-09-17  
**关联**: [PRODUCTION.md](./PRODUCTION.md) · [ROADMAP.md](./ROADMAP.md) · FR-PAY-016 · FR-PAY-017

**原则**：先上线、先运行；不把「打磨完成 / 能赔付」当作收款前置。  
M5a 工程可关。审计机构、有资金的 Bounty、商店账号 **AI 不伪造完成**，也 **不阻塞** 封闭 Beta 收款。

---

## 1. 模式

| `COMMERCIAL_MODE` | 何时 | 白名单 | 限额 | `unaudited` |
|-------------------|------|--------|------|-------------|
| `off` | 本地 / Sepolia | 否 | 否 | 不适用 |
| `beta` | 封闭主网收款 | **必填** | 默认 100 / 500 / 5,000 USDC；Escrow 0.05 ETH | **true**（除非 `COMMERCIAL_AUDITED=true`） |
| `public` | 公开 1.0（M5b） | 关闭 | 提高或取消 | 审计报告公开后 false |

`CHAIN_ID=8453` 禁止 `off`。错误码：`COMMERCIAL_NOT_ALLOWLISTED`、`COMMERCIAL_CAP_EXCEEDED`、`PAYMENTS_PAUSED`。

web `/developers` API Key 控制台与 `COMMERCIAL_MODE` 白名单 / 限额无关，见 [DEVELOPER.md](./DEVELOPER.md) · [CLIENTS.md](./CLIENTS.md)。

Vault 主网资产：**Base USDC** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`。Escrow 继续收 **ETH**。

链上 `PaymentVault.pause()`：禁止 `deposit`，**不禁止** `withdraw` / Settler `forceWithdraw`。

---

## 2. M5b 审计包（人类提交）

范围（建议写进审计 SOW）：

- `PaymentVault`、`MicroPaymentSettler`、`CreditLineNetting`、`SettlementBatcher`、`Escrow`、`SessionKeyRegistry`
- `SimpleMultisig` / `DoerFlowTimelock`（admin 不在热钥）
- 已知风险：链下 IOU 直至 Merkle Root 上链；`SETTLER_OPERATOR_KEY` 仅 `commitRoot` / 轧差 / Batcher

交付物：报告 PDF + 修复记录。公开后设 `COMMERCIAL_AUDITED=true`，disclosure `unaudited=false`。

联系审计机构、付费、披露 URL：**人类**。

---

## 3. 前期不予赔付（FR-PAY-017）

初创阶段 **可能有漏洞**。平台 **不承诺** 对合约漏洞、账本故障、黑客攻击、停机或资金损失作任何赔偿、保险或 Bug Bounty 赏金。承诺赔付可能导致赔付不起。

| 项 | 前期（默认） | 以后（有资金再开） |
|----|--------------|-------------------|
| `COMMERCIAL_COMPENSATION` | **`none`** | `bounty`（须同时公开赏金页与可支付池） |
| 用户可见 | **产品文档** + **注册时用户协议**（勾选同意）。**不**在支付/雇佣/Vault 页反复横幅 | 仅当 env 为 `bounty` 才增加赏金入口 |
| 漏洞报告 | `SECURITY.md` / `security@doerflow.dev` 欢迎报告 | 不因此产生付款义务 |
| Immunefi 等平台 | **不上**（无赏金池） | 人类有可赔付资金后再谈 |

`GET /payments/disclosure` 的 `commercial` 必须含：

- `compensationPolicy`: `"none"` \| `"bounty"`
- `noCompensation`: `compensationPolicy === "none"`

默认 **`none`**。机器可读字段仍在 `/payments/disclosure`（供客户端与审计），**不对用户在资金操作页反复展示**。

用户知情入口：

1. 公开文档：[用户协议](https://docs.doerflow.dev/legal/terms) · [安全与透明](/platform/security)（文档站路径）
2. **注册 / 登录 / 首次连接钱包**：必须勾选同意用户协议后才能继续（web `/login`；wallet / worker 连接钱包）

不得用「保障 / 理赔 / 官方回购」等措辞。链上 `withdraw` / Merkle `forceWithdraw` 是自助退出，**不是** 平台赔付。

---

## 4. SRE 值班（M5a = 创始人 on-call）

- 告警：`deploy/prometheus/alerts.yml`（API down、ready、commit 卡住、Indexer 无 leader）打到创始人手机即可  
- 封闭 Beta **不要求** 24/7 多人排班  
- 对外写「founder on-call」，不写「SRE 团队」  
- Runbook：PRODUCTION §4；pause 决策人 = 同一人  

---

## 5. 商店签名（wallet / worker）

A 阶段 **不** 以商店上架或签名为收款前置（Web/API 即可；移动端可内部分发 / 侧载）。

已有命令（以后要用再跑）：`pnpm run build:wallet:android:store`、`build:wallet:ios:store`。

---

## 6. 从 Beta 切到 public

1. 提高或取消 `MAX_*`；清空 `COMMERCIAL_ALLOWLIST`  
2. `COMMERCIAL_MODE=public`  
3. 主网真实地址写入 `deployments.json` `"8453"` + docs + `/payments/disclosure`  
4. **`COMMERCIAL_COMPENSATION` 仍默认 `none`**，除非已有可支付赏金池  

审计报告、Bounty 平台、商店上架 **不是** 公开收款的前置。对外称「商业版 1.0」仍建议有审计；在此之前用「封闭 Beta / 早期主网」。
