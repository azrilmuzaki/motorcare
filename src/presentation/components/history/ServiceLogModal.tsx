import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@core/theme/typography';
import { toReadableDate } from '@core/utils/date.utils';
import { getIntlLocale } from '@core/utils/i18n.utils';
import type { ServiceLog } from '@domain/types/serviceLog.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { useTheme } from '@presentation/hooks/useTheme';

interface ServiceLogModalProps {
  visible: boolean;
  serviceLog: ServiceLog | null;
  onClose: () => void;
}

export function ServiceLogModal({
  visible,
  serviceLog,
  onClose,
}: ServiceLogModalProps) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id';
  const locale = getIntlLocale(language);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <AppCard style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="titleLarge" style={[styles.title, { color: colors.onSurface }]}>
            {t('serviceLogModal.title')}
          </Text>

          {serviceLog ? (
            <View style={styles.content}>
              <Text style={[styles.item, { color: colors.onSurfaceVariant }]}>
                {t('serviceLogModal.date')}: {toReadableDate(serviceLog.serviceDate, locale)}
              </Text>
              <Text style={[styles.item, { color: colors.onSurfaceVariant }]}>
                {t('serviceLogModal.kilometer')}: {serviceLog.serviceKm.toLocaleString(locale)} km
              </Text>
              {serviceLog.notes ? (
                <Text style={[styles.notes, { color: colors.onSurface }]}>{serviceLog.notes}</Text>
              ) : (
                <Text style={[styles.item, { color: colors.onSurfaceVariant }]}>
                  {t('serviceLogModal.notes')}: {t('serviceLogModal.noNotes')}
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.item, { color: colors.onSurfaceVariant }]}>
              {t('serviceLogModal.empty')}
            </Text>
          )}

          <AppButton label={t('common.close')} onPress={onClose} variant="outlined" />
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    padding: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    gap: Spacing.sm,
  },
  item: {
    fontFamily: 'Poppins_400Regular',
  },
  notes: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
});
