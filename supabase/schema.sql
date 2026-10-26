-- Supabase SQL Editor에서 한 번 실행합니다.

create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  name text not null,
  category text not null check (category in ('food', 'cafe', 'activity', 'stay', 'etc')),
  lat double precision not null,
  lng double precision not null,
  address text,
  phone text,
  kakao_place_id text,
  place_url text,
  memo text,
  created_at timestamptz not null default now()
);

create index places_trip_id_idx on places (trip_id);

-- 동행자 좋아요 투표 (로그인 없이 이름으로 구분)
create table likes (
  place_id uuid not null references places(id) on delete cascade,
  voter text not null,
  created_at timestamptz not null default now(),
  primary key (place_id, voter)
);

-- 신규 Supabase 프로젝트는 public 테이블이 Data API에 자동 노출되지 않으므로 명시적으로 GRANT 합니다.
grant select, insert, update, delete on trips, places to anon;
grant select, insert, delete on likes to anon;

-- 로그인 없이 비공개 링크로 쓰는 앱: anon에게 전체 권한.
-- 나중에 로그인을 붙이면 `to anon`을 `to authenticated`로 바꾸세요.
alter table trips enable row level security;
alter table places enable row level security;
alter table likes enable row level security;
create policy "anon all" on trips for all to anon using (true) with check (true);
create policy "anon all" on places for all to anon using (true) with check (true);
create policy "anon all" on likes for all to anon using (true) with check (true);
