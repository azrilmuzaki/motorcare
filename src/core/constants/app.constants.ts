import type { ComponentProps } from 'react';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export const APP_NAME = 'MotorCare';
export const APP_VERSION = '1.0.0';

export const VEHICLE_TYPES = {
  CAR: 'car',
  MOTORCYCLE: 'motorcycle',
  TRUCK: 'truck',
} as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: 'Mobil',
  motorcycle: 'Motor',
  truck: 'Truk',
};

export const VEHICLE_TYPE_ICONS: Record<
  string,
  ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  car: 'car',
  motorcycle: 'motorbike',
  truck: 'truck',
};

export const DEFAULT_DAILY_EST = 20; // km per day
export const DEFAULT_TARGET_INTERVAL = 5000; // km
export const SERVICE_TYPE_OPTIONS = [
  'Ganti Oli',
  'Servis Rutin',
  'Ganti Ban',
  'Tune Up',
  'Lainnya',
] as const;

// Thresholds for status colors
export const SERVICE_THRESHOLD = {
  URGENT: 500,   // < 500 km -> red
  WARNING: 1500, // < 1500 km -> orange
};
