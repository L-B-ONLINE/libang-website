export type MinecraftVersion = {
  id: string;
  type: "release" | "snapshot" | "old_beta" | "old_alpha";
  releaseTime: string;
  updateName?: string | null;
  image?: { url: string; alt: string } | null;
};

export type MinecraftNews = {
  id: string;
  version: string;
  title: string;
  summary: string;
  date: string;
  type: "release" | "snapshot";
  url: string;
  updateName: string | null;
  image: { url: string; alt: string } | null;
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
  release: "릴리즈",
  snapshot: "스냅샷",
  preview: "프리릴리스 · RC",
  alpha: "알파",
  beta: "베타",
  classic: "클래식",
  infdev: "Infdev",
  preclassic: "프리클래식",
} as const;
export type VersionChannel = keyof typeof channelLabels;

export const channelDescriptions: Record<VersionChannel, string> = {
  all: "정식 출시부터 개발 중인 테스트 빌드, 초기 개발 시절의 기록까지 모았습니다. 분류를 선택하면 해당 버전의 특징과 용도를 확인할 수 있습니다.",
  release: "정식으로 공개한 플레이용 버전입니다. 새로운 콘텐츠를 추가하는 큰 업데이트와 문제를 수정하는 후속 패치·핫픽스가 포함됩니다. 서버에 접속할 때는 서버가 지원하는 버전을 먼저 확인하세요.",
  snapshot: "다음 업데이트의 기능과 변경 사항을 미리 시험하는 개발 버전입니다. 기능이 변경되거나 제거될 수 있고 버그·월드 호환성 문제가 생길 수 있습니다. 기존 월드와 분리해 테스트하는 용도에 적합합니다.",
  preview: "정식 출시 직전에 안정성을 점검하는 버전입니다. 프리릴리스(Pre-Release)는 주로 버그와 호환성을 다듬고, 출시 후보(RC, Release Candidate)는 중대한 문제가 없으면 정식 버전이 될 수 있는 최종 후보입니다. 정식 버전과 동일한 안정성을 보장하지는 않습니다.",
  alpha: "2010년의 초기 생존 게임 개발 단계입니다. 채굴·제작·생존의 기반이 발전하던 시기로, 현재와 다른 규칙과 미완성 기능이 많습니다. 현대 버전의 월드를 그대로 열지 말고 별도 설치에서 체험하세요.",
  beta: "알파 이후 정식 1.0 출시 전까지의 개발 단계입니다. 생존 콘텐츠와 월드 생성, 플레이 시스템을 확장하던 시기의 버전들입니다. 오늘날의 안정화 테스트 버전이라는 뜻과 달리, Minecraft 역사의 한 개발 시기를 가리킵니다.",
  classic: "2009년의 초기 건축 중심 단계입니다. 제한된 월드에서 블록을 놓고 부수는 플레이가 중심이었고, 현재의 생존·제작 시스템과 큰 차이가 있습니다. 당시의 Minecraft를 살펴보는 기록용 버전입니다.",
  infdev: "이름은 Infinite Development의 줄임말로, 2010년에 무한히 확장되는 월드 생성을 실험하던 단계입니다. 알파로 이어지는 과도기이며, 공식 런처에 보존된 일부 빌드만 이 목록에 표시됩니다.",
  preclassic: "클래식보다 앞선 2009년의 가장 이른 프로토타입입니다. rd-로 시작하는 초기 빌드에서 기본 이동·블록 배치 같은 기초 기능을 시험했습니다. 기능과 실행 호환성이 매우 제한적일 수 있습니다.",
};

export function versionChannel(version: Pick<MinecraftVersion, "type" | "id">): Exclude<VersionChannel, "all"> {
  if (version.type === "release") return "release";
  if (version.type === "old_beta") return "beta";
  if (version.type === "old_alpha") {
    if (version.id.startsWith("rd-")) return "preclassic";
    if (version.id.startsWith("c0.")) return "classic";
    if (version.id.startsWith("inf-")) return "infdev";
    return "alpha";
  }
  return /(?:pre|rc)[-\d]/i.test(version.id) ? "preview" : "snapshot";
}

export function minecraftDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(date));
}
