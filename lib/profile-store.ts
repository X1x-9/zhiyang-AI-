import type { Identity } from "./identity";
import { readDemoProfile, writeDemoProfile } from "./demo-session";
import { getPrisma } from "./prisma";
import { goalLabels, normalizeSpaceProfile, type SpaceProfile } from "./space";

export async function loadProfile(identity: Identity): Promise<SpaceProfile | null> {
  if (identity.kind === "demo") return readDemoProfile(identity.sessionId);
  const row = await getPrisma().healthProfile.findUnique({
    where: { userId: identity.userId },
    select: { data: true },
  });
  return row?.data ? normalizeSpaceProfile(row.data) : null;
}

export async function saveProfile(identity: Identity, profile: SpaceProfile): Promise<SpaceProfile> {
  if (identity.kind === "demo") return writeDemoProfile(identity.sessionId, profile);
  await getPrisma().healthProfile.update({
    where: { id: identity.profileId },
    data: {
      data: profile,
      displayName: profile.name.trim() || identity.displayName,
      goal: goalLabels[profile.goal],
      dietaryNotes: profile.avoid.trim(),
    },
  });
  return profile;
}
