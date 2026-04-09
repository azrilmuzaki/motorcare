alter table public.vehicles
add column if not exists is_active boolean default true;

update public.vehicles
set is_active = coalesce(is_active, true);

alter table public.vehicles
alter column is_active set not null;

comment on column public.vehicles.is_active is
'Menandakan apakah reminder kendaraan masih aktif di daftar utama atau sudah dipindahkan ke riwayat servis.';
