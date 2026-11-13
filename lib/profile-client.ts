import type { SpaceProfile } from "./space";

export type ProfileResponse = {
  demo: boolean;
  authenticated: boolean;
  displayName: string;
  account: { email: string } | null;
  profile: SpaceProfile | null;
};

export async function fetchProfile(): Promise<ProfileResponse> {
  const response = await fetch("/api/profile");
  const data = (await response.json().catch(() => null)) as (ProfileResponse & { message?: string }) | null;
  if (!response.ok || !data) {
    throw new Error(data?.message ?? "暂时无法读取个人资料。");
  }
  return data;
}
