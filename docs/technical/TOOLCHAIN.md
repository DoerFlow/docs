---
syncSource: VibeAgent MetaRepo spec/
doNotEdit: 请修改 MetaRepo spec/ 后重新运行 scripts/sync-spec-to-docs.sh
---

> **规范源文件**：由 MetaRepo `spec/` 同步，请勿直接编辑本页。

# 工具链规范

**最后更新**: 2026-09-16

| 仓库 | 构建 | 测试 | 代码规范 |
|------|------|------|----------|
| **docs** | [Rspress](https://rspress.rs/) | — | Biome |
| **web** | [Rsbuild](https://rsbuild.rs/) + React | [Rstest](https://rstest.rs/) | Biome |
| **api** | NestJS CLI + **Fastify**（`nest build`） | Jest（逐步迁 Rstest） | Biome |
| **shared** | [Rslib](https://lib.rsbuild.dev/) | Rstest | Biome |
| **p2p** | Rslib | Rstest | Biome |
| **contracts** | Hardhat | `hardhat test` | Biome（仅 TS 脚本） |
| **wallet** | Expo / Metro（React Native） | Jest | Biome |
| **worker** | Expo / Metro（React Native） | Jest | Biome |
| **admin** | Rsbuild + React + Ant Design | Rstest | Biome |

**web** / **admin** 登录 UI：`@luminaryworks/auth-react` 的 `HeadlessLoginPanel`（web 可 `showRegister`；admin 为 `false`；详见 [CLIENTS.md](./CLIENTS.md) · [ADMIN.md](./ADMIN.md)）。

## 原则

- **文档**：只用 Rspress，不用 Vite 跑文档站。
- **前端 / 库**：优先 Rsbuild 生态（Rsbuild、Rslib），不新增 Vite/Webpack 配置。
- **格式化与 Lint**：统一 [Biome](https://biomejs.dev/)，不引入 ESLint + Prettier 双栈。
- **变更规范**：先改 `spec/`，再改实现，最后 `sync-spec-to-docs`。

## 常用命令

```bash
pnpm run setup   # MetaRepo 一键 clone + install（macOS / Linux / Windows）
pnpm check       # biome check（各仓）
pnpm format      # biome format --write
pnpm build       # 构建
pnpm test        # 测试（rstest / jest / hardhat）
```

MetaRepo 同步 Biome 配置：

```powershell
.\scripts\sync-tooling.ps1
```
