---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 物联网交易与设备经济

**版本**: v0.3-lab · **最后更新**: 2026-09-18  
**路线图**: 实验室 P4 = v1.1-channels-lab HTTP 设备；TB 时间窗入账 = **FR-IOT-008**；规模化车桩/能源/冷链 = **v1.2+**（见 [ROADMAP.md](./ROADMAP.md) · [CHANNELS.md](./CHANNELS.md) 五通道实验室）

## 1. 愿景

**让 IoT 设备自己收钱**——设备在链上拥有身份与收款能力，与搭载 Agent 的终端（车、电表、传感器）通过智能合约自动撮合、结算，无需中心化平台代扣代付。

轻资产策略：**Bring Your Own Device（BYOD）**，平台提供 SDK + 合约 + 市场，硬件由厂商/用户自带。

## 2. 场景矩阵

| 场景 | 版本 | 频率 | 单笔规模 | 平台收入 |
|------|------|------|----------|----------|
| **实验室 Device HTTP**（注册/心跳/遥测） | v1.1-channels-lab | 低 | 微额账本 | 本地验收 |
| **TB 时间窗入账**（Gateway → 账本） | FR-IOT-008 | 中 | 微额账本 | 实验室 REST |
| **设备直连支付**（车↔充电桩） | v1.2+ | 中 | 中（稳定币） | Gas + 市场服务费 |
| **数据资产微市场**（传感器→Agent） | v0.5 | 极高 | 微额（$0.00001/次） | 海量调用 ×（Gas + 数据费抽成） |
| **分布式能源交易**（光伏↔储能） | v0.6 | 高 | 高（按度电） | 清算手续费（链上结算比例） |
| **供应链 IoT 契约**（冷链 SLA） | v0.6 | 中 | 企业级大单 | 复杂合约执行 Gas + 安全费 |

## 3. 场景详述

### 3.1 无人驾驶电动车 × 智能充电桩（v0.4）

**链路**：

1. 车载 Agent 监测电量不足  
2. 发现附近已认证充电桩（链上 `DeviceRegistry` + 地理索引）  
3. 导航到站；车（TBA/AA 钱包）与桩通过 `IoTEscrow` 锁定稳定币  
4. 充电开始 → 计量上报 → 完成释放款项  

**合约要点**：按 kWh 或时长计价；超时未充自动退款。

### 3.2 物联网数据资产市场 · 高频微额（v0.5）

**设备**：气象站、车载记录仪、环境监测仪、可穿戴健康数据等。

**链路**：

- 数万个传感器持续上传数据流（链下流 + 链上订阅凭证）  
- 买方 Agent（如农产品期货预测）按秒/按条调用  
- 每笔 **$0.00001** 级微支付 → 传感器地址收款  

**平台收入**：数据市场协议费（主）+ 偶发批量清算 Gas 摊销；量级为「传感器数 × QPS × 费率」。单笔微支付 **不上链**。

**技术依赖**：流式计量 Oracle、**链下账本 + Merkle 批量清算**（[ASYNC_PAYMENTS.md](./ASYNC_PAYMENTS.md)，主线 **v0.2 / M2** 交付底座后复用；部署于 Base/Arbitrum）。**不依赖** 定制 L3 / 自建应用链。场景本身排在 **1.0 后支线**（见 [ROADMAP.md](./ROADMAP.md)）。

### 3.3 分布式新能源与智能电网（v0.6）

**设备**：屋顶光伏、企业储能、虚拟电厂节点。

**链路**：

- IoT 监测 A 户余电、B 户缺电  
- 双方策略 Agent 链上竞价撮合  
- 智能合约结算 + 指令下发硬件（需合规电网接口，分阶段）  

**平台收入**：每度电链上清算抽成（`EnergyMarket` 费率参数，治理可调）。

### 3.4 供应链物联网 · 冷链 SLA（v0.6）

**设备**：货车温湿度传感器，每分钟数据包上链（hash 或压缩批次）。

**契约逻辑（示例）**：

```
全程温度 < -18℃ → 目的地释放 100% 运费
累计 >10min 高于 -10℃ → 扣 30% 运费 + 触发保险理赔事件
```

**平台收入**：企业级大单 × 复杂条件执行 Gas；频次低于数据市场但单笔资产规模大。

## 4. SDK 与设备认证

### 4.1 IoT SDK（`repos/p2p` / 未来 `repos/iot-sdk`）

| 能力 | 说明 |
|------|------|
| 设备注册 | 生成/绑定链上 Device ID（与 ERC-6551 或轻量设备证书） |
| 遥测上报 | MQTT/HTTP → 中继 → 链上 attestation |
| 收款 | 稳定币地址、订阅计费 hook |
| Agent 对接 | 发现、报价、签单模板 |

