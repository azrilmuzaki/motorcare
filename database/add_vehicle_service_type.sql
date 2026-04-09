alter table public.vehicles
add column if not exists service_type text;

update public.vehicles
set service_type = coalesce(nullif(trim(service_type), ''), 'Servis Rutin');

alter table public.vehicles
alter column service_type set not null;

comment on column public.vehicles.service_type is
'Jenis servis utama yang ingin diingatkan untuk kendaraan ini, misalnya ganti oli atau servis rutin.';
