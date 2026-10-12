---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# Endpoint Agent（电脑 / 手机执行面）

**版本**: v1.2-product-model · **最后更新**: 2026-10-07
**关联**: [CHANNELS.md](./CHANNELS.md) · [WORKER.md](./WORKER.md) · [IOT.md](./IOT.md)

`channel=agent-endpoint`。本机 OS 作为 Agent 执行器，**不是** 人类 worker，也不是 IoT 设备，也不是算力出租 Device Node。

实验室本机验收：`pnpm run smoke:channels`（上手见 MetaRepo [ONBOARDING.md](../ONBOARDING.md)「五通道实验室」）。

---

## 1. 三种产品，禁止混用

| 产品 | 规格 | 谁干活 | 本版 |
|------|------|--------|------|
| **人类 worker** | WORKER.md | 人在手机上拍照/社交 | M3 已有 |
| **Endpoint Agent** | 本文 | Agent 按能力白名单操作本机 | **P3 实验室** |
| **Device Node** | SPEC FR-DV-001/002 | 出租 CPU/GPU | 未做；不阻塞本版 |
| **IoT 设备** | IOT.md | 传感器/桩等 | **P4 实验室**（HTTP 注册，非 Matter） |

同一设备可安装统一 DoerFlow App（迁移期也可有 worker）与 Endpoint Agent，但 **每张订单必须选定 `executorKind`**。Endpoint 是当前 Workspace 下的 Asset，不是新的账号；注册与执行能力由 Platform Account、Entitlement、Casbin 和设备证明共同裁决。

---

## 2. 注册与心跳（FR-EP-001）

```
POST /endpoints/register   { kind: "desktop"|"mobile", capabilities[], label }
POST /endpoints/:id/heartbeat
GET  /endpoints
```

- `kind=desktop`：本版主路径（echo / hash 白名单）。
- `kind=mobile`：只声明能力，不承诺控制任意第三方 App（iOS 禁止；Android Accessibility 仍为可选、默认关）。
- 心跳超时视为离线，不得被新作业调度。
- capability 对外状态只用 Available / Beta / Lab / Roadmap；本版 `echo/hash` 为 Lab

---

## 3. Computer-use（FR-EP-002）

允许的能力（实验室白名单）：

| capability | 行为 |
|------------|------|
| `echo` | 原样返回 input（验收用） |
| `hash` | SHA-256(input) |

禁止（默认）：任意文件、任意 Shell、任意 URL、键鼠接管、截屏整屏、读取钥匙串。

高风险能力以后若加：必须人在环确认，任务结束撤销权限。

**住宅 IP 出租**属于高风险 Roadmap，当前未上线：不得把代理出口、带宽共享或住宅地址暴露注册为可用 capability，不得提供下单或收益入口。

---

## 4. Mobile-use（FR-EP-003）

- 与人类 worker **互斥接同一单**。
- 本版不实现打开抖音等第三方 App。
- 社交任务走统一 App 清单+截图；迁移期 worker 保持兼容。

---

## 5. 结算

执行成功后：把 `outputCid`（hash）写入关联作业交付；微额走账本，任务型走治理 `deliver`。
