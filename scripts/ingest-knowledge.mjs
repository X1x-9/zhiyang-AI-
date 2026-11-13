import "./load-env.mjs";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Replace with professionally reviewed content. Every chunk must carry a real,
// citable source; never ingest unverified medical claims.
const documents = [
  {
    title: "日常饮水与活动提示",
    source: "内部健康内容示例 · 待专业审核",
    content: "对多数健康成年人，分散在全天的少量多次饮水通常比一次大量饮水更舒适。活动量、气温与饮食会影响需要量；如果存在肾脏、心脏等疾病，饮水量应遵循医生建议。",
  },
  {
    title: "力量训练的渐进原则",
    source: "内部健康内容示例 · 待专业审核",
    content: "初学者每周进行两到三次基础力量训练通常较为可行。优先保证动作质量与恢复；出现持续疼痛、眩晕或其他异常时停止训练并咨询专业人士。",
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("缺少 DATABASE_URL，无法建立知识库。");
  const baseURL = process.env.EMBEDDING_BASE_URL?.trim();
  if (!process.env.EMBEDDING_API_KEY || !baseURL) throw new Error("缺少 EMBEDDING_API_KEY 或 EMBEDDING_BASE_URL，无法向量化知识。");
  const provider = createOpenAI({ apiKey: process.env.EMBEDDING_API_KEY, baseURL });
  const { embeddings } = await embedMany({
    model: provider.embedding(process.env.EMBEDDING_MODEL || "text-embedding-3-small"),
    values: documents.map((doc) => `${doc.title}\n${doc.content}`),
  });

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    for (let index = 0; index < documents.length; index += 1) {
      const doc = documents[index];
      const vector = `[${embeddings[index].join(",")}]`;
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" ("id", "title", "source", "content", "embedding", "createdAt")
        VALUES (${`chunk-${index + 1}`}, ${doc.title}, ${doc.source}, ${doc.content}, ${vector}::vector, NOW())
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "source" = EXCLUDED."source",
          "content" = EXCLUDED."content",
          "embedding" = EXCLUDED."embedding";
      `;
    }
    console.log(`已写入 ${documents.length} 条知识片段。`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
