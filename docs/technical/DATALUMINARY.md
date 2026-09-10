---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# DataLuminary 外接分析

**版本**: v0.1-draft · **外项目**: [DataLuminary-Platform](https://github.com/DataLuminary/DataLuminary-Platform)

## 1. 边界原则

**VibeAgent** 负责：协议、合约、Swap/LP/ve 产品、轻量 API。  
**DataLuminary** 负责：重数据分析、历史统计、套利研究、可视化 Dashboard。

| 能力 | VibeAgent | DataLuminary |
|------|-----------|--------------|
| 实时 Swap / LP | ✅ | — |
| 精选 Pool 轻量缓存 | ✅ | 可镜像全量 |
| 历史 TVL / 手续费 | 跳转/代理 | ✅ |
| 全链 Pool 扫描 | ❌（盈利前） | ✅ |
| 套利脚本 / 信号 | ❌ | ✅ |
| MEV 研究 | ❌ | ✅ |
| 链重组深度回滚 | ❌（Rust 前） | 可选 |

## 2. 集成方式（v0.15+）

### 2.1 API 代理（推荐）

```
GET /api/v1/dex/analytics/overview
  → NestJS IDexAnalytics
  → DataLuminaryAdapter
  → GET {DATALUMINARY_API_URL}/v1/metadex/overview?chain=base
```

未配置时返回：

```json
{
  "success": true,
  "data": {
    "source": "none",
    "dashboardUrl": "https://github.com/DataLuminary/DataLuminary-Platform"
  }
}
```

### 2.2 前端嵌入

- web `/dex/analytics`：iframe 或新窗口打开 DataLuminary 预置 Dashboard  
- **admin `/dashboard`**：运营 KPI 外的趋势/GMV 等图表 **不自建**，嵌入或跳转 DataLuminary 预置运营 Dashboard（`DATALUMINARY_DASHBOARD_URL`）  
- 链 ID、Pool 地址通过 URL 参数传递（契约由两项目文档对齐）

### 2.3 数据回写（可选）

DataLuminary 批处理结果可 webhook 至 VibeAgent（仅展示，非交易路径）：

`POST /api/v1/dex/analytics/webhook`（内网 + secret）

## 3. 环境变量

```bash
DATALUMINARY_API_URL=https://api.dataluminary.example
DATALUMINARY_API_KEY=
DATALUMINARY_DASHBOARD_URL=
```

## 4. 安全

- API Key 仅服务端；不进 web 前端  
- 分析数据 **不参与** Swap 报价路径（防 tampering）  
- 交易签名始终客户端钱包  

## 5. 版本协同

| VibeAgent | DataLuminary |
|-----------|--------------|
| v0.15 MetaDEX Lite 上线 | 提供 Base MetaDEX 只读 Dashboard |
| v0.7 Agent L2 | 跨链分析扩展（各自排期） |

## 6. 验收证据

配置路径由 `repos/api` Jest mock fetch 覆盖（无需 live DataLuminary）：`src/modules/dex/adapters/external/dataluminary-analytics.adapter.spec.ts`。

---

*MetaDEX 产品见 [METADEX.md](./METADEX.md)。*
