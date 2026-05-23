import { supabase } from '@data/supabase/client';
import {
  ServiceLog,
  CreateServiceLogInput,
} from '@domain/types/serviceLog.types';

function mapRowToServiceLog(row: Record<string, unknown>): ServiceLog {
  let joinedVehicle: Record<string, unknown> | null = null;
  if (row.vehicles) {
    if (Array.isArray(row.vehicles)) {
      joinedVehicle = (row.vehicles[0] as Record<string, unknown> | null) ?? null;
    } else {
      joinedVehicle = row.vehicles as Record<string, unknown>;
    }
  }

  return {
    id: row.id as string,
    vehicleId: row.vehicle_id as string,
    serviceDate: row.service_date as string,
    serviceKm: row.service_km as number,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    vehicleName: (joinedVehicle?.name as string | undefined) ?? 'Kendaraan',
    serviceType: (joinedVehicle?.service_type as string | undefined) ?? 'Servis Rutin',
    vehicleType: (joinedVehicle?.type as string | undefined) ?? 'car',
  };
}

export const ServiceLogService = {
  /**
   * Ambil semua riwayat servis milik user (join vehicle name)
   */
  async getServiceLogs(userId: string): Promise<ServiceLog[]> {
    const { data, error } = await supabase
      .from('service_logs')
      .select(`
        *,
        vehicles!inner(name, user_id, service_type, type)
      `)
      .eq('vehicles.user_id', userId)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToServiceLog);
  },

  /**
   * Ambil riwayat servis per kendaraan
   */
  async getServiceLogsByVehicle(vehicleId: string): Promise<ServiceLog[]> {
    const { data, error } = await supabase
      .from('service_logs')
      .select('*, vehicles(name, service_type, type)')
      .eq('vehicle_id', vehicleId)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToServiceLog);
  },

  /**
   * Tambah riwayat servis baru
   */
  async createServiceLog(input: CreateServiceLogInput): Promise<ServiceLog> {
    const { data, error } = await supabase
      .from('service_logs')
      .insert({
        vehicle_id: input.vehicleId,
        service_date: input.serviceDate,
        service_km: input.serviceKm,
        notes: input.notes ?? null,
      })
      .select('*, vehicles(name, service_type, type)')
      .single();

    if (error) throw new Error(error.message);
    return mapRowToServiceLog(data);
  },

  /**
   * Hapus riwayat servis
   */
  async deleteServiceLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_logs')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
