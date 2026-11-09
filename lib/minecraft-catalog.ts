export type MinecraftVersion = {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  releaseTime: string;
};

export type MinecraftNews = {
  id: string;
  version: string;
  title: string;
  summary: string;
  date: string;
  type: "release" | "snapshot";
  url: string;
};

export type MinecraftCatalog = {
  latest: { release: string; snapshot: string } | null;
  versions: MinecraftVersion[];
  news: MinecraftNews[];
  versionsAvailable: boolean;
  newsAvailable: boolean;
};

export const channelLabels = {
  all: "전체",
  release: "정식 출시",
  snapshot: "스냅샷",
  preview: "프리릴리스 · RC",
  classic: "알파 · 베타",
} as const;
export type VersionChannel = keyof typeof channelLabels;

export function versionChannel(version: Pick<MinecraftVersion, "type" | "id">): Exclude<VersionChannel, "all"> {
  if (version.type === "release") return "release";
  if (version.type === "old_alpha" || version.type === "old_beta") return "classic";
  return /(?:pre|rc)[-\d]/i.test(version.id) ? "preview" : "snapshot";
}

export function minecraftDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(date));
}
