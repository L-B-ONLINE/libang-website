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

## 2026-11-07 03:10 UTC 배포 완료

- 조직 Git 연결 복구 확인. Workers `libang-website` 생성 및 main 자동 배포 연결 완료.
- 최초 Workers Builds 성공: `131d23b3-89a0-4032-92eb-a79f2898032c`.
- 배포 소스: `4591bd964a5364c6ba3cc69d22be4ce8450cd788`.
- 주소: https://libang-website.geunyanggecko.workers.dev
- Node.js 24 / pnpm 11.25.0, 빌드 `pnpm build`, 배포 `pnpm run deploy`.
- 공개 변수 4개와 운영 D1 바인딩 적용. 향후 배포 시 dashboard 변수는 `keep_vars`로 보존.
- 문서만 바뀐 경우에는 불필요한 재배포를 하지 않도록 `**/*.md` 빌드 제외.
- 비밀키 2개 입력, 로그인 및 Microsoft 연결 검증, 운영 도메인 전환은 남아 있음.

## 비밀키 설정 및 후속 키 전환

- Cloudflare에 `MICROSOFT_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`를 Secret으로 설정 완료. 키 값은 저장소에 기록하지 않음.
- Supabase의 기존 `anon` / `service_role` 방식은 우선 유지하고, 사용자 요청에 따라 새 키 전환은 후속 작업으로 분리.
- 공식 API Keys 문서는 2026년 말까지 legacy 키 deprecation을 안내하지만, 2027-01-01에 자동으로 모든 키가 정지된다고 명시하지 않음. 연말 전에 전환 검토.
- 후속 작업: 브라우저에는 `sb_publishable_…`, 서버에는 `sb_secret_…` 적용. Supabase SDK 초기화, Cloudflare 변수, Minecraft relay 호출 헤더 및 Edge Function의 인증 처리를 함께 변경하고 검증.
- 새 키는 JWT가 아니므로 기존 Bearer 전달 방식에 단순히 값만 교체하지 않음. Edge Function의 `apikey` 헤더와 자체 인증을 공식 문서에 맞춰 검증.
- 새 키 전환과 로그인·관리자·Minecraft 연결 확인을 마친 후에만 구형 키 비활성화. JWT signing secret의 무계획한 회전은 기존 세션에 영향을 줄 수 있으므로 별도 검토.
- 참고: https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

### 설정 후 연결 점검

- 제공된 service_role 키로 Supabase 관리자 API의 읽기 요청 HTTP 200 확인.
- 기존 배포된 `minecraft-auth` 함수의 health 호출은 HTTP 401 / `unauthorized`. 플랫폼 관리자 API 키의 유효성과 중계 함수의 고정 키 비교 결과가 다르므로 인증 설정 불일치를 추가 점검해야 함.
- Edge Function v2 소스를 읽어, 런타임 `SUPABASE_SERVICE_ROLE_KEY` 및 `SUPABASE_SECRET_KEYS` 값과 요청 토큰을 정확 비교하는 기존 구현임을 확인. 인증을 우회하거나 기존 키를 폐기하는 변경은 하지 않음.
- 전체 이전 완료 전 Microsoft 연결 및 Minecraft 중계의 실제 성공 검증이 필요.

## Minecraft 중계 인증 수정 완료

- 문제: 관리자 API에서 유효한 legacy service_role JWT도 Edge Function 런타임 키와 문자열이 다르면 정확 비교에서 거절됨.
- 수정: 기존 키의 정확 비교를 유지하고, 일치하지 않는 legacy JWT는 프로젝트·role·만료를 먼저 확인한 뒤 같은 Supabase 프로젝트의 관리자 API로 서명과 관리자 권한을 검증. 검증 실패나 장애 시 중계 요청을 허용하지 않음.
- Edge Function `minecraft-auth` v3 배포, `verify_jwt=true` 유지. 새 API 키 방식으로의 전환은 하지 않음.
- 회귀 테스트 20개 및 TypeScript 검사 통과. 다른 프로젝트·일반 사용자·만료/위조 JWT·검증 서버 장애 차단 포함.
- 실제 service_role 키 health 호출: HTTP 200, `reachable=true`, Minecraft upstream HTTP 401 (의도적으로 잘못된 진단 토큰에 대한 정상 거절).
- 실제 무인증 및 잘못된 키 요청: HTTP 401. 키 값과 관리자 API 응답의 사용자 정보는 로그/저장소에 기록하지 않음.
- 실제 사용자 Microsoft 로그인 및 OAuth 콜백은 별도 사용자 확인 필요. 운영 도메인은 아직 기존 Sites에 연결되어 있음.

## 계정 얼굴 및 서버 안내 수정

- 내부 페이지 이동 시 전체 문서 재로드 대신 라우터로 이동해 루트 로그인·프로필 상태를 유지. 프로필 정보 로딩 중에는 기본 계정 아이콘을 먼저 표시하지 않음.
- 현재 vinext 빌드의 next/link 프리패치/클릭 오류를 브라우저에서 확인해, 기존 라우터 API를 사용하는 공통 SiteLink 적용. 새 탭·수정키·다운로드 등 기본 앵커 동작은 유지.
- 저장된 선택이 없는 경우 기본 라이트 테마 적용. 기존 라이트/다크/자동 선택은 유지.
- Dongwon: 현재 평화야생, 추후 RPG 확장 예정. Bose: 반야생으로 안내. 기존 /servers/lokawar는 /servers/bose로 영구 리디렉션하고 기존 가이드 키와 링크 호환 유지.
- 타입 검사, 기존 테스트 20개, 프로덕션 빌드 통과. Chromium 모바일 화면에서 로그인·프로필 응답을 모의해 4회 페이지 이동 동안 문서 로드 1회, 로그인 설정 요청 1회, 프로필 요청 1회, 얼굴 교체 0회를 검증.
- 라이트 기본값(운영체제 다크), 저장된 다크 선택, 서버 안내, 구 링크 리디렉션, Bose 가이드도 브라우저 검증.

- Cloudflare 자동 배포 `0b3bb3a4-dae8-4a16-a26b-7eca77b3e980` 성공. 실제 Workers URL에서도 동일 Chromium 시나리오 통과, 페이지 오류 없음.
