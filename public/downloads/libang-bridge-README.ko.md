# 리뱅 서버 연동 플러그인 1.0.0

사이트: https://web.libang.online · **Java 25 이상**

- `libang-bridge-paper-1.0.0.jar`: Leaf/Paper **26.3**용. Paper API `26.3.build.246-stable`로 컴파일했습니다.
- `libang-bridge-velocity-1.0.0.jar`: 최신 안정 Velocity **4.3.1**용. Velocity API `4.3.1`로 컴파일했습니다. 이후 호환 버전은 동일한 API가 유지되는 범위에서 사용할 수 있습니다.

서버의 온라인 상태, 총 접속 인원, 최대 인원, 게임 버전, 표시할 지원 버전과 서버 소프트웨어만 사이트로 보냅니다. 플레이어 이름·UUID·채팅·인벤토리·월드 정보는 보내지 않습니다.

## 설치

1. 서버를 종료하고 해당 플랫폼의 JAR **하나**를 그 서버의 `plugins/`에 넣은 뒤 재시작합니다. Velocity JAR는 프록시에, Paper JAR는 Leaf/Paper 게임 서버에 설치합니다.
2. 사이트 관리자 → **서버 연동**에서 대상을 선택합니다. Velocity는 **리뱅 네트워크**, Leaf/Paper는 **Dongwon / Bose / ReAbility** 중 실제 서버를 선택하세요.
3. **연결 코드 발급**을 누르고 표시된 `libangbridge pair LB-...`를 해당 서버 콘솔에서 실행합니다. 코드는 10분 동안 한 번만 사용할 수 있습니다.
4. `libangbridge status`로 확인합니다. 첫 전송 뒤 사이트 표시에는 캐시에 따라 약 15~45초가 걸릴 수 있습니다.

동일한 대상에 새 코드를 연결하면 기존 서버 연결 키가 교체됩니다. 프록시와 게임 서버를 같은 대상으로 연결하지 마세요. 각 대상은 하나의 연결 키를 사용합니다.

실제 게임 서버 설치와 연결은 서버 운영자가 진행해야 합니다. 다운로드만으로 설치되거나 서버 설정이 바뀌지 않습니다.

## 명령어

콘솔은 `/` 없이, 게임 안에서는 `/`를 붙여 실행합니다.

| 명령어 | 동작 |
| --- | --- |
| `libangbridge pair <코드>` | 사이트에서 발급한 일회용 코드로 연결 |
| `libangbridge status` | 연결 상태와 최근 전송 결과 확인 |
| `libangbridge reload` | 표시 버전과 저장된 연결 정보 다시 읽기 |
| `libangbridge unlink` | 로컬 연결 키 파일 삭제 및 전송 중지 |

Paper는 OP 또는 `libangbridge.admin` 권한이 필요합니다. Velocity는 콘솔 또는 `libangbridge.admin` 권한이 필요합니다. 일반 사용자에게 권한을 부여하지 마세요.

## 설정과 연결 키

Paper: `plugins/LibangBridge/` · Velocity: `plugins/libangbridge/`

`config.properties`는 최초 실행 때 생성됩니다.

```properties
# 비우면 Paper의 실제 게임 버전 또는 Velocity의 지원 범위를 표시합니다.
# ViaVersion 등으로 별도 지원 범위를 구성했다면 운영자가 실제 값으로 입력하세요.
supported-versions=
```

예: `supported-versions=1.21.8,26.3`. 쉼표로 최대 20개, 각 80자까지 입력할 수 있습니다. 이 설정은 사이트에 표시할 정보이며 서버의 실제 접속 버전을 변경하지 않습니다.

`credentials.properties`는 연결 완료 후 생성되는 비공개 키 파일입니다. Linux에서는 파일 권한을 `600`으로 설정합니다. 공유·Git 커밋·공개 백업을 피하세요. 사이트에는 키의 SHA-256 해시만 보관합니다.

키를 폐기하려면 사이트 관리자에서 **연동 해제**를 누르세요. `unlink`는 로컬 파일을 지우며 사이트의 키 폐기는 별도로 해야 합니다. 새 연결 코드를 사용해도 이전 키는 교체됩니다.

## 동작과 문제 해결

- 정상일 때 약 30초마다 전송합니다. 게임 스레드에서 HTTP 요청을 기다리지 않습니다.
- 실패하면 30초부터 최대 5분까지 재시도 간격을 늘립니다. 인증 거절은 재연결 전까지 전송을 중지합니다.
- 사이트는 90초가 넘은 게임 서버 신호를 상태 확인 지연으로 처리합니다. 네트워크는 공개 서버 조회로도 확인합니다.
- 정상 종료 시 오프라인 신호를 별도 스레드에서 최선의 노력으로 전송합니다. 강제 종료에서는 전송되지 않을 수 있습니다.
- 연결 실패: 서버에서 `https://web.libang.online`으로 HTTPS 연결이 가능한지 확인하세요. 별도 인바운드 포트를 열 필요가 없습니다.
- 코드 오류: 만료·재사용 코드일 수 있으므로 사이트에서 새로 발급하세요.
- `UnsupportedClassVersionError`: Java 25 이상으로 실행하세요.
- 네트워크와 하위 서버의 인원은 별도 값입니다. 합산해서 중복 집계하지 않습니다.

별도의 API 키 입력이나 유료 서비스 가입은 필요하지 않습니다. 기존 사이트의 Cloudflare 요청과 D1 저장소를 사용합니다.

## 소스에서 빌드

Java 25+와 Maven 3.9+가 필요합니다.

```sh
mvn -f integrations/libang-bridge/pom.xml clean verify
```

독립 소스 ZIP을 푼 경우 `pom.xml`이 있는 디렉터리에서 `mvn clean verify`를 실행합니다. 결과는 `paper/target/`와 `velocity/target/`에 생성됩니다. Paper/Velocity API는 provided 범위이며 Gson은 별도 패키지로 재배치하여 JAR에 포함합니다.

플러그인 코어의 연결·비공개 키 저장·집계 정보 전송·명령 직렬화·종료 신호를 자동 테스트합니다. 개발 과정에서 로컬 사이트 API와의 연결도 검증했습니다. 실제 운영 서버에는 운영자의 설치가 필요합니다.

공식 참고: https://docs.papermc.io/paper/dev/project-setup/ · https://docs.papermc.io/velocity/dev/creating-your-first-plugin/
