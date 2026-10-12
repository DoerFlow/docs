---
title: 法币买币 · 合规 Onramp
---

# 法币入口：币到你的钱包，付款在合作方页面

在 DoerFlow 买币时，资产**直接进入你的钱包**，不进平台账户。

1. **默认是 DoerFlow 钱包**，密钥在你的设备上。你也可以改到已经连接的外部钱包。两把钱包都由你持钥。
2. **付款和身份验证**在持牌合作方页面完成。DoerFlow 不保存银行卡或证件，也不代持法币。
3. **任务、托管和平台费用**仍以 DoerFlow 为交易对手。这和这次买币付款是两件事。

DoerFlow 不申请汇款牌照。

会员订阅的收款主体仍是 LuminaryWorks Entitlement，与上面的平台交易收单分开。

## 为什么这样设计？

| 优势 | 说明 |
|------|------|
| **平台结算** | 任务与 Escrow 的交易对手是 DoerFlow。买币默认进 DoerFlow 钱包，也可改选已连接的外部钱包 |
| **钱包做深** | 密钥在设备；Vault、余额与收单都走这把钱包 |
| **不碰法币与 KYC** | 汇款和身份核验由 Stripe、MoonPay 等持牌方承担 |
| **全球覆盖** | 多合作伙伴按地区自动路由 |

## 合作伙伴

法币支付与 KYC 的法律关系在你与下列持牌方之间。他们不是任务和 Escrow 的收单方：

| 伙伴 | 场景 | 链接 |
|------|------|------|
| **Stripe Crypto Onramp** | 美国等 Stripe 覆盖区 | [stripe.com/docs/crypto/onramp](https://stripe.com/docs/crypto/onramp) |
| **MoonPay** | 全球 fallback | [moonpay.com](https://www.moonpay.com) |
| **Transak** | 多地区、多资产 | [transak.com](https://transak.com) |
| **Alchemy Pay** | 亚太、欧洲本地法币 | [alchemypay.org](https://alchemypay.org) |

## 用户流程

1. wallet / web 点击 **「买币」**
2. 收款钱包默认为 **DoerFlow 钱包**，也可以改成已连接的外部钱包
3. 打开合作伙伴 Widget（KYC 在 **对方网站** 完成）
4. 法币支付 → **USDC/ETH 打到选定地址**
5. 可选：通过 [跨链引导](/platform/bridge-connectivity) 转入 Base 或 Agent 链

## 合规披露

- **平台交易**（任务、Escrow、协议费）的收单方是 **DoerFlow**
- **法币买币**的支付与 KYC 由上表合作伙伴处理；DoerFlow 不托管 KYC / 法币
- 不可用地区将显示 **交易所 / [Base Bridge](https://bridge.base.org)** 替代引导
- 详见 [ONRAMP 技术规格](/technical/ONRAMP)

## 技术规格

- [ONRAMP](/technical/ONRAMP) · [WALLET 钱包](/technical/WALLET)
