export const servers = [
  {
    slug: "dongwon", name: "Dongwon", genre: "캐주얼 RPG", status: "운영 중",
    tagline: "퀘스트를 따라, 한 걸음씩 새로운 모험.",
    description: "퀘스트를 진행하며 캐릭터를 성장시키는 RPG.",
    tags: ["퀘스트", "모험", "성장"], imagePosition: "4% 60%",
    guide: "처음 접속했다면 로비에서 Dongwon을 선택하세요. 서버 내 첫 안내를 따라 퀘스트를 시작할 수 있습니다.",
  },
  {
    slug: "lokawar", name: "LokaWar", genre: "국가 · 전쟁", status: "개발 중",
    tagline: "함께 세운 국가, 직접 지켜내는 영토.",
    description: "국가를 세우고 영토를 두고 경쟁하는 전쟁 서버.",
    tags: ["국가", "영토", "전쟁"], imagePosition: "95% 40%",
    guide: "현재 개발 중입니다. 공개 일정과 플레이 안내는 포럼의 공지에서 확인할 수 있습니다.",
  },
  {
    slug: "reability", name: "ReAbility", genre: "능력 · 생존", status: "준비 중",
    tagline: "익숙한 생존에, 특별한 능력 하나.",
    description: "캐릭터별 고유 능력을 활용하는 생존 서버.",
    tags: ["능력", "RPG", "생존"], imagePosition: "55% 78%",
    guide: "현재 준비 중입니다. 서버가 공개되면 이곳과 가이드에 시작 방법을 안내합니다.",
  },
] as const;

export const serverAddress = "libang.online";
