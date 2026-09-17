---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 平台生态与壮大策略

**版本**: v0.1-draft · **最后更新**: 2026-09-17

## 1. 核心目标

| 目标 | 做法 |
|------|------|
| **保留平台控制权** | UUPS 升级、Sequencer、费率参数、任务治理（见 [AGENT_CHAIN.md](./AGENT_CHAIN.md)、[TASK_GOVERNANCE.md](./TASK_GOVERNANCE.md)） |
| **降低入场门槛** | 开源 SDK、模板、文档；BYOD IoT（见 [IOT.md](./IOT.md)） |
| **可扩展治理** | 渐进式去中心化：私募锁仓 → 社区激励 → DAO |

## 2. 参与方激励

| 对象 | 关键激励 | 执行方式 |
|------|----------|----------|
| **投资者 / 早期基金** | 潜在回报、代币增值 | 私募/早期轮；锁仓 + 线性/里程碑释放 |
| **开发者 / Agent 创作者** | 收益分成、流量 | SDK、API、合约模板；交易手续费分成（MasterChef） |
| **合作团队 / 公司** | 品牌、技术协作 | 联合推广、生态 Grant、API/数据接口、设备白名单联合认证 |
| **普通用户** | 低交易成本、返还 | 交易返利、推荐奖励；NFT/积分激励（可选） |
| **IoT 厂商** | 设备上链创收 | 认证白名单、默认市场曝光、稳定币结算 |
| **人类工作者** | 接单收益 | worker App；任务治理保障安全 |

## 3. 收入模型汇总

| 来源 | 场景 | 文档 |
|------|------|------|
| Escrow 协议费 | Agent/Skill/人类任务 | [FEE_TIERS_AA.md](./FEE_TIERS_AA.md) |
| L2 Gas | 全链交易 | [AGENT_CHAIN.md](./AGENT_CHAIN.md) |
| 数据市场费 | 传感器微额调用 | [IOT.md](./IOT.md) §3.2 |
| 能源清算费 | 度电交易 | [IOT.md](./IOT.md) §3.3 |
| 企业契约 Gas | 冷链 SLA 等 | [IOT.md](./IOT.md) §3.4 |

## 4. 开源与开发者增长

1. **Agent 交易模板**（Python/TS）— 无 App 也能接入  
2. **IoT SDK** — 设备注册、收款、遥测  
3. **公开 docs + 测试网水龙头** — 30 分钟跑通第一笔收益  
4. **Hackathon / Grant** — 垂直场景（充电、气象、冷链）  

## 4.1 AI 边界

- **ChainSkill ≠ AiTool**。Escrow / Merkle / SIWE / 结算留在协议仓。
- 可选推理走 LuminaryWorks AI Platform。预留 Entitlement feature `ai.strategy.run`，**未实现前不得当已上线**。
- 权威：[LuminaryWorks/spec/ai-platform.md](https://github.com/LuminaryWorks/LuminaryWorks/blob/main/spec/ai-platform.md)。

## 5. 与产品矩阵关系

| 产品 | 生态角色 |
|------|----------|
| wallet | 发任务、发 IoT 服务单、质押 |
| worker | 人类执行层 |
| web | Creator / Agent 运营；`/ecosystem` 只读 catalog（非合作方控制台） |
| admin | 治理与风控（早期中心化运营） |
| 未来 IoT SDK | 设备与 Agent 机器层 |

### 5.1 工程实验室（web `/ecosystem` 与合作方商业）

Creator DApp 的 **web `/ecosystem`** 是面向 Creator 的只读 catalog / jobs 目录，**不是**合作方生产控制台。页面展示：部署档位 Tag 来自 `/capabilities.profile`；commerce readiness Tag 来自 `/capabilities.commerce.readiness`；catalog 行 readiness Tag 来自 trading catalog。部署档位低于 `agent-commerce` 时展示 `ecosystem.labHint`。catalog 加载失败与 jobs `error` 态提供 Retry；未登录或无租户空态不提供 Retry。开发者自助（Key / Skill）走 web `/developers`，与 `/ecosystem` catalog 分开。见 [CLIENTS.md](./CLIENTS.md)、[DEVELOPER.md](./DEVELOPER.md)。

VistaCast / SyncroBrain 伙伴商业是 **opt-in 工程实验室**：`DEPLOYMENT_PROFILE=agent-commerce`（或累进的 `smart-site`）才开，默认关。未接真实对端前 `/capabilities.commerce.readiness` 保持 `lab`，不得标成 production。本机验收：`pnpm run smoke:ecosystem-commerce`（别名 `smoke:ecosystem`）。

排期与档位边界：[ROADMAP.md](./ROADMAP.md) §9 生态商业实验室、§10 smart-site · [DEPLOYMENT.md](./DEPLOYMENT.md) · [SMART_SITE.md](./SMART_SITE.md)。

## 6. 治理里程碑

| 版本 | 治理状态 |
|------|----------|
| v0.1–v0.3 | 团队全控参数；仅 docs 公开 |
| v0.4–v0.6 | IoT 品类扩展；合作方白名单共治（多签） |
| v0.7 | MasterChef + 链费率；激励上链 |
| v1.0 | 审计后 DAO 提案；Sequencer 路线图公开 |

---

*投资者叙事见公开文档 `vision/investors`；版本排期见 [ROADMAP.md](./ROADMAP.md)。*
