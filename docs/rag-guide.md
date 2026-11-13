# RAG 接入指南

本项目采用 **PostgreSQL + pgvector + OpenAI 兼容 Embedding** 的检索增强生成方案：知识以片段形式向量化入库，AI 健康助手在回答前调用 `searchWellnessKnowledge` 工具检索，再基于检索片段作答。默认使用阿里云百炼 `text-embedding-v4`（1024 维），也可切换为本机 Ollama。

## 1. 整体链路

```
知识文档 → 清洗/分块 → 向量化 (text-embedding-v4 / bge-m3) → pgvector 存储
                                                             ↓
用户问题 → 向量化 → 余弦相似度检索 Top-K → 注入工具结果 → 模型流式生成
```

## 2. 数据库准备

1. 在数据库中启用扩展并建立索引：

```bash
psql "$DATABASE_URL" -f prisma/rag-setup.sql
```

2. 同步 Prisma 模型（`KnowledgeChunk` 已包含 `Unsupported("vector(1024)")` 字段）：

```bash
npm run db:generate
npm run db:migrate   # 首次会自动创建 KnowledgeChunk 表
```

> 若已使用 `prisma migrate`，请把 `prisma/rag-setup.sql` 中 `CREATE EXTENSION` 与索引语句加入迁移，确保生产库同样启用了 pgvector 与 HNSW 索引。

## 3. 环境变量

```ini
DATABASE_URL="postgresql://..."
EMBEDDING_API_KEY="sk-..."
EMBEDDING_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
EMBEDDING_MODEL="text-embedding-v4"
```

向量维度需与模型一致：`text-embedding-v4` 默认 1024 维。更换模型时必须同步修改 schema 中的 `vector(1024)`；本机 Ollama 可用 `EMBEDDING_BASE_URL="http://127.0.0.1:11434/v1"`、`EMBEDDING_MODEL="bge-m3"`（同为 1024 维）。

## 4. 写入知识

- 编辑 `content/knowledge.json`：每篇文档必须包含 `title`、`source`、官方来源 `url`、`content` 和 `reviewedAt`（来源核对日期；不代表医学专业审核）。
- 当前库内 27 篇文档、62 个片段：中国居民膳食指南、健康中国行动、身体活动指南、睡眠健康核心信息，以及 BMJ、Clinical Nutrition、Nutrition Reviews、eClinicalMedicine、BJSM、Neuroscience & Biobehavioral Reviews、Circulation、Frontiers in Nutrition 等同行评审文献和 2025 美国膳食指南咨询委员会报告。
- 新增文献必须先核对 DOI、期刊、年份与摘要，再写入中文要点；不得凭标题或二手转述编造数据。
- 执行：

```bash
npm run rag:ingest -- --prune
```

脚本会按约 280 字分块、用内容哈希生成稳定 ID、每批 10 条向量化并写入；`--prune` 会删除本次未包含的旧片段。`ON CONFLICT` 支持重复执行覆盖更新。

生产环境建议把**内容审核、分块清洗、入库**放进后台任务或管理端，并对 `reviewedAt` 字段做审核留痕，只允许审核通过的内容被检索。

## 5. 检索与工具调用

- 检索实现：`lib/rag.ts`（向量化、余弦相似度查询、相似度阈值过滤）只检索 `reviewedAt IS NOT NULL` 的内容。
- 工具注册：`lib/ai-tools.ts` 中的 `searchWellnessKnowledge`，AI SDK 会自动进行 Function Calling。
- 阈值：`MIN_SIMILARITY = 0.45`，低于阈值返回 `NO_MATCH`，要求模型明确说明无法确认，**不编造来源**。
- 返回结构包含 `source` 字段，便于模型引用；提示词已约束检索片段为不可信数据，不能覆盖系统规则。

## 6. 验证

```bash
# 类型与构建
npm run typecheck
npm run build

# 启动后请求助手接口（开发环境）
curl -X POST http://localhost:3100/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"一天喝多少水比较合适？"}]}'
```

日志中应看到工具调用；回复中应带有知识来源标注，且不出现未检索到的引用。

## 7. 上线前必做

- 接入正式的用户认证；检索必须按用户/租户隔离，并限制可检索的知识范围。
- 知识内容需经医学/营养专业审核并记录 `reviewedAt` 与版本，定期复核过期内容。
- 增加检索与生成的日志、审计与成本限额；对模型超时、空检索、低相似度做降级处理。
- 若知识量大，考虑 IVFFlat/HNSW 参数调优与分区；对敏感内容做脱敏后再入库。
