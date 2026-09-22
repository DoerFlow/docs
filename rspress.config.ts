import path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  head: [
    ['meta', { name: 'robots', content: 'noai, noimageai, noarchive' }],
    ['meta', { name: 'tdm-reservation', content: '1' }],
    ['meta', { name: 'tdm-policy', content: 'https://docs.doerflow.dev/legal/ai-use' }],
  ],
  root: 'docs',
  base: '/',
  globalStyles: path.join(__dirname, 'styles/index.css'),
  title: 'DoerFlow',
  description: 'DoerFlow 协议文档 — Agent、Skill 与人类任务的去中心化结算网络',
  icon: '/logo-mark.svg',
  logo: '/logo-mark.svg',
  logoText: 'DoerFlow',
  themeConfig: {
    nav: [
      { text: '用户赚钱', link: '/users/' },
      { text: '开发者', link: '/developers/' },
      { text: '平台优势', link: '/platform/' },
      { text: '愿景规划', link: '/vision/' },
      { text: '白皮书', link: '/whitepaper/' },
      { text: '品牌', link: '/brand/logo' },
      { text: '技术文档', link: '/technical/' },
      { text: 'GitHub', link: 'https://github.com/doerflow' },
    ],
    sidebar: {
      '/': [
        {
          text: '首页',
          items: [{ text: 'DoerFlow 是什么', link: '/' }],
        },
        {
          text: '快速入口',
          items: [
            { text: '我想赚钱（用户）', link: '/users/' },
            { text: '我是开发者', link: '/developers/' },
            { text: '项目白皮书', link: '/whitepaper/' },
          ],
        },
      ],
      '/users/': [
        {
          text: '用户指南 · 在 AI 时代赚钱',
          items: [
            { text: '总览', link: '/users/' },
            { text: '钱包 App（发任务）', link: '/users/wallet' },
            { text: '综合端 worker（接单）', link: '/users/worker' },
            { text: '人类任务赚钱', link: '/users/human-tasks' },
            { text: '社交平台任务', link: '/users/social-tasks' },
            { text: '闲置算力赚钱', link: '/users/compute' },
            { text: 'Skill 创造者', link: '/users/skill-creator' },
            { text: '企业与云 AI', link: '/users/enterprise' },
            { text: '用户协议', link: '/legal/terms' },
          ],
        },
      ],
      '/developers/': [
        {
          text: '开发者',
          items: [
            { text: '总览', link: '/developers/' },
            { text: '开源与安全', link: '/developers/open-source-security' },
            { text: '开发者如何赚钱', link: '/developers/monetization' },
            { text: '参与贡献', link: '/developers/contribute' },
            { text: 'IoT SDK', link: '/developers/iot-sdk' },
            { text: 'Agent 交易 SDK', link: '/developers/agent-trading-sdk' },
            { text: 'Onramp SDK', link: '/developers/onramp-sdk' },
          ],
        },
      ],
      '/platform/': [
        {
          text: '平台说明',
          items: [
            { text: '为什么选择我们', link: '/platform/' },
            { text: '任务治理与审批', link: '/platform/task-governance' },
            { text: '物联网交易市场', link: '/platform/iot-marketplace' },
            { text: 'MetaDEX（ve DEX）', link: '/platform/metadex' },
            { text: '跨链与资产互通', link: '/platform/bridge-connectivity' },
            { text: '法币买币 Onramp', link: '/platform/fiat-onramp' },
            { text: '链下账本与 Merkle 支付', link: '/platform/async-payments' },
            { text: '生态壮大', link: '/platform/ecosystem-growth' },
            { text: '运营管理平台', link: '/platform/admin-console' },
            { text: '架构与设计', link: '/platform/architecture' },
            { text: '安全与透明', link: '/platform/security' },
            { text: '用户协议', link: '/legal/terms' },
          ],
        },
      ],
      '/vision/': [
        {
          text: '愿景与规划',
          items: [
            { text: '项目愿景', link: '/vision/' },
            { text: 'AI 时代与加密刚需', link: '/vision/ai-crypto' },
            { text: '发展路线', link: '/vision/roadmap' },
            { text: '投资者叙事', link: '/vision/investors' },
          ],
        },
      ],
      '/legal/': [
        {
          text: '法律',
          items: [{ text: '用户协议', link: '/legal/terms' }],
        },
      ],
      '/whitepaper/': [
        {
          text: '产品白皮书',
          items: [{ text: '完整白皮书', link: '/whitepaper/' }],
        },
      ],
      '/brand/': [
        {
          text: '品牌',
          items: [{ text: 'Logo 设计规范', link: '/brand/logo' }],
        },
      ],
      '/technical/': [
        {
          text: '技术文档',
          items: [
            { text: '技术索引', link: '/technical/' },
            { text: '技术规格 SPEC', link: '/technical/SPEC' },
            { text: '仓库关系 REPOS', link: '/technical/REPOS' },
            { text: '需求追溯', link: '/technical/traceability' },
            { text: '工具链', link: '/technical/TOOLCHAIN' },
            { text: '客户端总览 CLIENTS', link: '/technical/CLIENTS' },
            { text: '任务系统 TASK_SYSTEM', link: '/technical/TASK_SYSTEM' },
            { text: '任务治理', link: '/technical/TASK_GOVERNANCE' },
            { text: '等级费率 AA', link: '/technical/FEE_TIERS_AA' },
            { text: '本地端口 PORTS', link: '/technical/PORTS' },
            { text: '物联网 IOT', link: '/technical/IOT' },
            { text: 'TB 时间窗入账', link: '/technical/SYNCROBRAIN_TELEMETRY_CREDIT' },
            { text: 'Agent 链策略', link: '/technical/AGENT_CHAIN' },
            { text: '生态策略 ECOSYSTEM', link: '/technical/ECOSYSTEM' },
            { text: '跨产品生态', link: '/technical/luminaryworks-ecosystem' },
            { text: 'MetaDEX', link: '/technical/METADEX' },
            { text: 'MetaDEX 合约计划', link: '/technical/METADEX_CONTRACTS' },
            { text: 'MetaDEX 架构', link: '/technical/METADEX_ARCHITECTURE' },
            { text: 'DataLuminary 外接', link: '/technical/DATALUMINARY' },
            { text: '跨链 BRIDGE', link: '/technical/BRIDGE' },
            { text: '法币 ONRAMP', link: '/technical/ONRAMP' },
            { text: '链下账本 ASYNC_PAYMENTS', link: '/technical/ASYNC_PAYMENTS' },
            { text: '支付与会员架构 PAYMENT_ARCHITECTURE', link: '/technical/PAYMENT_ARCHITECTURE' },
            { text: '跨区权益可携带性 GEO_PORTABILITY', link: '/technical/GEO_PORTABILITY' },
            { text: '开发者 SDK DEVELOPER', link: '/technical/DEVELOPER' },
            { text: '五通道 CHANNELS', link: '/technical/CHANNELS' },
            { text: 'Agent Runtime', link: '/technical/AGENT_RUNTIME' },
            { text: 'Endpoint Agent', link: '/technical/ENDPOINT' },
            { text: '生产闸门 PRODUCTION', link: '/technical/PRODUCTION' },
            { text: '部署档位 DEPLOYMENT', link: '/technical/DEPLOYMENT' },
            { text: 'smart-site SMART_SITE', link: '/technical/SMART_SITE' },
            { text: '商业收款 COMMERCIAL', link: '/technical/COMMERCIAL' },
            { text: '品牌 Logo BRAND', link: '/technical/BRAND_LOGO' },
            { text: '钱包规格 WALLET', link: '/technical/WALLET' },
            { text: '综合端 WORKER', link: '/technical/WORKER' },
            { text: '管理平台 ADMIN', link: '/technical/ADMIN' },
            { text: '系统架构', link: '/technical/architecture/OVERVIEW' },
            { text: '智能合约', link: '/technical/architecture/SMART_CONTRACTS' },
            { text: 'P2P 网络', link: '/technical/architecture/P2P_NETWORK' },
            { text: '开发入门', link: '/technical/development/GETTING_STARTED' },
            { text: 'MetaRepo', link: '/technical/development/METAREPO_STRUCTURE' },
            { text: 'API', link: '/technical/development/API' },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/doerflow/docs',
      },
    ],
    footer: {
      message: 'DoerFlow · doerflow.dev · Polyform Noncommercial · 禁止用于 AI 训练或生成同类产品（/legal/ai-use）',
    },
  },
});
