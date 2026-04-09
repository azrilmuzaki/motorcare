import React, { useCallback, useEffect, useState, memo } from 'react';
import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Chip, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArticleService } from '@data/services/article.service';
import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import { getIntlLocale } from '@core/utils/i18n.utils';
import { Article } from '@domain/types/article.types';
import { AppCard } from '@presentation/components/common/AppCard';
import { EmptyState } from '@presentation/components/common/EmptyState';
import { useTheme } from '@presentation/hooks/useTheme';
import type { RootStackParamList } from '@presentation/navigation/types';

const ArticleItem = memo(({
  item,
  onPress,
}: {
  item: Article;
  onPress: (article: Article) => void;
}) => {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <AppCard onPress={() => onPress(item)}>
      <View
        style={[
          styles.articleMedia,
          { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
        ]}
      >
        <MaterialCommunityIcons name="newspaper-variant-outline" size={28} color={Colors.primary} />
        <Text variant="labelMedium" style={styles.mediaLabel}>
          {t('articlesScreen.mediaLabel')}
        </Text>
      </View>

      <Chip
        compact
        style={[
          styles.categoryChip,
          { backgroundColor: isDark ? colors.surfaceElevated : Colors.primaryLight },
        ]}
        textStyle={styles.categoryText}
      >
        {item.category}
      </Chip>

      <Text variant="titleMedium" style={styles.articleTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text
        variant="bodySmall"
        style={[styles.articleSummary, { color: colors.onSurfaceVariant }]}
        numberOfLines={3}
      >
        {item.summary}
      </Text>

      <View style={styles.articleFooter}>
        <Text variant="labelSmall" style={[styles.articleDate, { color: colors.onSurfaceVariant }]}>
          {new Date(item.createdAt).toLocaleDateString(
            getIntlLocale((i18n.resolvedLanguage as 'id' | 'en' | 'ja' | 'ar') ?? 'id'),
            {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            },
          )}
        </Text>
        <View
          style={[
            styles.arrowBadge,
            { backgroundColor: isDark ? Colors.dark.surfaceVariant : Colors.primaryLight },
          ]}
        >
          <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.primary} />
        </View>
      </View>
    </AppCard>
  );
});

ArticleItem.displayName = 'ArticleItem';

export function ArticleListScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ArticleService.getArticles();
      setArticles(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const renderItem = useCallback<ListRenderItem<Article>>(
    ({ item }) => (
      <ArticleItem
        item={item}
        onPress={article => navigation.navigate('ArticleDetail', { article })}
      />
    ),
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={articles}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.hero,
                { backgroundColor: isDark ? Colors.dark.hero : Colors.light.hero },
              ]}
            >
              <Text variant="labelLarge" style={styles.eyebrow}>
                {t('articlesScreen.eyebrow')}
              </Text>
              <Text variant="headlineSmall" style={[styles.title, { color: colors.onBackground }]}>
                {t('articlesScreen.title')}
              </Text>
              <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {t('articlesScreen.subtitle')}
              </Text>

              <View style={[styles.heroChip, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="bookmark-outline" size={18} color={Colors.primary} />
                <Text variant="bodySmall" style={[styles.heroChipText, { color: colors.onSurface }]}>
                  {t('articlesScreen.availableCount', { count: articles.length })}
                </Text>
              </View>
            </View>

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              {t('articlesScreen.sectionTitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="newspaper-variant-outline"
              title={t('articlesScreen.emptyTitle')}
              description={t('articlesScreen.emptyDescription')}
            />
          )
        }
        contentContainerStyle={[
          styles.list,
          articles.length === 0 ? styles.listEmpty : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchArticles}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  hero: {
    borderRadius: 28,
    padding: Spacing.xl,
  },
  eyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  heroChip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroChipText: {
    fontFamily: 'Poppins_500Medium',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  listEmpty: {
    flex: 1,
  },
  separator: {
    height: Spacing.md,
  },
  articleMedia: {
    height: 92,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mediaLabel: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  categoryText: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  articleTitle: {
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  articleSummary: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  articleFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleDate: {
    fontFamily: 'Poppins_500Medium',
  },
  arrowBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
