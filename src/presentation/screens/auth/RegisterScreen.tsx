import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Snackbar, Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { Spacing } from '@core/theme/typography';
import type { RegisterCredentials } from '@domain/types/auth.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { AppInput } from '@presentation/components/common/AppInput';
import { useTheme } from '@presentation/hooks/useTheme';
import type { RegisterScreenProps } from '@presentation/navigation/types';
import { useAuthStore } from '@presentation/store/auth.store';

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [secureText, setSecureText] = useState(true);
  const registerSchema = useMemo(
    () =>
      yup.object({
        name: yup
          .string()
          .min(2, t('auth.register.validation.nameMin'))
          .required(t('auth.register.validation.nameRequired')),
        email: yup
          .string()
          .email(t('auth.register.validation.invalidEmail'))
          .required(t('auth.register.validation.emailRequired')),
        password: yup
          .string()
          .min(6, t('auth.register.validation.passwordMin'))
          .required(t('auth.register.validation.passwordRequired')),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCredentials>({
    resolver: yupResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = useCallback(
    async (data: RegisterCredentials) => {
      try {
        await register(data);
        navigation.navigate('Login', {
          email: data.email,
          message: t('auth.register.successMessage'),
        });
      } catch {
        // Error sudah ditangani store.
      }
    },
    [navigation, register, t],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.hero,
            { backgroundColor: isDark ? colors.surfaceElevated : Colors.light.hero },
          ]}
        >
          <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
            {t('auth.register.title')}
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {t('auth.register.subtitle')}
          </Text>
        </View>

        <AppCard style={styles.formCard}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label={t('auth.register.nameLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                placeholder={t('auth.register.namePlaceholder')}
                left={<TextInput.Icon icon="account-outline" />}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label={t('auth.register.emailLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('auth.register.emailPlaceholder')}
                left={<TextInput.Icon icon="email-outline" />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label={t('auth.register.passwordLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={secureText}
                autoCapitalize="none"
                placeholder={t('auth.register.passwordPlaceholder')}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={secureText ? 'eye-off' : 'eye'}
                    onPress={() => setSecureText(prev => !prev)}
                  />
                }
              />
            )}
          />

          <AppButton
            label={t('auth.register.submit')}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submitButton}
          />
          <AppButton
            label={t('auth.register.backToLogin')}
            onPress={() => navigation.goBack()}
            variant="text"
          />
        </AppCard>
      </ScrollView>

      <Snackbar
        visible={Boolean(error)}
        onDismiss={clearError}
        duration={3000}
        action={{ label: t('common.ok'), onPress: clearError }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    marginBottom: Spacing.md,
  },
  formCard: {
    gap: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});
