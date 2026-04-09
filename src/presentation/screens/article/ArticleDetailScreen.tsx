import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Chip, Snackbar, Text } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getIntlLocale } from '@core/utils/i18n.utils';
import { AppButton } from '@presentation/components/common/AppButton';
import { AppCard } from '@presentation/components/common/AppCard';
import { useTheme } from '@presentation/hooks/useTheme';
import { ArticleDetailScreenProps } from '@presentation/navigation/types';

export function ArticleDetailScreen({ route }: ArticleDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { article } = route.params;
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);

  const publishedDate = useMemo(
    () =>
      new Date(article.createdAt).toLocaleDateString(
        getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id'),
        {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        },
      ),
    [article.createdAt, i18n.resolvedLanguage],
  );

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(article.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [article.content]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.xxxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
          ]}
        >
          <Chip
            compact
            style={[
              styles.categoryChip,
              { backgroundColor: isDark ? colors.surfaceElevated : Colors.primaryLight },
            ]}
            textStyle={styles.categoryText}
          >
            {article.category}
          </Chip>

          <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
            {article.title}
          </Text>

          <Text variant="bodyMedium" style={[styles.summary, { color: colors.onSurfaceVariant }]}>
            {article.summary}
          </Text>

          <View style={[styles.metaPill, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={Colors.primary} />
            <Text variant="bodySmall" style={[styles.meta, { color: colors.onSurface }]}>
              {t('articleDetail.publishedOn', { date: publishedDate })}
            </Text>
          </View>
        </View>

        <AppCard style={styles.contentCard}>
          <Text variant="titleMedium" style={styles.contentTitle}>
            {t('articleDetail.contentTitle')}
          </Text>
          <Text variant="bodyMedium" style={[styles.content, { color: colors.onSurface }]}>
            {article.content}
          </Text>
        </AppCard>

        <AppButton
          label={t('articleDetail.copy')}
          onPress={handleCopy}
          variant="outlined"
          icon="content-copy"
          style={styles.copyButton}
        />
      </ScrollView>

      <Snackbar visible={copied} onDismiss={() => setCopied(false)} duration={2000}>
        {t('articleDetail.copied')}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    lineHeight: 34,
  },
  summary: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 24,
  },
  metaPill: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  meta: {
    fontFamily: 'Poppins_500Medium',
  },
  contentCard: {
    paddingTop: Spacing.xl,
  },
  contentTitle: {
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.sm,
  },
  content: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 26,
  },
  copyButton: {
    marginTop: Spacing.md,
  },
});
