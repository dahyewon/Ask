# Ask Interview Practice

간단한 인터뷰 연습용 Next.js 프로젝트입니다.

## 요구 사항

- Node.js 18 이상 권장
- npm 또는 pnpm 사용 가능

## 설치

```bash
npm install
```

## 실행

개발 서버 시작:

```bash
npm run dev
```

브라우저에서 다음 주소를 열어주세요:

```text
http://localhost:3000
```

## 빌드

프로덕션 빌드:

```bash
npm run build
```

빌드한 앱 실행:

```bash
npm run start
```

## 검사

타입 검사:

```bash
npm run typecheck
```

ESLint 검사:

```bash
npm run lint
```

## 주요 폴더 구조

- `src/app/` - 라우트 및 페이지
- `src/components/` - UI 컴포넌트
- `src/features/` - 인터뷰, 질문, STT 등의 기능 코드
- `src/lib/` - 공통 유틸
- `prisma/` - Prisma 스키마

## 참고

- Next.js 15 기반
- React 19 사용
- OpenAI, zustand, xlsx 등 라이브러리 포함
