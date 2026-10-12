---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# DoerFlow 设计系统与体验基线

**版本**: v0.1-draft  
**状态**: 规范源  
**适用端**: 官网、Web、统一 App、迁移期 Worker、Admin

## 1. 设计原则

1. **任务优先**：先显示用户现在能完成的工作，再解释协议与技术。
2. **资金透明**：金额必须同时说明资产、网络、总额、费用、版税、实收与结算轨。
3. **状态诚实**：产品界面与技术文档使用 `Available`、`Beta`、`Lab`、`Roadmap`；测试网和工程验收不得在产品里伪装成已审计的主网服务。官网是宣传页，介绍产品优势（含规划能力），不展示工程就绪标签。
4. **一个账户，多种能力**：发布、接单、开发、设备运营是上下文，不是互斥账号。
5. **渐进披露**：普通用户先看到任务、资金与待办；开发者和协议细节进入 Build 或高级信息。
6. **可访问性默认开启**：基础无障碍是发布基线，不是后续附加项。

## 2. 信息架构

### Web

`Home / Work / Create / Money / Build / Devices / Account`

- **Home**：余额摘要、待办、最近任务/作业、环境与风险状态。
- **Work**：发现任务、我接的、我发布的、待验收、争议。
- **Create**：发布 Human / Agent 任务；内容 → 报酬与验收 → 风险确认 → 提交。
- **Money**：可用、已授权、已锁定、待结算、可提现；买币、充值、Bridge、Swap 和流水。
- **Build**：Agent、Skill、API Key、Webhook、Job、Receipt。
- **Devices**：Endpoint / Device 注册、状态、计量、收益。
- **Account**：平台账号、组织、关联钱包、套餐、语言、主题与安全。

### 统一 App

`首页 / 工作 / 发布 / 资金 / 我的`

“工作”内部承载发现、我接的、我发布的、待验收与争议。不得用全局发布者/执行者切换器改变权限。

### Admin

`Overview / Task Ops / Risk & Disputes / Payments / Providers & Devices / Platform`

运营写操作只消费 API 返回的 `permissions`；导航分组不得成为授权判断。

## 3. 主题

- 官网首次访问优先 Light；应用首次访问使用 System。
- 主题选项统一为 `system | light | dark`，保存到本机；登录后可作为偏好同步，但本机值优先避免闪烁。
- SSR/SSG 在首屏绘制前解析主题；设置 `color-scheme`、浏览器 theme color、原生 StatusBar 与图表调色板。
- 主题切换不得只反转背景；信息层级、边框、禁用态、图表和浮层均需独立验证。

## 4. 语义 token

各端可使用不同实现方式，但 token 名称与语义保持一致：

```text
color.bg.canvas
color.bg.surface
color.bg.elevated
color.text.primary
color.text.secondary
color.text.muted
color.border.default
color.border.strong
color.brand.primary
color.brand.onPrimary
color.state.success
color.state.warning
color.state.danger
color.state.info
color.focus.ring
space.1 ... space.8
radius.sm | md | lg | pill
type.display | title | heading | body | label | mono
motion.fast | normal | slow
```

品牌主色延续 DoerFlow teal。Light 模式中的文本链接与按钮背景必须使用满足对比度的深 teal，禁止直接把亮 `#00d4aa` 用作白底正文；Dark 模式可使用更亮的 teal 作为高亮。状态不能只靠颜色表达。

## 5. 核心组件契约

- **AppShell**：桌面侧栏、移动 Drawer/底栏、跳过导航链接、当前路由与全局待办。
- **ThemeToggle**：System / Light / Dark，具备可读名称和当前状态。
- **StatusBadge**：业务状态与 `Available/Beta/Lab/Roadmap` 能力状态分离。
- **MoneyAmount**：数值、资产、网络与法币参考值分层；未知汇率不伪造。
- **SettlementRail**：明确 `链上托管` 或 `链下记账 · 周期上链`。
- **FeeBreakdown**：gross、protocol fee、royalty、provider net。
- **EvidenceChecklist**：所需证据、完成状态、采集权限与验收方。
- **AsyncState**：加载、空、错误、重试、离线、部分成功均有可执行下一步。

## 6. 文案与状态

- 使用用户语言描述状态：待锁款、已锁款、执行中、待验收、待批量上链、可提现、争议中。
- “平台 Escrow 预留”不得展示为“资金已托管”。
- `Lab`、未审计、第三方 Onramp、地区限制和可能 KYC 必须在行动前可见。
- 禁止“稳赚”“保证收益”“零风险”“完全无需 KYC”“已完全去中心化”等表述。
- i18n 文案只从 locale 文件读取；禁止在 `t()` / `i18n.t()` 使用 `defaultValue`。

## 7. 基础无障碍发布门禁

- Web/Admin：WCAG 2.2 AA 基础项、完整键盘路径、可见焦点、合理标题与 landmark、表单错误关联、异步结果播报、减少动效。
- App：TalkBack/VoiceOver 名称与状态、动态字体、合理焦点顺序、44×44 触控目标、权限拒绝后的替代路径。
- 所有端：状态不只靠颜色；图标按钮有名称；金额与地址不会被读屏拆成无意义字符。
- Android Accessibility Service 仅用于受限社交步骤引导，不替代上述无障碍要求，也不得自动点击或代替用户完成任务。

## 8. 验收

- Light、Dark、System 三种模式均通过核心路径和对比度检查。
- 320px Web 宽度无水平滚动；桌面导航不溢出。
- 200% 缩放、动态字体与长翻译不会遮挡主要操作。
- 发布、接单、交付、验收、争议、买币、提现、SDK Quickstart 均有明确成功、失败和恢复路径。
- 每张交易卡能回答：谁付款、付多少、资金是否锁定、需要什么证据、谁验收、何时可提现、如何争议。
