# 📋 greennote — 칠판 정리 노트

매일 칠판에 정리한 필기를 사진으로 올려 **과목·날짜별로 모아 관리**하는 웹 노트.
사진은 **Cloudflare R2**에 저장되며, 어느 기기에서 올려도 같은 데이터를 볼 수 있다.

🔗 배포 후 주소에서 사용

## 구조

```
greennote/
├─ public/
│  └─ index.html           # 화면 (정적)
├─ src/
│  └─ index.js             # Worker — /api 라우팅 + R2 처리
└─ wrangler.toml           # Worker 설정 (main · assets · R2 바인딩)
```

- 화면(`public/index.html`)은 `/api/...` 만 호출한다.
- Worker(`src/index.js`)가 API를 처리한다:
  - `GET/PUT  /api/index`        — 기록 목록 `index.json`
  - `GET/PUT/DELETE /api/image/{id}` — 사진
- `/api` 외의 경로는 `public/` 의 정적 파일(env.ASSETS)로 서빙된다.
- 실제 R2 읽기/쓰기는 서버 측 **Worker**가 처리한다 → 브라우저에 비밀 키가 노출되지 않는다.
- 사진: 업로드 시 1200px·JPEG로 압축 → R2 객체 `img/{id}`
- 기록 목록: `index.json` (메타데이터만)

## 배포 (Cloudflare Workers + R2)

1. 이 저장소(`greennote`)를 GitHub에 올린다.
2. Cloudflare 대시보드 → **Workers & Pages**에서 이 저장소를 연결한다(Workers 빌드).
   - 배포 명령(Deploy command): `npx wrangler deploy`
   - 빌드 명령(Build command): 비움
3. R2 버킷이 이미 있다(`greennote`). `wrangler.toml`의 `[[r2_buckets]]` 설정으로 자동 바인딩된다.
   - 변수 이름: `greennote`  /  R2 bucket: `greennote`
4. 배포(또는 Retry deployment)하면 적용된다.

> 화면 상단에 "저장소(R2)에 연결되지 않았어요" 배너가 보이면 R2 바인딩이 아직 안 된 상태다.

## 도메인

- Worker에 **Custom domains** 로 원하는 주소를 연결한다 (예: `greennote.simpleornothing.com`).
- 같은 Worker에서 화면과 `/api`가 함께 서비스되므로 CORS 설정이 필요 없다.

## 접근 보호 (권장)

이 API에는 로그인이 없어서 주소를 아는 사람은 누구나 읽고 쓸 수 있다.
가족만 쓰려면 **Cloudflare Zero Trust → Access** 로 이 사이트에 이메일 인증을 걸면 코드 수정 없이 보호된다.

## 백업

화면 하단 **백업 내보내기**로 전체 기록을 JSON 한 파일로 받을 수 있고, **백업 불러오기**로 복원한다.

## 기술
바닐라 JavaScript · Cloudflare Workers (static assets) · R2 · Pretendard. 외부 빌드·의존성 없음.
