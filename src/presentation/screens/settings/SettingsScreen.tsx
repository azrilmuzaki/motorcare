import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Portal, Snackbar, Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME, APP_VERSION } from '@core/constants/app.constants';
import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { isRtlLanguage } from '@core/utils/i18n.utils';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { LanguageSelector } from '@presentation/components/settings/LanguageSelector';
import { ProfilePhotoModal } from '@presentation/components/settings/ProfilePhotoModal';
import { useTheme } from '@presentation/hooks/useTheme';
import { useAuthStore } from '@presentation/store/auth.store';
import {
  Language,
  ThemeMode,
  useSettingsStore,
} from '@presentation/store/settings.store';

type SheetType = 'language' | 'theme' | null;

type ThemeOption = {
  value: ThemeMode;
  label: string;
  description: string;
};

function ActionRow({
  icon,
  title,
  description,
  onPress,
  value,
  right,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description?: string;
  onPress?: () => void;
  value?: string;
  right?: React.ReactNode;
  isLast?: boolean;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.rowPressable, { opacity: pressed ? 0.82 : 1 }]}
    >
      <View
        style={[
          styles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: isDark ? colors.surfaceVariant : Colors.primaryLight },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
        </View>

        <View style={styles.rowCopy}>
          <Text variant="titleSmall" style={[styles.rowTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
          {description ? (
            <Text
              variant="bodySmall"
              style={[styles.rowDescription, { color: colors.onSurfaceVariant }]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {right ?? (
          <View style={styles.rowMeta}>
            {value ? (
              <Text variant="labelMedium" style={[styles.rowValue, { color: colors.onSurfaceVariant }]}>
                {value}
              </Text>
            ) : null}
            {onPress ? (
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.onSurfaceVariant}
              />
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function SelectionSheet({
  visible,
  title,
  subtitle,
  onDismiss,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalWrapper}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.outline }]} />
          </View>

          <Text variant="titleLarge" style={[styles.sheetTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.sheetSubtitle, { color: colors.onSurfaceVariant }]}
          >
            {subtitle}
          </Text>

          {children}
        </View>
      </Modal>
    </Portal>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuthStore();
  const {
    language,
    themeMode,
    notificationsEnabled,
    profileImageUri,
    loadProfileImage,
    setLanguage,
    setThemeMode,
    setNotificationsEnabled,
    setProfileImageUri,
  } = useSettingsStore();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [profilePhotoModalVisible, setProfilePhotoModalVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const themeOptions = useMemo<ThemeOption[]>(
    () => [
      {
        value: 'light',
        label: t('settingsScreen.themeSheet.lightTitle'),
        description: t('settingsScreen.themeSheet.lightDescription'),
      },
      {
        value: 'dark',
        label: t('settingsScreen.themeSheet.darkTitle'),
        description: t('settingsScreen.themeSheet.darkDescription'),
      },
      {
        value: 'system',
        label: t('settingsScreen.themeSheet.systemTitle'),
        description: t('settingsScreen.themeSheet.systemDescription'),
      },
    ],
    [t],
  );

  const handleShare = useCallback(async () => {
    await Share.share({
      message: t('settingsScreen.shareMessage', { appName: APP_NAME }),
    });
  }, [t]);

  const handleAvatarPress = useCallback(() => {
    setProfilePhotoModalVisible(true);
  }, []);

  const handleChangePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFeedbackMessage(t('settingsScreen.feedback.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      if (!user?.id) return;

      await setProfileImageUri(user.id, result.assets[0].uri);
      setProfilePhotoModalVisible(false);
      setFeedbackMessage(t('settingsScreen.feedback.photoUpdated'));
    } catch {
      setFeedbackMessage(t('settingsScreen.feedback.galleryFailed'));
    }
  }, [setProfileImageUri, t, user?.id]);

  const handleRemovePhoto = useCallback(async () => {
    if (!user?.id) return;
    await setProfileImageUri(user.id, null);
    setProfilePhotoModalVisible(false);
    setFeedbackMessage(t('settingsScreen.feedback.photoRemoved'));
  }, [setProfileImageUri, t, user?.id]);

  const handleLanguageSelect = useCallback(
    async (value: Language) => {
      const directionChanged = isRtlLanguage(language) !== isRtlLanguage(value);
      await setLanguage(value);
      setActiveSheet(null);
      if (directionChanged) {
        const nextT = i18n.getFixedT(value);
        setFeedbackMessage(nextT('settingsScreen.feedback.rtlNotice'));
      }
    },
    [i18n, language, setLanguage],
  );

  const handleThemeSelect = useCallback(
    async (value: ThemeMode) => {
      await setThemeMode(value);
      setActiveSheet(null);
    },
    [setThemeMode],
  );

  const displayName = useMemo(() => {
    const trimmed = user?.name?.trim();
    return trimmed ? trimmed : t('settingsScreen.displayNameFallback');
  }, [t, user?.name]);

  const userEmailText = useMemo(() => {
    const trimmed = user?.email?.trim();
    return trimmed ? trimmed : t('settingsScreen.emailFallback');
  }, [t, user?.email]);

  const profileInitial = useMemo(() => displayName.charAt(0).toUpperCase(), [displayName]);

  const selectedLanguageLabel = useMemo(
    () => t(`settingsScreen.languages.${language}.label`),
    [language, t],
  );

  const selectedThemeLabel = useMemo(
    () => themeOptions.find(o => o.value === themeMode)?.label ?? themeOptions[2].label,
    [themeMode, themeOptions],
  );

  React.useEffect(() => {
    void loadProfileImage(user?.id);
  }, [loadProfileImage, user?.id]);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero full-width, melengkung di bawah ── */}
        <View style={[styles.hero, { paddingTop: insets.top + Spacing.xl }]}>
          {/* Dekorasi lingkaran */}
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />

          {/* Badge */}
          {/* <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>⚙️  {t('settingsScreen.eyebrow')}</Text>
          </View> */}

          {/* Title & subtitle */}
          <Text style={styles.heroTitle}>{t('settingsScreen.title')}</Text>
          <Text style={styles.heroSub}>{t('settingsScreen.description')}</Text>

          {/* Profile Row */}
          <View style={styles.profileRow}>
            <Pressable
              onPress={handleAvatarPress}
              style={({ pressed }) => [styles.avatarButton, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={styles.avatar}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{profileInitial}</Text>
                )}
                <View style={styles.avatarBadge}>
                  <MaterialCommunityIcons name="pencil" size={14} color={Colors.primary} />
                </View>
              </View>
            </Pressable>

            <View style={styles.profileCopy}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{userEmailText}</Text>
              <Text style={styles.avatarHint}>{t('settingsScreen.avatarHint')}</Text>
            </View>
          </View>
        </View>

        {/* ── Konten bawah (dengan padding horizontal) ── */}
        <View style={styles.content}>
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t('settingsScreen.sectionTitle')}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}
              >
                {t('settingsScreen.sectionSubtitle')}
              </Text>
            </View>

            <View style={styles.sectionContent}>
              <ActionRow
                icon="translate"
                title={t('settingsScreen.rows.languageTitle')}
                description={t('settingsScreen.rows.languageDescription')}
                value={selectedLanguageLabel}
                onPress={() => setActiveSheet('language')}
              />
              <ActionRow
                icon="theme-light-dark"
                title={t('settingsScreen.rows.themeTitle')}
                description={t('settingsScreen.rows.themeDescription')}
                value={selectedThemeLabel}
                onPress={() => setActiveSheet('theme')}
              />
              <ActionRow
                icon="bell-outline"
                title={t('settingsScreen.rows.notificationsTitle')}
                description={t('settingsScreen.rows.notificationsDescription')}
                right={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={value => { void setNotificationsEnabled(value); }}
                    color={Colors.primary}
                  />
                }
              />
              <ActionRow
                icon="share-variant-outline"
                title={t('settingsScreen.rows.shareTitle')}
                description={t('settingsScreen.rows.shareDescription')}
                onPress={handleShare}
              />
              <ActionRow
                icon="information-outline"
                title={t('settingsScreen.rows.aboutTitle')}
                description={`${APP_NAME} v${APP_VERSION}`}
              />
              <ActionRow
                icon="shield-check-outline"
                title={t('settingsScreen.rows.privacyTitle')}
                description={t('settingsScreen.rows.privacyDescription')}
                isLast
              />
            </View>
          </AppCard>

          <View style={styles.logoutContainer}>
            <AppButton
              label={t('common.logout')}
              onPress={logout}
              variant="outlined"
              icon="logout"
            />
          </View>
        </View>
      </ScrollView>

      <SelectionSheet
        visible={activeSheet === 'language'}
        title={t('settingsScreen.languageSheet.title')}
        subtitle={t('settingsScreen.languageSheet.subtitle')}
        onDismiss={() => setActiveSheet(null)}
      >
        <LanguageSelector
          selectedLanguage={language}
          onSelect={value => { void handleLanguageSelect(value); }}
        />
      </SelectionSheet>

      <SelectionSheet
        visible={activeSheet === 'theme'}
        title={t('settingsScreen.themeSheet.title')}
        subtitle={t('settingsScreen.themeSheet.subtitle')}
        onDismiss={() => setActiveSheet(null)}
      >
        <View style={styles.sheetOptions}>
          {themeOptions.map(option => {
            const selected = option.value === themeMode;
            return (
              <Pressable
                key={option.value}
                onPress={() => { void handleThemeSelect(option.value); }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  {
                    backgroundColor: selected
                      ? isDark ? 'rgba(36,107,253,0.14)' : Colors.primaryLight
                      : isDark ? colors.surfaceVariant : colors.surface,
                    borderColor: selected ? Colors.primary : colors.outline,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.sheetOptionCopy}>
                  <Text
                    variant="titleSmall"
                    style={[styles.sheetOptionTitle, { color: colors.onSurface }]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[styles.sheetOptionDescription, { color: colors.onSurfaceVariant }]}
                  >
                    {option.description}
                  </Text>
                </View>
                {selected ? (
                  <MaterialCommunityIcons name="check-circle" size={22} color={Colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </SelectionSheet>

      <ProfilePhotoModal
        visible={profilePhotoModalVisible}
        imageUri={profileImageUri}
        userName={displayName}
        profileInitial={profileInitial}
        onDismiss={() => setProfilePhotoModalVisible(false)}
        onChangePhoto={() => { void handleChangePhoto(); }}
        onRemovePhoto={() => { void handleRemovePhoto(); }}
      />

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => setFeedbackMessage(null)}
        duration={3000}
      >
        {feedbackMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scroll: {
    paddingBottom: Spacing.xxxl,
    // Tidak ada paddingHorizontal — hero mentok ke tepi
  },

  // ── Hero full-width ───────────────────────────────
  hero: {
    backgroundColor: '#185FA5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  heroDeco1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -40,
  },
  heroDeco2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    right: 60,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B5D4F4',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 30,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 19,
  },

  // ── Profile Row (di dalam hero) ───────────────────
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
  },
  avatarButton: {
    borderRadius: BorderRadius.full,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.75)',
  },
  avatarHint: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Konten bawah ─────────────────────────────────
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionCard: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // ── Action Row ────────────────────────────────────
  rowPressable: {
    borderRadius: BorderRadius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1 },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  rowDescription: {
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  rowValue: {
    fontFamily: 'Poppins_500Medium',
  },

  // ── Logout ────────────────────────────────────────
  logoutContainer: {
    paddingBottom: Spacing.sm,
  },

  // ── Modal / Sheet ─────────────────────────────────
  modalWrapper: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sheetHandle: {
    width: 56,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    marginTop: Spacing.xs,
  },
  sheetSubtitle: {
    fontFamily: 'Poppins_400Regular',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    lineHeight: 21,
  },
  sheetOptions: {
    gap: Spacing.sm,
  },
  sheetOption: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sheetOptionCopy: { flex: 1 },
  sheetOptionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  sheetOptionDescription: {
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
});