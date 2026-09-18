---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 综合端 App 规格（React Native）

**版本**: v0.1-draft · **最后更新**: 2026-09-18  
**仓库**: `repos/worker` → `doerflow/worker`（私有）

---

## 1. 定位

面向 **任务执行者** 的 **综合接单 App**：

1. **AI Agent 众包任务**（人类任务）：拍照、视频、问卷、GPS  
2. **社交平台任务**：在抖音、小红书、知乎等完成 **点赞、观看、收藏** 等（用户自愿、账号自有）  
3. **收益**：Escrow 结算至绑定钱包地址  

发单在 **wallet App**；本 App **仅接单与交付**。**不提供** Creator `/ecosystem` 合作方 catalog UI；Creator 走 web。见 [CLIENTS.md](./CLIENTS.md) · [ECOSYSTEM.md](./ECOSYSTEM.md)。

## 2. 社交平台任务

社交任务是 **M3 要做的产品能力**（wallet 发单声明平台与步骤 → 治理人工审 → worker 社交 Tab 接单 → 清单 + 截图 → `submitted` → 发单方验收）。用户在自有账号上自愿操作；平台不代操作、不绕过目标 App。

> **残障无障碍（已定，前期不做）**：不针对听障、视障、言语障碍等特殊人群做读屏、字幕、WCAG、TalkBack/VoiceOver 专项。见 [CLIENTS.md](./CLIENTS.md)。这 **不是**「不做社交任务」。

### FR-WRK-010 能力说明（v0.4 进行中：2026-09-18 已定立即开工，非社交任务本体）

社交任务本体不依赖此条。此条仅指 Android **无障碍服务（Accessibility Service）** 自动打开目标 App 的步骤引导（及 iOS 调研），**不是** 残障无障碍，也 **不是** M3 社交任务的验收条件。

- 在用户 **明确授权** 后，辅助跳转到目标 App  
- 引导完成 **可验证步骤**（如：打开指定视频 → 停留 N 秒 → 点赞）  
- 生成交付凭证：截图时间戳 + 步骤完成标记（**不上传** 聊天记录、密码）  
- **不是** 面向聋哑盲的残障无障碍产品

#### 第一刀（stub，worker Android，2026-09-18）

已落地，且 **禁止** 自动操作：

- 声明 `SocialGuidanceAccessibilityService`：`onAccessibilityEvent` / `onInterrupt` 为空；`canRetrieveWindowContent=false`；不点击、不抓取、不代完成
- RN 模块 `SocialGuidance`：`isServiceEnabled`、`openAccessibilitySettings`、`openTargetApp(packageName)`
- 社交任务详情：风险提示 + 去系统设置开启 + 打开目标 App（失败则 `Linking.openURL` 首页）
- 原生源在 `repos/worker/plugins/social-guidance/native/`；`android/` 被 gitignore，由 `plugins/with-social-guidance.js` 在 Expo prebuild 写入

本刀不做：手势/节点点击、窗口内容读取、步骤完成判定、事件 hash、自动勾选清单、自动交付、iOS 引导。

### FR-WRK-011 合规与安全

- 首次启用需阅读风险提示 + 系统无障碍授权  
- 禁止自动化批量注册、破解、窃取数据  
- 任务必须来自 **已 published** 且通过风控的订单  
- 平台 **不提供** 绕过目标 App 安全机制的能力  

### FR-WRK-012 交付验证

- 必填：结果截图（含平台 UI 特征）  
- 可选：无障碍事件序列 hash  
- API 校验 → 若任务已绑定 `onChainEscrowId`：worker 调用 `deliverEscrow` → 发单方 `confirmDelivery` 放款  
- 未绑定时可走链下账本 stub（`ledgerSettled`）  

### 支持平台

| 平台 | 任务示例 | 版本 |
|------|----------|------|
| 抖音 | 观看、点赞 | **v0.3 / M3** |
| 小红书 | 浏览、点赞、收藏 | **v0.3 / M3** |
| 知乎 | 阅读、赞同 | **v0.3 / M3** |

## 3. Agent 众包任务

与 ex-WALLET §FR-WL-002~004 相同：

- 任务大厅（仅 `published`）  
- 接单、交付说明、链上 `deliverEscrow`（已绑定 `onChainEscrowId` 时）；`deliver` 后任务为 `submitted`（待发单方验收）或直接 `completed`  
- 任务详情须展示当前状态；仅 `published`/`open` 且无人接单时显示接单。已被他人接单须说明，不得再显示接单。已交付须标明待验收，不得只剩空白表单。未锁定链上 Escrow 时提示发单方尚未 fund；已锁定/已放款与收益页同一套标记  
- 收益页  

### FR-WRK-003 v0.3 交付凭证

