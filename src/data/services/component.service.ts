import { supabase } from '@data/supabase/client';
import type { VehicleComponent, CreateComponentInput, UpdateComponentInput } from '@domain/types/vehicle.types';

export const ComponentService = {
  /**
   * Fetch all components for a specific vehicle
   */
  async getComponentsByVehicleId(vehicleId: string): Promise<VehicleComponent[]> {
    const { data, error } = await supabase
      .from('vehicle_components')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch components: ${error.message}`);
    }

    // Convert snake_case to camelCase
    return (data || []).map(item => ({
      id: item.id,
      vehicleId: item.vehicle_id,
      name: item.name,
      icon: item.icon,
      targetInterval: item.target_interval,
      lastServiceKm: item.last_service_km,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  /**
   * Add a new component
   */
  async addComponent(input: CreateComponentInput): Promise<VehicleComponent> {
    const { data, error } = await supabase
      .from('vehicle_components')
      .insert([
        {
          vehicle_id: input.vehicleId,
          name: input.name,
          icon: input.icon,
          target_interval: input.targetInterval,
          last_service_km: input.lastServiceKm,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add component: ${error.message}`);
    }

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      name: data.name,
      icon: data.icon,
      targetInterval: data.target_interval,
      lastServiceKm: data.last_service_km,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Update a component (e.g., mark as serviced by updating lastServiceKm)
   */
  async updateComponent(id: string, input: UpdateComponentInput): Promise<VehicleComponent> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.targetInterval !== undefined) updateData.target_interval = input.targetInterval;
    if (input.lastServiceKm !== undefined) updateData.last_service_km = input.lastServiceKm;

    const { data, error } = await supabase
      .from('vehicle_components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update component: ${error.message}`);
    }

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      name: data.name,
      icon: data.icon,
      targetInterval: data.target_interval,
      lastServiceKm: data.last_service_km,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Delete a component
   */
  async deleteComponent(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_components')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete component: ${error.message}`);
    }
  },
};
