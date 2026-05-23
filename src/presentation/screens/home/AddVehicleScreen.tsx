import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  SegmentedButtons,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_DAILY_EST,
  DEFAULT_TARGET_INTERVAL,
} from '@core/constants/app.constants';
import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import { translateVehicleType } from '@core/utils/i18n.utils';
import { CreateVehicleInput, VehicleType } from '@domain/types/vehicle.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { AppInput } from '@presentation/components/common/AppInput';
import { useTheme } from '@presentation/hooks/useTheme';
import { AddVehicleScreenProps } from '@presentation/navigation/types';
import { useAuthStore } from '@presentation/store/auth.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

// We omit the legacy fields from our local form data so user doesn't see them
type FormData = Omit<CreateVehicleInput, 'serviceType' | 'targetInterval'>;

export function AddVehicleScreen({ navigation }: AddVehicleScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { addVehicle, isLoading, error, clearError } = useVehicleStore();
  const { user } = useAuthStore();
  
  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().min(2).max(50).required(t('addVehicle.validation.nameRequired')),
        type: yup
          .mixed<VehicleType>()
          .oneOf(['car', 'motorcycle', 'truck'])
          .required(t('addVehicle.validation.typeRequired')),
        currentKm: yup
          .number()
          .min(0)
          .required(t('addVehicle.validation.currentKmRequired'))
          .typeError(t('addVehicle.validation.number')),
        dailyEst: yup
          .number()
          .min(1)
          .required(t('addVehicle.validation.dailyEstRequired'))
          .typeError(t('addVehicle.validation.number')),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: 'car',
      currentKm: 0,
      dailyEst: DEFAULT_DAILY_EST,
    },
  });

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user?.id) {
        return;
      }

      try {
        // Inject legacy dummy values to satisfy the schema/database
        const payload: CreateVehicleInput = {
          ...data,
          serviceType: 'routine',
          targetInterval: DEFAULT_TARGET_INTERVAL,
        };

        await addVehicle(user.id, payload);
        navigation.goBack();
      } catch {
        // Error handled in store
      }
    },
    [user?.id, addVehicle, navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >
        <AppCard
          style={[
            styles.introCard,
            { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
          ]}
        >
          <Text variant="titleLarge" style={[styles.introTitle, { color: colors.onBackground }]}>
            {t('addVehicle.introTitle')}
          </Text>
          <Text variant="bodyMedium" style={[styles.introText, { color: colors.onSurfaceVariant }]}>
            {t('addVehicle.introSubtitle')}
          </Text>
        </AppCard>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
              label={t('addVehicle.fields.nameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              placeholder={t('addVehicle.fields.namePlaceholder')}
            />
          )}
        />

        <View style={styles.fieldGroup}>
          <Text variant="labelLarge" style={styles.fieldLabel}>
            {t('addVehicle.fields.typeLabel')}
          </Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'car', label: translateVehicleType(t, 'car'), icon: 'car' },
                  { value: 'motorcycle', label: translateVehicleType(t, 'motorcycle'), icon: 'motorbike' },
                  { value: 'truck', label: translateVehicleType(t, 'truck'), icon: 'truck' },
                ]}
              />
            )}
          />
          {errors.type ? (
            <Text style={styles.errorText}>{errors.type.message}</Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="currentKm"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label={t('addVehicle.fields.currentKmLabel')}
              value={String(value)}
              onChangeText={text => onChange(Number(text) || 0)}
              onBlur={onBlur}
              error={errors.currentKm?.message}
              keyboardType="numeric"
              placeholder={t('addVehicle.fields.currentKmPlaceholder')}
            />
          )}
        />

        <Controller
          control={control}
          name="dailyEst"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label={t('addVehicle.fields.dailyEstLabel')}
              value={String(value)}
              onChangeText={text => onChange(Number(text) || 0)}
              onBlur={onBlur}
              error={errors.dailyEst?.message}
              keyboardType="numeric"
              placeholder={t('addVehicle.fields.dailyEstPlaceholder')}
            />
          )}
        />

        <View style={styles.buttonGroup}>
          <AppButton
            label={t('addVehicle.save')}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            icon="content-save"
          />
          <AppButton
            label={t('addVehicle.cancel')}
            onPress={() => navigation.goBack()}
            variant="outlined"
          />
        </View>
      </KeyboardAwareScrollView>

      <Snackbar visible={Boolean(error)} onDismiss={clearError} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  introCard: {
    paddingTop: Spacing.xl,
  },
  introTitle: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  introText: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: 'Poppins_500Medium',
    opacity: 0.7,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  buttonGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
