# 인천중부지사 배차 하이패스 잔액 공유 — GitHub Pages 버전

## 구성과 현재 상태
- `docs/`: 빌드 완료된 화면. GitHub Pages에 그대로 게시할 수 있습니다.
- `src/`, `components/`, `lib/`: 수정 가능한 화면 소스.
- `server/`, `migrations/`: 별도 Cloudflare Worker + D1 공유 저장 서버.
- 기존 Sites 앱과 독립된 복사본입니다. 기존 잔액, 차량명, 예약, 이력은 가져오지 않았습니다.
- 서버 연결 전에는 연결 안내가 나오며, 저장 완료를 가장하거나 기기에만 저장하지 않습니다.
- GitHub Pages만으로는 공동 저장이 되지 않습니다. 아래 서버 설정까지 해야 여러 기기에서 같은 데이터가 보입니다.

## 유지한 기능
차량 3대 기본 등록, 차량 추가/이름 변경/삭제, 출발 전·도착 후 잔액 입력, 천원 단위 입력, 6만원 미만 충전 경고, 입력자와 한국 시간 표시, 행정지원팀 카드 수령 및 인천대교 충전 안내, 메인 화면 차량별 충전 예약, 예약 이름 한 번 입력, 6만원 미만 잔액 저장 시 예약 유지, 6만원 이상 잔액 저장 시 예약 초기화, 체크 해제 후 저장 시 취소, 변경 이력, 15초마다 갱신, 동시 수정 충돌 감지.

## 1. 저장 서버 준비 (처음 한 번)
필요: GitHub 계정, 본인 Cloudflare 계정, Node.js 22.12 이상.
터미널에서 압축을 푼 폴더로 이동하고 실행합니다.

```sh
npm install
npx wrangler login
npx wrangler d1 create hipass-shared
```

생성 결과의 database_id를 `wrangler.jsonc`의 `REPLACE_WITH_YOUR_DATABASE_ID`에 넣습니다.
`ALLOWED_ORIGINS`는 실제 Pages 출처로 바꿉니다. 예: `https://leanonmept.github.io`.
저장소 이름 등 경로와 마지막 `/`는 넣지 않습니다. 커스텀 도메인을 쓰면 그 출처로 바꿉니다.

```sh
npm run db:remote
npm run server:deploy
```

배포 결과의 `https://hipass-shared-api.…workers.dev` 주소를 복사합니다.
Cloudflare 계정과 요금제에 따른 사용 한도는 해당 대시보드에서 확인하세요.

## 2. 화면 연결 및 GitHub 업로드
1. `docs/config.js`와 `public/config.js`의 빈 `apiBaseUrl`에 위 Worker 주소를 넣습니다. `/api/board`는 붙이지 않습니다.
2. GitHub에서 새 저장소(예: `hipass-balance`)를 만들고, 이 폴더의 내용을 업로드합니다. ZIP 자체를 업로드하는 것이 아닙니다.
3. Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs` → Save.
4. GitHub가 표시한 실제 Pages 주소로 엽니다. 두 기기에서 같은 차량의 기록이 보이는지 확인합니다.

`docs/`는 이미 빌드되어 있으므로 이 단계에는 화면 빌드가 필요 없습니다.
처음 연결하면 ‘차량 1, 차량 2, 차량 3’과 미입력 잔액으로 시작합니다. 기존 앱을 중단하기 전 차량명과 실제 잔액을 입력하고 공유 확인을 하세요.
새 URL이므로 기존 QR은 기존 앱을 계속 엽니다. 전환 시 새 URL로 QR을 다시 만들어야 합니다.

## 화면 수정
```sh
npm install
npm run typecheck
npm run build
```
`public/config.js` 설정은 빌드 시 `docs/config.js`로 복사됩니다. `docs/config.js`만 고쳤다면 빌드 전에 `public/config.js`에도 같은 값을 넣으세요. 빌드한 `docs/`를 함께 커밋합니다.

## 접근 방식
현재 앱과 같이 링크를 가진 사람이 이름을 직접 적어 수정하는 방식입니다. 로그인 인증은 없습니다.
GitHub Pages URL과 저장소는 비밀 공간이 아닙니다. 검색 제외 태그는 보안 기능이 아닙니다.
CORS 허용 출처는 브라우저 연결 제한이며 사용자 인증이 아닙니다. API 주소를 아는 사람의 직접 호출을 막지는 못합니다.
Cloudflare API 토큰, GitHub 토큰, 개인 자료, 실제 DB 내보내기 파일은 저장소나 config.js에 넣지 마세요.

## 공식 참고
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://developers.cloudflare.com/d1/wrangler-commands/
