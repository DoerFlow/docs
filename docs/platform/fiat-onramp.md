---
title: 法币买币 · 合规 Onramp
---

# 法币入口：第三方合规 Widget

VibeAgent **不申请支付牌照、不托管法币、不收集 KYC**。用户通过 **持牌合作伙伴** 用法币购买 crypto，资产 **直接进入自托管钱包**。

VibeAgent **不是收单商户（merchant of record）**：法币合同、KYC 与银行卡处理均在合作伙伴域内完成。

## 为什么这样设计？

| 优势 | 说明 |
|------|------|
| **免牌照烦恼** | 汇款/KYC 由 Stripe、MoonPay 等持牌方承担 |
| **非托管** | 平台 never 碰银行卡与身份证件 |
| **全球覆盖** | 多合作伙伴按地区自动路由 |

## 合作伙伴

用户直接与下列持牌方建立法律关系（非 VibeAgent 收单）：

| 伙伴 | 场景 | 链接 |
|------|------|------|
| **Stripe Crypto Onramp** | 美国等 Stripe 覆盖区 | [stripe.com/docs/crypto/onramp](https://stripe.com/docs/crypto/onramp) |
| **MoonPay** | 全球 fallback | [moonpay.com](https://www.moonpay.com) |
| **Transak** | 多地区、多资产 | [transak.com](https://transak.com) |
| **Alchemy Pay** | 亚太、欧洲本地法币 | [alchemypay.org](https://alchemypay.org) |

## 用户流程

1. wallet / web 点击 **「买币」**  
2. 打开合作伙伴 Widget（KYC 在 **对方网站** 完成）  
3. 法币支付 → **USDC/ETH 打到你的钱包地址**  
4. 可选：通过 [跨链引导](/platform/bridge-connectivity) 转入 Base 或 Agent 链  

## 合规披露

- 法币交易 **merchant of record / 收单主体** 为上表合作伙伴，**非 VibeAgent**
- 不可用地区将显示 **交易所 / [Base Bridge](https://bridge.base.org)** 替代引导
- 详见 [ONRAMP 技术规格](/technical/ONRAMP)

## 技术规格

- [ONRAMP](/technical/ONRAMP) · [WALLET 钱包](/technical/WALLET)
