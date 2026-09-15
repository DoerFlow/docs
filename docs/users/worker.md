---
title: 综合端 App
---

# 综合端 worker：接单赚钱

**任务执行者** 专用 App：浏览已上架订单、完成交付、收取链上报酬。

## 两大任务 Tab

| Tab | 内容 | 详解 |
|-----|------|------|
| **众包** | 拍照、短视频、问卷、GPS 等到场 / 远程任务 | [人类任务](/users/human-tasks) |
| **社交任务** | 抖音、小红书、知乎等指定操作 | [社交平台任务](/users/social-tasks) |

## 接单流程

1. 打开 worker，连接收款钱包  
2. 在众包或社交 Tab 选择 **已上架** 订单；详情会显示当前状态。已被他人接单的任务不能再接。未链上锁定 Escrow 时会提示发单方尚未 fund  
3. 按说明完成（必要时上传截图 / 凭证）  
4. 提交后进入待验收（`submitted`）→ 发单方确认 → Escrow 放款到接单地址的 **ETH 余额**（收益页可见；链下账本是另一条轨）  

**Base Sepolia**：须用独立 demo 钥（`pnpm run demo:worker:sepolia`）。不要用公开 Hardhat `#1`，否则放款会被转走。重启 Metro 后连接钱包，收益页应显示当前地址与 ETH。

社交类任务可先打开目标首页，再按清单在目标 App **自行完成** 后截图交付。须使用 **自有账号**，禁止刷量、多开、盗号。

## 与钱包 App 的区别

| | 钱包 App | 综合端 worker |
|--|----------|---------------|
| 发任务 | ✅ | ❌ |
| 接单 | ❌ | ✅ |
| 转账发币 | ✅ | 收款为主 |

## 规格

[WORKER](/technical/WORKER) · 仓库 `doerflow/worker`（私有）

[返回用户总览](/users/)


## 安装包下载

Android 侧载 APK（非 Play）托管在公开仓 [DoerFlow/downloads](https://github.com/DoerFlow/downloads/releases)：

- 官网：[doerflow.dev/download](https://doerflow.dev/download/)
- 稳定直链：[DoerFlow-Worker.apk](https://github.com/DoerFlow/downloads/releases/latest/download/DoerFlow-Worker.apk)（GitHub `latest/download`，始终指向最新发布）

允许未知来源安装。Creator DApp 仍用浏览器 [app.doerflow.dev](https://app.doerflow.dev)。

Meta-Repo：`pnpm pack:publish`（需 EAS 登录后先产出 APK）。