- **相机**：`expo-camera` 拍摄现场/结果照片 → `POST /human-tasks/:id/proof` 得到 `proofCid`  
- **GPS**：`expo-location`；`remote=false` 的线下任务交付前必须附加坐标（写入交付说明 `gps:lat,lng`）  
- **问卷**：交付说明必填（完成步骤 / 问卷答案）  
- **社交（M3，要做）**：详情走 `app/social/[id]`；展示发单方声明的 App 与步骤；**可打开目标 App 首页**（系统浏览器 / 已安装 App，不代操作）；须勾选清单后上传截图。Accessibility Service 自动打开 App 为 **v0.4 进行中**（已定立即开工）  
- **API**：`verificationRequired` 或 `taskType=social` 的交付必须带 `proofCid`，否则 `PROOF_REQUIRED`  
- 大厅 / 交付 / 收益 / Vault 用户文案走 en/zh locale  
- 首次连接钱包须勾选用户协议（含前期不予赔付；全文在文档站 `legal/terms`）  
- **本机自动测（不必点 Expo）**：API 已起时 `pnpm run smoke:m3` 走大厅可见 → 接单 → `GET /human-tasks/:id` 为 `assigned` → 第二钱包不可接 → 交付（`submitted`/`completed`）。按钮条件由 `repos/worker` 的 `pnpm test`（`task-state`）覆盖。Playwright 只覆盖 admin 登录页，不点 worker UI  
- 详情展示当前状态；仅 `published`/`open` 且无 `assigneeAddress` 时显示接单；已被他人接单须提示且不得再接；交付后标明待验收；未锁定 Escrow 时提示 `needFund`；已锁定/已放款与收益页同一套标记  
- 收益页须展示 **原生 ETH 余额**（链上 `confirmDelivery` 打到此地址）；`onChainEscrowId` / `escrowReleaseTxHash` 的任务标明「链上已放款」或「已锁定」，不得只显示空的链下账本让人以为没收到钱  
- 公共测试网（非 31337）**禁止**在代码里回退到 Hardhat `#0`/`#1`；缺 demo 钥须明确报错。已连接公开 Hardhat 地址时须警告（放款会被 EIP-7702 转走）  

见 [用户文档 · 人类任务](../repos/docs/docs/users/human-tasks.md)。

## 4. 功能需求摘要

| ID | 内容 |
|----|------|
| FR-WRK-001 | 绑定收款地址（只读展示，可从 wallet 导入同一助记词）。**Base Sepolia demo 钥必须是非公开密钥**；禁止用 Hardhat `#1`（公共测试网上会被 EIP-7702 转走放款）。本地 31337 仍可用 `#1`。`pnpm run demo:worker:sepolia` 可轮换并打 0.002 ETH Gas |
| FR-WRK-002 | 任务大厅（human + social 分 Tab）；**仅 `published`/`open`** |
| FR-WRK-003 | 众包交付（相机/GPS/问卷 + `proofCid`）→ `submitted`；详情展示状态；仅未接单可接；待验收 / 未 fund 提示 |
| FR-WRK-004 | **社交任务（M3 要做）**：大厅 + 打开目标首页 + 清单 + 截图交付 |
| FR-WRK-010 | Android Accessibility Service 社交步骤引导（**v0.4 进行中**，已定立即开工；非残障无障碍） |
| FR-WRK-011 | 社交步骤引导合规与授权（v0.4） |
| FR-WRK-012 | 社交交付截图 / 可选事件 hash（v0.4） |
| FR-WRK-005 | 收益与历史；Vault 提现；**原生 ETH（Escrow 放款）** + 任务完成账本余额（`GET /payments/ledger/balances`）；链上已放款任务须标明 |
| FR-WRK-006 | 推送（v0.4） |
| FR-WRK-007 | **M3** 争议：任务详情对 `assigned|submitted|verifying` 可 `POST /tasks/:id/dispute`（openedBy=worker） |
| FR-WRK-008 | 可选 Logto 平台会话：只为平台门禁接单/交付调用附 token，并展示套餐/组织；不替代收款钱包 |

## 5. 技术栈

- React Native · Expo（**独立工程**，与 wallet 分仓库）  
- Android 正式 APK 由 Meta `pnpm pack:publish` 发到 GitHub `DoerFlow/downloads`，稳定文件名为 `DoerFlow-Worker.apk`（`releases/latest/download`）；**不**上 Play Store。
- 原生模块：`expo-camera`、`expo-location`  
- Android：Accessibility Service（**原生 Kotlin 模块**，v0.4 进行中，社交步骤引导；**不是**读屏/字幕）  
- **前期不做** 面向聋哑盲等特殊人群的残障无障碍适配
- `api`：`GET /tasks?status=published&type=social|human`  
- 本机私钥/签名永不传给 Logto 或平台；公开任务浏览和链上收款地址保持钱包语义
- `401` 要求平台登录，`402` 为套餐/配额，`403` 为任务资源无权；DoerFlow 不显示 Trial CTA/倒计时

## 6. 里程碑

| 版本 | 交付 |
|------|------|
| v0.3 | 众包 + **社交任务**（抖音/小红书/知乎：发单声明平台与步骤、人工审、接单、清单+截图、验收）；相机/GPS/问卷；收益 Vault + 账本；链上 `deliverEscrow` |
| v0.4 | **进行中**：Accessibility Service 打开目标 App（已定立即开工）；**不含**残障无障碍 |
| v0.5 | 更多社交平台扩展 |

---

*代码可从 `repos/wallet` 众包模块迁移为初始实现。*
