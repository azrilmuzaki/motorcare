import { supabase } from '@data/supabase/client';
import {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
} from '@domain/types/vehicle.types';

function getVehicleErrorMessage(message: string): string {
  if (
    message.includes("Could not find the 'service_start_km' column of 'vehicles'") ||
    message.includes('service_start_km')
  ) {
    return 'Kolom acuan KM servis belum ada. Jalankan SQL di database/add_vehicle_service_cycle_columns.sql pada Supabase, lalu coba lagi.';
  }

  if (
    message.includes("Could not find the 'last_odometer_update_at' column of 'vehicles'") ||
    message.includes('last_odometer_update_at')
  ) {
    return 'Kolom waktu update odometer belum ada. Jalankan SQL di database/add_vehicle_service_cycle_columns.sql pada Supabase, lalu coba lagi.';
  }

  if (
    message.includes("Could not find the 'service_type' column of 'vehicles'") ||
    message.includes('service_type')
  ) {
    return 'Kolom database untuk jenis servis belum ada. Jalankan SQL di database/add_vehicle_service_type.sql pada Supabase, lalu coba simpan lagi.';
  }

  if (
    message.includes("Could not find the 'is_active' column of 'vehicles'") ||
    message.includes('is_active')
  ) {
    return 'Kolom status aktif kendaraan belum ada. Jalankan SQL di database/add_vehicle_is_active.sql pada Supabase, lalu coba lagi.';
  }

  return message;
}

/**
 * Map snake_case DB row → camelCase Vehicle type
 */
function mapRowToVehicle(row: Record<string, unknown>): Vehicle {
  const rawServiceType = row.service_type;
  const rawCurrentKm = row.current_km as number;
  const referenceDate =
    typeof row.last_odometer_update_at === 'string'
      ? row.last_odometer_update_at
      : (row.updated_at as string | undefined) ?? (row.created_at as string);

  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Vehicle['type'],
    serviceType:
      typeof rawServiceType === 'string' && rawServiceType.trim().length > 0
        ? rawServiceType
        : 'Servis Rutin',
    isActive: typeof row.is_active === 'boolean' ? (row.is_active as boolean) : true,
    currentKm: rawCurrentKm,
    serviceStartKm:
      typeof row.service_start_km === 'number' ? (row.service_start_km as number) : rawCurrentKm,
    targetInterval: row.target_interval as number,
    dailyEst: row.daily_est as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastOdometerUpdateAt: referenceDate,
  };
}

export const VehicleService = {
  /**
   * Ambil semua kendaraan milik user
   */
  async getVehicles(userId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .or('is_active.is.null,is_active.eq.true')
      .order('created_at', { ascending: false });

    if (error) throw new Error(getVehicleErrorMessage(error.message));
    return (data ?? []).map(mapRowToVehicle);
  },

  /**
   * Ambil satu kendaraan by ID
   */
  async getVehicleById(id: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(getVehicleErrorMessage(error.message));
    return mapRowToVehicle(data);
  },

  /**
   * Buat kendaraan baru
   */
  async createVehicle(
    userId: string,
    input: CreateVehicleInput
  ): Promise<Vehicle> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        service_type: input.serviceType.trim(),
        is_active: true,
        current_km: input.currentKm,
        service_start_km: input.currentKm,
        target_interval: input.targetInterval,
        daily_est: input.dailyEst,
        last_odometer_update_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(getVehicleErrorMessage(error.message));
    return mapRowToVehicle(data);
  },

  /**
   * Update kendaraan
   */
  async updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.serviceType !== undefined) updateData.service_type = input.serviceType.trim();
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.currentKm !== undefined) {
      updateData.current_km = input.currentKm;
      updateData.last_odometer_update_at =
        input.lastOdometerUpdateAt ?? new Date().toISOString();
    }
    if (input.serviceStartKm !== undefined) updateData.service_start_km = input.serviceStartKm;
    if (input.targetInterval !== undefined) updateData.target_interval = input.targetInterval;
    if (input.dailyEst !== undefined) updateData.daily_est = input.dailyEst;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(getVehicleErrorMessage(error.message));
    return mapRowToVehicle(data);
  },

  /**
   * Hapus kendaraan
   */
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw new Error(getVehicleErrorMessage(error.message));
  },
};
