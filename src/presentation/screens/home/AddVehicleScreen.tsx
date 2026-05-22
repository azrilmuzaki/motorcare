import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  HelperText,
  Menu,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_DAILY_EST,
  DEFAULT_TARGET_INTERVAL,
  SERVICE_TYPE_OPTIONS,
} from '@core/constants/app.constants';
import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import { translateServiceType, translateVehicleType } from '@core/utils/i18n.utils';
import { CreateVehicleInput, VehicleType } from '@domain/types/vehicle.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { AppInput } from '@presentation/components/common/AppInput';
import { useTheme } from '@presentation/hooks/useTheme';
import { AddVehicleScreenProps } from '@presentation/navigation/types';
import { useAuthStore } from '@presentation/store/auth.store';
import { useVehicleStore } from '@presentation/store/vehicle.store';

type FormData = CreateVehicleInput;
type ServiceTypeOption = (typeof SERVICE_TYPE_OPTIONS)[number];

export function AddVehicleScreen({ navigation }: AddVehicleScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { addVehicle, isLoading, error, clearError } = useVehicleStore();
  const { user } = useAuthStore();
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceTypeOption | ''>('');
  const [customServiceType, setCustomServiceType] = useState('');
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);
  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().min(2).max(50).required(t('addVehicle.validation.nameRequired')),
        type: yup
          .mixed<VehicleType>()
          .oneOf(['car', 'motorcycle', 'truck'])
          .required(t('addVehicle.validation.typeRequired')),
        serviceType: yup
          .string()
          .trim()
          .required(t('addVehicle.validation.serviceTypeRequired')),
        currentKm: yup
          .number()
          .min(0)
          .required(t('addVehicle.validation.currentKmRequired'))
          .typeError(t('addVehicle.validation.number')),
        targetInterval: yup
          .number()
          .min(500)
          .required(t('addVehicle.validation.targetIntervalRequired'))
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
    setValue,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      type: 'car',
      serviceType: '',
      currentKm: 0,
      targetInterval: DEFAULT_TARGET_INTERVAL,
      dailyEst: DEFAULT_DAILY_EST,
    },
  });

  const dailyEst = watch('dailyEst');
  const targetInterval = watch('targetInterval');

  const handleSelectServiceType = useCallback((option: ServiceTypeOption) => {
    setSelectedServiceType(option);
    setServiceTypeMenuVisible(false);

    if (option === 'Lainnya') {
      setValue('serviceType', customServiceType.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setCustomServiceType('');
    setValue('serviceType', option, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [customServiceType, setValue]);

  const handleCustomServiceTypeChange = useCallback((text: string) => {
    setCustomServiceType(text);
    setValue('serviceType', text.trim(), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [setValue]);

  const selectedServiceTypeLabel =
    selectedServiceType === 'Lainnya'
      ? customServiceType || t('vehicle.serviceTypes.other')
      : selectedServiceType
        ? translateServiceType(t, selectedServiceType)
        : '';

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!user?.id) {
        return;
      }

      try {
        await addVehicle(user.id, data as CreateVehicleInput);
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
          name="serviceType"
          render={({ field: { onBlur } }) => (
            <View style={styles.fieldGroup}>
              <Menu
                visible={serviceTypeMenuVisible}
                onDismiss={() => setServiceTypeMenuVisible(false)}
                anchor={
                  <Pressable onPress={() => setServiceTypeMenuVisible(true)}>
                    <View pointerEvents="none">
                      <TextInput
                        textColor={colors.onSurface}
                        placeholderTextColor={colors.onSurfaceVariant}
                        label={t('addVehicle.fields.serviceTypeLabel')}
                        value={selectedServiceTypeLabel}
                        placeholder={t('addVehicle.fields.serviceTypePlaceholder')}
                        mode="outlined"
                        editable={false}
                        error={Boolean(errors.serviceType)}
                        cursorColor={Colors.primary}
                        selectionColor={Colors.primary}
                        activeOutlineColor={Colors.primary}
                        outlineColor={colors.outline}
                        style={[
                          styles.dropdownInput,
                          {
                            backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                          },
                        ]}
                        outlineStyle={styles.dropdownOutline}
                        contentStyle={styles.dropdownContent}
                        left={<TextInput.Icon icon="wrench-outline" />}
                        right={
                          <TextInput.Icon
                            icon={serviceTypeMenuVisible ? 'menu-up' : 'menu-down'}
                          />
                        }
                      />
                    </View>
                  </Pressable>
                }
                contentStyle={[
                  styles.menuContent,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
                  },
                ]}
              >
                {SERVICE_TYPE_OPTIONS.map(option => (
                  <Menu.Item
                    key={option}
                    title={translateServiceType(t, option)}
                    onPress={() => handleSelectServiceType(option)}
                    leadingIcon={selectedServiceType === option ? 'check' : 'wrench-outline'}
                    titleStyle={styles.menuItemTitle}
                  />
                ))}
              </Menu>

              {selectedServiceType === 'Lainnya' ? (
                <AppInput
                  label={t('addVehicle.fields.customServiceTypeLabel')}
                  value={customServiceType}
                  onChangeText={handleCustomServiceTypeChange}
                  onBlur={onBlur}
                  error={errors.serviceType?.message}
                  placeholder={t('addVehicle.fields.customServiceTypePlaceholder')}
                  left={<TextInput.Icon icon="pencil-outline" />}
                />
              ) : null}

              {errors.serviceType && selectedServiceType !== 'Lainnya' ? (
                <HelperText type="error" visible>
                  {errors.serviceType.message}
                </HelperText>
              ) : null}
            </View>
          )}
        />

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
          name="targetInterval"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label={t('addVehicle.fields.targetIntervalLabel')}
              value={String(value)}
              onChangeText={text => onChange(Number(text) || 0)}
              onBlur={onBlur}
              error={errors.targetInterval?.message}
              keyboardType="numeric"
              placeholder={t('addVehicle.fields.targetIntervalPlaceholder')}
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

        {dailyEst > 0 && targetInterval > 0 ? (
          <View
            style={[
              styles.preview,
              {
                backgroundColor: isDark ? colors.surfaceElevated : Colors.primaryLight,
              },
            ]}
          >
            <Text
              variant="bodySmall"
              style={[
                styles.previewText,
                { color: isDark ? colors.onSurfaceVariant : Colors.primaryDark },
              ]}
            >
              {t('addVehicle.preview', { count: Math.ceil(targetInterval / dailyEst) })}
            </Text>
          </View>
        ) : null}

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
  dropdownInput: {},
  dropdownOutline: {
    borderRadius: 12,
  },
  dropdownContent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  menuContent: {
    borderRadius: 16,
  },
  menuItemTitle: {
    fontFamily: 'Poppins_500Medium',
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
  preview: {
    borderRadius: 12,
    padding: Spacing.md,
  },
  previewText: {
    fontFamily: 'Poppins_400Regular',
  },
  previewHighlight: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
  },
  buttonGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
