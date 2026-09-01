-- 카드 일괄 등록 트랜잭션
--
-- 순차 insert 로 처리하면 중간에 실패했을 때 앞부분만 등록되고 도감번호에 구멍이 생긴다.
-- 함수 하나가 곧 한 트랜잭션이므로, 전부 성공하거나 전부 롤백된다.
--
-- 도감번호는 등급별로 현재 개수 + 1 부터 순서대로 부여한다.
-- 같은 트랜잭션 안에서 세므로 등급이 섞여 들어와도 정확하다.

create or replace function public.create_cards_bulk(items jsonb)
returns table (id uuid, dex_no text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  item_grade public.card_grade;
  next_seq int;
  new_dex_no text;
  new_id uuid;
  prefix text;
begin
  if not public.is_admin() then
    raise exception '운영자만 카드를 등록할 수 있습니다';
  end if;

  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception '등록할 카드가 없습니다';
  end if;

  -- 등급별 도감번호를 이 트랜잭션 안에서 직렬화한다.
  -- cards 를 잠그면 동시 등록이 대기하므로 번호 충돌이 나지 않는다.
  lock table public.cards in exclusive mode;

  for item in select * from jsonb_array_elements(items)
  loop
    item_grade := (item ->> 'grade')::public.card_grade;

    prefix := case item_grade
      when 'normal' then 'N'
      when 'rare' then 'R'
      when 'epic' then 'E'
      when 'legend' then 'L'
      when 'mythic' then 'M'
    end;

    select count(*) + 1 into next_seq
    from public.cards
    where grade = item_grade;

    new_dex_no := prefix || lpad(next_seq::text, 2, '0');

    insert into public.cards (dex_no, name, grade, type, image_url, draw_weight, is_season)
    values (
      new_dex_no,
      item ->> 'name',
      item_grade,
      (item ->> 'type')::public.card_type,
      nullif(item ->> 'imageUrl', ''),
      coalesce((item ->> 'drawWeight')::int, 1),
      coalesce((item ->> 'isSeason')::boolean, false)
    )
    returning cards.id into new_id;

    return query select new_id, new_dex_no;
  end loop;
end;
$$;

comment on function public.create_cards_bulk(jsonb) is
  '카드 일괄 등록 트랜잭션. 전부 성공하거나 전부 롤백된다. 도감번호는 등급별로 순서대로 부여하며 cards 를 잠가 동시 등록 충돌을 막는다.';

revoke all on function public.create_cards_bulk(jsonb) from public;
grant execute on function public.create_cards_bulk(jsonb) to authenticated;
grant execute on function public.create_cards_bulk(jsonb) to service_role;
