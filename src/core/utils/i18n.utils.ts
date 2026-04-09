import { arSA, enUS, id as idLocale, ja } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import * as Localization from 'expo-localization';
import type { TFunction } from 'i18next';

import type { VehicleType } from '@domain/types/vehicle.types';

export const SUPPORTED_LANGUAGES = ['id', 'en', 'ja', 'ar'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const SERVICE_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  'Ganti Oli': 'vehicle.serviceTypes.oilChange',
  'Servis Rutin': 'vehicle.serviceTypes.routineService',
  'Ganti Ban': 'vehicle.serviceTypes.tireReplacement',
  'Tune Up': 'vehicle.serviceTypes.tuneUp',
  'Lainnya': 'vehicle.serviceTypes.other',
};

const INTL_LOCALE_MAP: Record<AppLanguage, string> = {
  ar: 'ar-SA',
  en: 'en-US',
  id: 'id-ID',
  ja: 'ja-JP',
};

const DATE_FNS_LOCALE_MAP: Record<AppLanguage, Locale> = {
  ar: arSA,
  en: enUS,
  id: idLocale,
  ja,
};

export function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes((value ?? '') as AppLanguage);
}

export function getPreferredLanguage(): AppLanguage {
  const firstLocale = Localization.getLocales()[0];
  const candidate =
    firstLocale?.languageCode ??
    firstLocale?.languageTag?.split('-')[0] ??
    'id';

  return isSupportedLanguage(candidate) ? candidate : 'id';
}

export function getIntlLocale(language: AppLanguage): string {
  return INTL_LOCALE_MAP[language];
}

export function getDateFnsLocale(language: AppLanguage): Locale {
  return DATE_FNS_LOCALE_MAP[language];
}

export function isRtlLanguage(language: AppLanguage): boolean {
  return language === 'ar';
}

export function translateVehicleType(t: TFunction, vehicleType: VehicleType): string {
  return t(`vehicle.types.${vehicleType}`);
}

export function translateServiceType(t: TFunction, serviceType: string): string {
  const key = SERVICE_TYPE_TRANSLATION_KEYS[serviceType];
  return key ? t(key) : serviceType;
}