支持嵌入式 Linux、Android Things、网关代理模式（弱设备经网关上链）。

### 4.2 设备认证白名单

| 层级 | 要求 |
|------|------|
| L0 自助 | SDK 注册 + 质押押金（防 spam） |
| L1 厂商 | 硬件认证、型号白名单、固件签名 |
| L2 企业 | 冷链/充电桩等垂直资质审核 |

**未认证设备**：可挂单但限额/限品类；**认证设备**：全市场可见 + 搜索加权。

## 5. 数据模型（草案）

| 实体 | 说明 |
|------|------|
| `Device` | 设备 ID、类型、认证级别、owner、geo、pricing |
| `DataStream` | 主题、采样率、单价、质量 SLA |
| `EnergyOffer` | 供应量、时段、价格曲线 |
| `LogisticsContract` | 条件树、保险关联、运费 Escrow |

## 6. API / 合约

| 组件 | 仓库 | 版本 |
|------|------|------|
| `DeviceRegistry` | contracts | v0.4 |
| `IoTEscrow` / `MicroPaymentStream` | contracts | v0.4–v0.5 |
| `EnergyMarket` | contracts | v0.6 |
| `ConditionalFreight` | contracts | v0.6 |
| Device REST `/devices`（实验室） | api | v1.1-channels-lab |
| TB 时间窗 → 账本入账 | api | FR-IOT-008 · [SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md) |

## 7. 验收（按版本）

### v1.1-channels-lab（P4）

- [x] `POST /devices/register` + heartbeat + telemetry hash → 账本入账（`pnpm run smoke:channels`）
- [x] SDK wrap：`registerDevice` / `heartbeatDevice` / `postDeviceTelemetry`（TS + Python；见 [DEVELOPER.md](./DEVELOPER.md) §4.2）
- [x] 实验室 `GET /devices` / SDK `listDevices` / `list_devices`（空列表可接受；`pnpm run example:devices` 默认仅列出，注册须 `EXAMPLE_DEVICES_REGISTER=1`）
- HTTP 库存浏览（非 DeviceRegistry）：[CLIENTS.md](./CLIENTS.md) — wallet `/devices`、web **独立** `/devices`（注册/收益；不局限于 Payments `LabDevicesCard`）、admin `/devices`
- [ ] 链上 `DeviceRegistry` / 稳定币充电（仍为 v1.2+）

实验室 REST 示例：`pnpm run example:device`（`scripts/example-device-runner.mjs`）。这是 v1.1 HTTP 设备回路，**不是** v1.2「稳定币充电」样例。`pnpm run smoke:m5` 只确认该包装脚本与 `package.json` 的 `example:device` 存在，不运行示例，也不表示 v1.2 稳定币充电已验收。

### FR-IOT-008（TB 时间窗入账 · 实验室）

合同：[SYNCROBRAIN_TELEMETRY_CREDIT.md](./SYNCROBRAIN_TELEMETRY_CREDIT.md)。

- [x] REST：`POST /integrations/syncrobrain/telemetry-credits`（CloudEvents `com.syncrobrain.telemetry-credit.v1`）
- [x] SyncroBrain Gateway 在 TB 遥测时间窗闭合后自动出站（仍须 `DOERFLOW_ENABLED`）
- [x] asset ↔ SIWE payee 绑定表（`PUT`/`GET /integrations/syncrobrain/payee-bindings`；生产未绑定拒绝入账）
- [x] 可选信封 `data.payer`：余额足够则 `applyReceipt`（不足 `403 INSUFFICIENT_BALANCE`）；省略 payer 仍实验室铸造

### v1.2+ 车桩

`example:device` 仅为实验室 REST，不勾选下列验收。

- [ ] 认证充电桩 + 模拟车载 Agent 完成一笔稳定币充电支付（测试网）  
- [ ] SDK 样例：设备注册 + 单次收款  

### v0.5

- [ ] 100+ 模拟传感器 + 1 个买方 Agent，秒级微额扣费演示  
- [ ] 批量结算降低链上笔数  

实验室小批量微收据（`pnpm run example:micropay`，默认 N=5）仅证明 SDK 批量 `payQuote` + snapshot `batchedCount` 回路，**不勾选**上列「100+ 传感器」验收。

### v0.6

- [ ] 能源竞价撮合 PoC（模拟户用光伏）  
- [ ] 冷链 SLA 合约：温度 oracle 触发分账  

---

*与 [TASK_SYSTEM.md](./TASK_SYSTEM.md)、[AGENT_CHAIN.md](./AGENT_CHAIN.md)、[ECOSYSTEM.md](./ECOSYSTEM.md) 协同演进。*
