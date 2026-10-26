# 테모바 여행 지도

여행지별 맛집·카페·즐길거리를 카카오 지도에 표시하는 개인용 웹앱입니다. Vite, React, Supabase로 만들었습니다.

## 시작하기

1. **카카오**: [Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 카카오맵 API를 활성화합니다.
   - 무료 쿼터는 계정에서 **처음 활성화한 앱**에만 주어집니다. 앱 정보에 '카카오맵 무료 쿼터' 뱃지가 있는지 확인하세요.
   - JavaScript 키의 'JavaScript SDK 도메인'에 `http://localhost:5173`과 배포 도메인을 등록합니다.
2. **Supabase**: 프로젝트를 만들고(리전: Seoul) SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. `.env.example`을 `.env.local`로 복사하고 키를 채웁니다.
4. `npm install` → `npm run dev`

## 참고

- 로그인 없이 쓰는 앱입니다. 배포 URL을 아는 사람은 누구나 수정할 수 있으니 링크는 비공개로 공유하세요.
- Supabase 무료 플랜은 7일 동안 활동이 없으면 일시정지됩니다. 대시보드에서 복구하면 데이터는 그대로입니다.
- 배포(Vercel, Cloudflare Pages)할 때 위 세 환경변수를 설정합니다.
