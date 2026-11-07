# L.B ONLINE

리뱅 온라인의 Next.js / React 웹사이트입니다. vinext와 Cloudflare Workers에서 실행하고, 게시글과 가이드는 D1, 로그인은 Supabase Auth를 사용합니다.

## 개발 및 검증

Node.js 24 LTS와 pnpm 11.25.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
cp .dev.vars.example .dev.vars
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

실제 키, `.env`, `.dev.vars`, 데이터 덤프는 커밋하지 않습니다. Supabase 서버 키와 Microsoft 비밀키는 브라우저에 전달하면 안 됩니다.

## Cloudflare 배포

`vite.config.ts`가 Worker 이름, D1 바인딩, 호환 날짜, 로그·트레이스 설정을 관리합니다. 빌드가 `dist/server/wrangler.json`과 정적 파일을 생성합니다.

```sh
pnpm build
pnpm deploy
```

기본 대상은 `libang-website` / `libang-production`입니다. 별도 시험 환경은 `CLOUDFLARE_ENV=preview pnpm build`로 빌드하며 `libang-website-preview` / `libang-preview`를 사용합니다. 시험 환경에는 운영 개인정보를 복제하지 않습니다.

Worker의 Settings → Variables and Secrets에서 다음 항목을 설정합니다.

| 변수 | 유형 | 용도 |
| --- | --- | --- |
| SUPABASE_URL | Text | 기존 Supabase 프로젝트 URL |
| SUPABASE_ANON_KEY | Text | 브라우저 로그인용 공개 키 |
| MICROSOFT_CLIENT_ID | Text | 기존 Microsoft 애플리케이션 ID |
| MINECRAFT_API_USE_SUPABASE | Text | 기존 Minecraft 중계 사용 시 `true` |
| SUPABASE_SERVICE_ROLE_KEY | Secret | 계정 관리 및 Minecraft 중계 |
| MICROSOFT_CLIENT_SECRET | Secret | Microsoft 계정 연결 |

기존 Sites의 비밀값은 API로 다시 읽을 수 없습니다. 안전하게 보관한 원본에서 Worker에 직접 입력해야 합니다. 키를 변경하면 기존 서비스에도 영향이 있으므로 이전 완료 전에 임의로 회전하지 않습니다.

Microsoft 콜백 주소는 `https://web.libang.online/api/minecraft/callback`입니다. 기존 Supabase 사용자와 로그인 프로젝트를 유지합니다. Worker 도메인에서 로그인 테스트할 때는 Supabase 허용 리디렉션 URL도 확인하세요.

기존 Pages 소스는 `archive/pages-before-workers` 브랜치에 보관되어 있습니다. 상세 기록과 운영 전환 조건은 [docs/migration.md](docs/migration.md)에 있습니다.
