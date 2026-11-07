export const servers = [
  {
    slug: "dongwon", name: "Dongwon", genre: "평화야생", status: "운영 중",
    tagline: "평화로운 야생에서 시작해, 더 넓은 모험으로.",
    description: "현재는 평화야생 서버로 운영하며, 추후 RPG 콘텐츠로 확장할 예정입니다.",
    tags: ["평화야생", "생존", "RPG 확장 예정"], imagePosition: "4% 60%",
    guide: "처음 접속했다면 로비에서 Dongwon을 선택하세요. 서버 내 안내를 따라 평화야생을 시작하세요. RPG 콘텐츠는 추후 추가될 예정입니다.",
  },
  {
    slug: "bose", name: "Bose", genre: "반야생", status: "개발 중",
    tagline: "야생에서 살아남으며 만들어가는 나만의 이야기.",
    description: "야생에서 자원을 모으고 생존을 즐기는 반야생 서버.",
    tags: ["반야생", "생존", "탐험"], imagePosition: "95% 40%",
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
