-- ═══════════════════════════════════════════════════════════════════════
--  Proje Hattı · Supabase kurulum betiği
--  Supabase → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run
--  Tekrar çalıştırılabilir (var olanı bozmaz, eksikleri tamamlar).
-- ═══════════════════════════════════════════════════════════════════════

-- ── 0) Yönetici listesi ────────────────────────────────────────────────
-- Buradaki e-postalar davetsiz kayıt olabilir ve proje açabilir.
-- Diğer herkes ancak bir projeye davet edildiyse giriş yapabilir.
create table if not exists public.yoneticiler (
  eposta text primary key
);
insert into public.yoneticiler (eposta) values ('erdalustunol@gmail.com')
  on conflict do nothing;

-- ── 1) Tablolar ───────────────────────────────────────────────────────
create table if not exists public.projeler (
  id          text primary key,
  ad          text not null default 'Proje',
  meta        jsonb not null default '{}'::jsonb,   -- parsiyeller, etiketler, kimden, şablon…
  sahip       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  olusturma   timestamptz not null default now(),
  guncelleme  timestamptz not null default now(),
  guncelleyen uuid default auth.uid()
);

create table if not exists public.uyeler (
  proje_id  text not null references public.projeler(id) on delete cascade,
  kullanici uuid not null references auth.users(id) on delete cascade,
  rol       text not null default 'duzenleyici' check (rol in ('sahip','duzenleyici','izleyici')),
  eposta    text,
  katilma   timestamptz not null default now(),
  primary key (proje_id, kullanici)
);

create table if not exists public.davetler (
  id         uuid primary key default gen_random_uuid(),
  proje_id   text not null references public.projeler(id) on delete cascade,
  eposta     text not null,
  rol        text not null default 'duzenleyici' check (rol in ('duzenleyici','izleyici')),
  davet_eden uuid default auth.uid() references auth.users(id) on delete set null,
  olusturma  timestamptz not null default now(),
  unique (proje_id, eposta)
);

-- İşler, bekleyenler, notlar: her biri ayrı satır (aynı anda düzenlemede çakışma azalır)
create table if not exists public.ogeler (
  proje_id    text not null references public.projeler(id) on delete cascade,
  tur         text not null check (tur in ('is','bekleyen','not')),
  id          text not null,
  veri        jsonb not null,
  guncelleme  timestamptz not null default now(),
  guncelleyen uuid default auth.uid(),
  primary key (proje_id, tur, id)
);

-- Ortak işlem kaydı
create table if not exists public.kayitlar (
  id        bigserial primary key,
  proje_id  text not null references public.projeler(id) on delete cascade,
  kullanici uuid default auth.uid(),
  eposta    text default (auth.jwt() ->> 'email'),
  mesaj     text not null,
  tur       text,
  is_id     text,
  zaman     timestamptz not null default now()
);
create index if not exists kayitlar_proje_zaman on public.kayitlar (proje_id, zaman desc);
create index if not exists uyeler_kullanici on public.uyeler (kullanici);
create index if not exists davetler_eposta on public.davetler (lower(eposta));

-- ── 2) Yardımcı işlevler (RLS içinde döngüye girmesin diye security definer) ──
create or replace function public.benim_epostam() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.uye_mi(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from uyeler where proje_id = p and kullanici = auth.uid())
$$;

create or replace function public.duzenleyebilir_mi(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from uyeler where proje_id = p and kullanici = auth.uid()
                 and rol in ('sahip','duzenleyici'))
$$;

create or replace function public.sahip_mi(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from uyeler where proje_id = p and kullanici = auth.uid() and rol = 'sahip')
$$;

create or replace function public.yonetici_mi() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from yoneticiler where lower(eposta) = public.benim_epostam())
$$;

-- ── 3) Tetikleyiciler ─────────────────────────────────────────────────
-- Proje açılınca açan kişi "sahip" olarak üye olur
create or replace function public.proje_sahibi_ekle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into uyeler (proje_id, kullanici, rol, eposta)
  values (new.id, new.sahip, 'sahip', (select email from auth.users where id = new.sahip))
  on conflict (proje_id, kullanici) do update set rol = 'sahip';
  return new;
