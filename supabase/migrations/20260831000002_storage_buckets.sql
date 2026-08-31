-- Storage 버킷 — 어드민 기획서 5장 "이미지 업로드 버킷 권한 설정"
--
-- 두 버킷 모두 public read 다. 카드 이미지와 구단 로고는 앱에서 그대로 보여주는 것이고
-- 숨길 내용이 없다. public 이면 CDN 캐시를 타서 서명 URL 발급 비용도 없다.
-- 업로드/삭제는 운영자만.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- 카드 통이미지. 어드민 폼이 5MB 로 제한하므로 서버 쪽도 같은 값으로 맞춘다
  ('cards', 'cards', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  -- 구단 로고. 어드민 폼이 1MB 제한. svg 는 스크립트 삽입 위험이 있어 제외한다
  ('team-logos', 'team-logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 읽기: 누구나(로그인 전 포함). public 버킷이라 CDN 으로도 나간다
create policy "cards_public_read" on storage.objects
  for select using (bucket_id = 'cards');

create policy "team_logos_public_read" on storage.objects
  for select using (bucket_id = 'team-logos');

-- 쓰기/삭제: 운영자만
create policy "cards_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'cards' and public.is_admin())
  with check (bucket_id = 'cards' and public.is_admin());

create policy "team_logos_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'team-logos' and public.is_admin())
  with check (bucket_id = 'team-logos' and public.is_admin());
