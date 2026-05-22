alter table public.vehicles
add column if not exists service_start_km integer,
add column if not exists last_odometer_update_at timestamptz;

update public.vehicles
set
  service_start_km = coalesce(service_start_km, current_km),
  last_odometer_update_at = coalesce(last_odometer_update_at, updated_at, created_at, now());

alter table public.vehicles
alter column service_start_km set not null;

alter table public.vehicles
alter column last_odometer_update_at set not null;

comment on column public.vehicles.service_start_km is
'KM odometer saat siklus servis aktif dimulai. Dipakai sebagai acuan sisa interval servis berikutnya.';

comment on column public.vehicles.last_odometer_update_at is
'Waktu terakhir km odometer diperbarui secara manual. Dipakai untuk memproyeksikan km berjalan harian.';