end $$;
drop trigger if exists proje_sahibi_ekle on public.projeler;
create trigger proje_sahibi_ekle after insert on public.projeler
  for each row execute function public.proje_sahibi_ekle();

-- Güncellemede zaman ve kişi damgası
create or replace function public.damgala() returns trigger
language plpgsql as $$
begin
  new.guncelleme := now();
  new.guncelleyen := auth.uid();
  return new;
end $$;
drop trigger if exists damgala on public.projeler;
create trigger damgala before update on public.projeler for each row execute function public.damgala();
drop trigger if exists damgala on public.ogeler;
create trigger damgala before update on public.ogeler for each row execute function public.damgala();

-- Kayıt kapısı: yalnızca yöneticiler ve davet edilenler hesap açabilir
-- (Google ile de, e-posta bağlantısıyla da geçerli)
create or replace function public.kayit_kapisi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from yoneticiler where lower(eposta) = lower(new.email))
     or exists (select 1 from davetler where lower(eposta) = lower(new.email)) then
    return new;
  end if;
  raise exception 'Bu e-posta davetli değil: %', new.email;
end $$;
drop trigger if exists proje_hatti_kayit_kapisi on auth.users;
create trigger proje_hatti_kayit_kapisi before insert on auth.users
  for each row execute function public.kayit_kapisi();

-- ── 4) Davetleri kabul et (uygulama girişte çağırır) ──────────────────
create or replace function public.davetleri_kabul_et() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer := 0;
begin
  if auth.uid() is null then return 0; end if;
  with d as (
    delete from davetler where lower(eposta) = public.benim_epostam() returning proje_id, rol
  ), e as (
    insert into uyeler (proje_id, kullanici, rol, eposta)
    select proje_id, auth.uid(), rol, public.benim_epostam() from d
    on conflict (proje_id, kullanici) do nothing
    returning 1
  )
  select count(*) into n from e;
  return n;
end $$;

-- Sahip, projeyi başka bir üyeye devredebilir
create or replace function public.sahipligi_devret(p text, yeni uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.sahip_mi(p) then raise exception 'Yalnızca sahip devredebilir'; end if;
  if not exists (select 1 from uyeler where proje_id = p and kullanici = yeni) then
    raise exception 'Yeni sahip bu projenin üyesi değil';
  end if;
  update uyeler set rol = 'duzenleyici' where proje_id = p and kullanici = auth.uid();
  update uyeler set rol = 'sahip' where proje_id = p and kullanici = yeni;
  update projeler set sahip = yeni where id = p;
end $$;

-- ── 5) Satır düzeyi güvenlik ──────────────────────────────────────────
alter table public.yoneticiler enable row level security;
alter table public.projeler    enable row level security;
alter table public.uyeler      enable row level security;
alter table public.davetler    enable row level security;
alter table public.ogeler      enable row level security;
alter table public.kayitlar    enable row level security;

-- yöneticiler: yalnızca kendi satırını görebilir (uygulama "yönetici miyim" bilsin)
drop policy if exists yon_oku on public.yoneticiler;
create policy yon_oku on public.yoneticiler for select to authenticated
  using (lower(eposta) = public.benim_epostam());

-- projeler
drop policy if exists proje_oku on public.projeler;
create policy proje_oku on public.projeler for select to authenticated
  using (public.uye_mi(id) or sahip = auth.uid());
drop policy if exists proje_ekle on public.projeler;
create policy proje_ekle on public.projeler for insert to authenticated
  with check (sahip = auth.uid());
drop policy if exists proje_guncelle on public.projeler;
create policy proje_guncelle on public.projeler for update to authenticated
  using (public.duzenleyebilir_mi(id)) with check (public.duzenleyebilir_mi(id));
drop policy if exists proje_sil on public.projeler;
create policy proje_sil on public.projeler for delete to authenticated
  using (public.sahip_mi(id));

-- üyeler
drop policy if exists uye_oku on public.uyeler;
create policy uye_oku on public.uyeler for select to authenticated
  using (public.uye_mi(proje_id));
