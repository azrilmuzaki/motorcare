import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
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
import type { LoginCredentials } from '@domain/types/auth.types';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { AppInput } from '@presentation/components/common/AppInput';
import { useTheme } from '@presentation/hooks/useTheme';
import type { LoginScreenProps } from '@presentation/navigation/types';
import { useAuthStore } from '@presentation/store/auth.store';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [secureText, setSecureText] = useState(true);
  const infoMessage = navigation.getState().routes.find(route => route.name === 'Login')?.params?.message;
  const emailPrefill = navigation.getState().routes.find(route => route.name === 'Login')?.params?.email;
  const loginSchema = useMemo(
    () =>
      yup.object({
        email: yup
          .string()
          .email(t('auth.login.validation.invalidEmail'))
          .required(t('auth.login.validation.emailRequired')),
        password: yup
          .string()
          .min(6, t('auth.login.validation.passwordMin'))
          .required(t('auth.login.validation.passwordRequired')),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: emailPrefill ?? '', password: '' },
  });

  useEffect(() => {
    if (emailPrefill) {
      setValue('email', emailPrefill);
    }
  }, [emailPrefill, setValue]);

  const onSubmit = useCallback(
    async (data: LoginCredentials) => {
      try {
        await login(data);
      } catch {
        // Error sudah ditangani store.
      }
    },
    [login],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: isDark ? colors.surfaceElevated : Colors.light.hero },
          ]}
        >
          <View style={[styles.logoBadge, { backgroundColor: colors.surface }]}>
            <Image
              source={require('../../../../assets/adaptive-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text variant="headlineLarge" style={[styles.appName, { color: colors.onBackground }]}>
            {t('auth.login.heroTitle')}
          </Text>
          <Text variant="bodyMedium" style={[styles.tagline, { color: colors.onSurfaceVariant }]}>
            {t('auth.login.heroSubtitle')}
          </Text>
        </View>

        <AppCard style={styles.form}>
          <Text variant="titleLarge" style={[styles.formTitle, { color: colors.onSurface }]}>
            {t('auth.login.title')}
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label={t('auth.login.emailLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label={t('auth.login.passwordLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={secureText}
                autoCapitalize="none"
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
            label={t('auth.login.submit')}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.submitButton}
          />

          <AppButton
            label={t('auth.login.registerCta')}
            onPress={() => navigation.navigate('Register')}
            variant="text"
          />
        </AppCard>
      </ScrollView>

      <Snackbar
        visible={Boolean(error) || Boolean(infoMessage)}
        onDismiss={() => {
          clearError();
          if (infoMessage) {
            navigation.setParams({ message: undefined, email: emailPrefill });
          }
        }}
        duration={4000}
        action={{
          label: t('common.ok'),
          onPress: () => {
            clearError();
            if (infoMessage) {
              navigation.setParams({ message: undefined, email: emailPrefill });
            }
          },
        }}
      >
        {error ?? infoMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  logoBadge: {
    width: 148,
    height: 148,
    borderRadius: 20,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  form: { gap: Spacing.md },
  formTitle: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.sm,
  },
  submitButton: { marginTop: Spacing.sm },
});
