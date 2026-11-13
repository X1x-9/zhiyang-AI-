# 智养 AI

懂你的饮食、训练与日常节奏的健康生活教练。记录一餐、安排一日、复盘一周，让健康计划跟得上真实生活。

> 本仓库为项目第一版代码快照（对应 2026-11-03 的初始工程）：最初的静态 HTML/JS 原型，加上首个 Next.js 应用骨架。

## 第一版包含

- 静态原型：`index.html`、`js/main.js`
- Next.js App Router 骨架：今日概览、餐食记录、AI 健康助手
- 演示数据与基础响应式样式
- 餐食分析、估算与助手 API 的初始实现

## 技术栈

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS 4
- Prisma · AI SDK

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认访问 http://localhost:3000。环境变量说明见 `.env.example`，请勿提交真实的 `.env.local` 或密钥。

## 说明

这是早期版本，饮食/运动计划、数据库持久化、账号体系和天气等功能尚未加入，后续版本会逐步补齐。