drop policy if exists uye_guncelle on public.uyeler;
create policy uye_guncelle on public.uyeler for update to authenticated
  using (public.sahip_mi(proje_id) and kullanici <> auth.uid())
  with check (public.sahip_mi(proje_id) and rol <> 'sahip');
drop policy if exists uye_sil on public.uyeler;
create policy uye_sil on public.uyeler for delete to authenticated
  using ((public.sahip_mi(proje_id) and kullanici <> auth.uid())   -- sahip birini çıkarır
         or (kullanici = auth.uid() and rol <> 'sahip'));           -- üye kendisi ayrılır

-- davetler
drop policy if exists davet_oku on public.davetler;
create policy davet_oku on public.davetler for select to authenticated
  using (public.sahip_mi(proje_id) or lower(eposta) = public.benim_epostam());
drop policy if exists davet_ekle on public.davetler;
create policy davet_ekle on public.davetler for insert to authenticated
  with check (public.sahip_mi(proje_id));
drop policy if exists davet_guncelle on public.davetler;
create policy davet_guncelle on public.davetler for update to authenticated
  using (public.sahip_mi(proje_id)) with check (public.sahip_mi(proje_id));
drop policy if exists davet_sil on public.davetler;
create policy davet_sil on public.davetler for delete to authenticated
  using (public.sahip_mi(proje_id) or lower(eposta) = public.benim_epostam());

-- öğeler (işler / bekleyenler / notlar)
drop policy if exists oge_oku on public.ogeler;
create policy oge_oku on public.ogeler for select to authenticated
  using (public.uye_mi(proje_id));
drop policy if exists oge_ekle on public.ogeler;
create policy oge_ekle on public.ogeler for insert to authenticated
  with check (public.duzenleyebilir_mi(proje_id));
drop policy if exists oge_guncelle on public.ogeler;
create policy oge_guncelle on public.ogeler for update to authenticated
  using (public.duzenleyebilir_mi(proje_id)) with check (public.duzenleyebilir_mi(proje_id));
drop policy if exists oge_sil on public.ogeler;
create policy oge_sil on public.ogeler for delete to authenticated
  using (public.duzenleyebilir_mi(proje_id));

-- kayıtlar
drop policy if exists kayit_oku on public.kayitlar;
create policy kayit_oku on public.kayitlar for select to authenticated
  using (public.uye_mi(proje_id));
drop policy if exists kayit_ekle on public.kayitlar;
create policy kayit_ekle on public.kayitlar for insert to authenticated
  with check (public.duzenleyebilir_mi(proje_id) and kullanici = auth.uid());
drop policy if exists kayit_sil on public.kayitlar;
create policy kayit_sil on public.kayitlar for delete to authenticated
  using (public.sahip_mi(proje_id));

-- ── 6) Yetkiler (otomatik API açma kapalı olduğu için elle) ────────────
revoke all on public.yoneticiler, public.projeler, public.uyeler, public.davetler,
              public.ogeler, public.kayitlar from anon;
grant select on public.yoneticiler to authenticated;
grant select, insert, update, delete on public.projeler, public.uyeler, public.davetler,
      public.ogeler, public.kayitlar to authenticated;
grant usage, select on sequence public.kayitlar_id_seq to authenticated;

revoke execute on function public.davetleri_kabul_et(), public.sahipligi_devret(text, uuid),
       public.uye_mi(text), public.duzenleyebilir_mi(text), public.sahip_mi(text),
       public.yonetici_mi(), public.benim_epostam() from public, anon;
grant execute on function public.davetleri_kabul_et(), public.sahipligi_devret(text, uuid),
       public.uye_mi(text), public.duzenleyebilir_mi(text), public.sahip_mi(text),
       public.yonetici_mi(), public.benim_epostam() to authenticated;
revoke execute on function public.kayit_kapisi(), public.proje_sahibi_ekle() from public, anon, authenticated;

-- ── 7) Canlı güncelleme (Realtime) ───────────────────────────────────
alter table public.ogeler replica identity full;   -- silinen satırın proje bilgisi de gelsin
do $$
declare t text;
begin
  foreach t in array array['projeler','ogeler','kayitlar','uyeler'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Bitti. Sonuç: "Success. No rows returned" görmelisin.
