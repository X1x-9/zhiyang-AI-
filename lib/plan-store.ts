import { isDemoMode } from "./demo-data";
import { buildPlan, planFingerprint, type PlanDocument } from "./plan-engine";
import { getPrisma } from "./prisma";
import type { SpaceProfile } from "./space";

export type StoredPlan = {
  plan: PlanDocument;
  persisted: boolean;
  demo: boolean;
};

const globalForPlans = globalThis as unknown as { planMemory?: Map<string, StoredPlan[]> };

function memoryStore() {
  if (!globalForPlans.planMemory) globalForPlans.planMemory = new Map();
  return globalForPlans.planMemory;
}

function saveToMemory(profile: SpaceProfile, fingerprint: string, demo: boolean): StoredPlan {
  const store = memoryStore();
  const versions = store.get(fingerprint) ?? [];
  const plan = buildPlan(profile, versions.length + 1);
  const record: StoredPlan = { plan, persisted: false, demo };
  versions.push(record);
  store.set(fingerprint, versions);
  return record;
}

function latestFromMemory(fingerprint: string, demo: boolean): StoredPlan | null {
  const versions = memoryStore().get(fingerprint);
  if (!versions?.length) return null;
  return { ...versions[versions.length - 1], demo };
}

function profileIdFor(fingerprint: string) {
  return `space-${fingerprint}`;
}

export async function generatePlanVersion(profile: SpaceProfile): Promise<StoredPlan> {
  const demo = isDemoMode();
  const fingerprint = planFingerprint(profile);
  if (demo || !process.env.DATABASE_URL) return saveToMemory(profile, fingerprint, demo);

  try {
    const prisma = getPrisma();
    const profileId = profileIdFor(fingerprint);
    await prisma.healthProfile.upsert({
      where: { id: profileId },
      create: { id: profileId, displayName: profile.name || "未命名", goal: profile.goal },
      update: {},
    });
    const latest = await prisma.planVersion.findFirst({
      where: { profileId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const plan = buildPlan(profile, version);
    await prisma.planVersion.create({ data: { profileId, version, plan } });
    return { plan, persisted: true, demo: false };
  } catch {
    return saveToMemory(profile, fingerprint, demo);
  }
}

export async function getLatestPlan(fingerprint: string): Promise<StoredPlan | null> {
  const demo = isDemoMode();
  if (demo || !process.env.DATABASE_URL) return latestFromMemory(fingerprint, demo);

  try {
    const prisma = getPrisma();
    const row = await prisma.planVersion.findFirst({
      where: { profileId: profileIdFor(fingerprint) },
      orderBy: { version: "desc" },
    });
    if (!row) return null;
    return { plan: row.plan as unknown as PlanDocument, persisted: true, demo: false };
  } catch {
    return latestFromMemory(fingerprint, demo);
  }
}