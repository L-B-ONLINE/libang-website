import { eq } from "drizzle-orm";
import { getDb } from ".";
import { guideSections } from "./schema";

export const guideKeys = ["connect", "commands", "dongwon", "lokawar", "reability", "rules", "faq"] as const;
export type GuideKey = typeof guideKeys[number];

export const guideDefaults: Record<GuideKey, string> = {
  connect: "Java 에디션: 멀티플레이 → 서버 추가 → 서버 주소에 libang.online 입력 → 접속.\n베드락 에디션: 서버 탭 → 서버 추가 → 주소에 libang.online 입력. 포트가 필요한 경우 운영자가 안내하는 포트를 사용하세요.\n접속한 뒤 로비에서 플레이할 서버를 선택하세요.",
  commands: "기본 도움말은 게임 안에서 /help를 입력해 확인할 수 있습니다.\n서버마다 사용할 수 있는 명령어가 다릅니다. 운영자가 이곳에 서버별 명령어를 추가할 예정입니다.",
  dongwon: "Dongwon은 현재 평화야생 서버로 운영 중이며, 추후 RPG 콘텐츠로 확장할 예정입니다.\n접속 후 로비에서 Dongwon을 선택하고, 게임 안에 표시되는 첫 안내를 따라 시작하세요.",
  lokawar: "Bose는 야생에서 자원을 모으고 생존을 즐기는 반야생 서버입니다.\n서버가 열리면 이곳에 처음 시작하는 방법을 안내합니다.",
  reability: "ReAbility는 능력·RPG·생존을 결합한 서버로 준비 중입니다.\n서버가 열리면 이곳에 처음 시작하는 방법을 안내합니다.",
  rules: "공식 규칙은 운영자가 이곳에 게시할 예정입니다.\n그전에는 다른 플레이어를 존중하고, 버그나 악용 가능성을 발견하면 운영진에게 알려주세요.",
  faq: "Q. Java와 Bedrock 모두 접속할 수 있나요?\nA. 네. 사이트에 두 에디션 모두 지원한다고 안내되어 있습니다.\n\nQ. 서버 공지는 어디서 보나요?\nA. 포럼의 공지 주제에서 확인할 수 있습니다.\n\nQ. 접속이 안 되면 어떻게 하나요?\nA. 서버 주소를 확인하고, 계속 안 되면 포럼의 질문 주제에 상황을 남겨주세요.",
};

export async function getGuideContent() {
  const rows = await getDb().select().from(guideSections);
  return Object.fromEntries(guideKeys.map((key) => [key, rows.find((row) => row.key === key)?.content ?? guideDefaults[key]])) as Record<GuideKey, string>;
}

export async function setGuideContent(key: GuideKey, content: string) {
  await getDb().insert(guideSections).values({ key, content, updatedAt: new Date() })
    .onConflictDoUpdate({ target: guideSections.key, set: { content, updatedAt: new Date() } });
}

export async function resetGuideContent(key: GuideKey) {
  await getDb().delete(guideSections).where(eq(guideSections.key, key));
}
