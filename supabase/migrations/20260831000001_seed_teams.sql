-- KBO 10개 구단 seed.
-- 구단은 고정이라 어드민에 생성/삭제가 없다(수정만). 그래서 마이그레이션에 넣는다.
-- 로고는 어드민 '구단 관리'에서 업로드하므로 null 로 시작한다(화면에서 팀 컬러 원형으로 대체 표시).
--
-- 값의 출처: apps/admin/src/lib/repositories/fixtures/teams.ts
-- 재실행 가능하도록 name 충돌 시 갱신한다.

insert into public.teams (name, short_name, logo_url, color) values
  ('KIA 타이거즈',  'KIA',  null, '#EA0029'),
  ('삼성 라이온즈', '삼성', null, '#074CA1'),
  ('LG 트윈스',     'LG',   null, '#C30452'),
  ('두산 베어스',   '두산', null, '#131230'),
  ('KT 위즈',       'KT',   null, '#000000'),
  ('SSG 랜더스',    'SSG',  null, '#CE0E2D'),
  ('롯데 자이언츠', '롯데', null, '#041E42'),
  ('한화 이글스',   '한화', null, '#FF6600'),
  ('NC 다이노스',   'NC',   null, '#315288'),
  ('키움 히어로즈', '키움', null, '#570514')
on conflict (name) do update
  set short_name = excluded.short_name,
      color = excluded.color;
