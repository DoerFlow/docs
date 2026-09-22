# docs · DoerFlow 官方文档

## 使用边界

这些文档公开供人阅读，也允许搜索引擎索引。**不允许**用于训练 AI，也不允许把文档交给 AI 去生成一套同类产品。详见 [AI-USE.md](./AI-USE.md)。


[doerflow](https://github.com/doerflow) 组织下的公开文档仓库，基于 [Rspress](https://rspress.rs/)。

**在线地址**：https://docs.doerflow.dev

## 架构

| 层 | 服务 |
|----|------|
| **托管** | GitHub Pages（`doerflow/docs` · GitHub Actions 构建） |
| **DNS** | Cloudflare：`docs` CNAME → `doerflow.github.io`（**DNS only**，不经过 CF CDN） |
| **官网** | [doerflow.dev](https://doerflow.dev) 独立部署于 Cloudflare Pages |

## 开发

```bash
pnpm install --ignore-scripts
pnpm dev          # http://localhost:5173
pnpm exec rspress build
pnpm preview
```

`main` 分支 push 后由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 自动构建并部署到 GitHub Pages（Source 须为 **GitHub Actions**）。

## 目录

```
docs/
├── users/          用户赚钱指南
├── developers/     开发者与安全、变现
├── platform/       平台优势与架构
├── vision/         愿景、路线图、投资者
├── whitepaper/     产品白皮书入口
└── technical/      SPEC、合约、API、开发入门
```

## 部署检查清单

1. GitHub `doerflow/docs` → Settings → Pages → Source: **GitHub Actions**
2. Custom domain：`docs.doerflow.dev`（`docs/public/CNAME`）
3. Cloudflare DNS：`docs` CNAME → `doerflow.github.io`，**Proxy status: DNS only**
4. `rspress.config.ts` 中 `base: '/'`
5. 启用 **Enforce HTTPS**（Settings → Pages）

一键 DNS（需 `CLOUDFLARE_API_TOKEN`）：MetaRepo 根目录运行 `.\scripts\setup-doerflow-dns.ps1`

## License

[Polyform Noncommercial License 1.0.0](LICENSE) (Polyform-NC). Non-commercial use permitted. Commercial use requires a separate license from DoerFlow.
