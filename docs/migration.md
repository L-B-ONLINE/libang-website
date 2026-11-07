# Cloudflare 이전 기록

- GitHub: `L-B-ONLINE/libang-website`, 기존 main 이력 유지.
- 소스 기준: ChatGPT Sites v55, 커밋 `0934a2c0bcc1fe383a9e7034e509876c3d573d2a`.
- 이전 Pages 소스 보관: `archive/pages-before-workers`.
- Workers: `libang-website`; D1 바인딩: `DB` → `libang-production`.
- 별도 preview: `libang-website-preview`, `DB` → `libang-preview`.
- 독립 Cloudflare 빌드: Sites 전용 Vite 플러그인과 배포 매니페스트를 사용하지 않음.
- 비밀키는 GitHub 및 빌드 산출물에 포함하지 않음.

## 운영 전환 조건

1. 게시글, 가이드, 프로필, 관리자 설정을 운영 D1에 복사하고 건수 검증.
2. Worker에 공개 변수 4개와 비밀 변수 2개 설정.
3. 메인·게시판·가이드·로그인·프로필·관리자·Microsoft 연결 확인.
4. `web.libang.online`을 Worker 사용자 지정 도메인으로 전환하고 재검증.
5. 안정화 후에만 기존 Pages·DNS 검증 레코드·옛 데이터베이스 정리. 메일 및 Minecraft DNS는 별도 서비스이므로 보존.

기존 Sites 비밀값을 읽을 수 없어 서버 키 입력과 인증 기능 검증이 남을 수 있습니다. 실제 완료 기록 없이 이 조건을 완료로 간주하지 마세요.

## 2026-11-07 확인 결과

- 최신 소스를 조직 저장소 main에 업로드 완료 (`c4c1781`). 원격 커밋 일치 확인.
- 프로덕션 빌드, TypeScript 검사, 기존 테스트 15개, Worker dry-run 통과.
- 운영 D1에 게시글 11개, 가이드 2개, Minecraft 프로필 2개, 사이트 설정 2개, 부관리자 2개 복사. 일회용 OAuth 연결 시도는 복사하지 않음.
- Cloudflare Git 연결 생성 요청이 HTTP 404 / 오류 `8000008`로 실패: 프로젝트가 Git 계정에서 연결 해제되어 있음. 기존 Pages 설정도 저장소의 이전 소유자 `kkaemok`을 가리킴.
- Cloudflare GitHub 앱에서 조직 `L-B-ONLINE`의 `libang-website` 접근을 다시 연결해야 Workers 자동 빌드 진행 가능.
- Worker 배포와 운영 도메인 전환은 아직 하지 않음. 기존 `web.libang.online`은 Sites에서 계속 운영 중.
- 이전 완료 전 필요한 비밀키: `MICROSOFT_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`. 값은 채팅이나 GitHub 대신 Cloudflare 보안 입력란에서 설정.
