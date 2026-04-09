import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Colors } from '@core/theme/colors';
import { BorderRadius, Spacing } from '@core/theme/typography';
import type { AppLanguage } from '@core/utils/i18n.utils';
import { useTheme } from '@presentation/hooks/useTheme';

const LANGUAGE_ORDER: AppLanguage[] = ['id', 'en', 'ja', 'ar'];

interface LanguageSelectorProps {
  selectedLanguage: AppLanguage;
  onSelect: (language: AppLanguage) => void;
}

export function LanguageSelector({
  selectedLanguage,
  onSelect,
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.grid}>
      {LANGUAGE_ORDER.map(language => {
        const selected = language === selectedLanguage;

        return (
          <Pressable
            key={language}
            onPress={() => onSelect(language)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected
                  ? isDark
                    ? 'rgba(36, 107, 253, 0.14)'
                    : Colors.primaryLight
                  : isDark
                    ? colors.surfaceVariant
                    : colors.surface,
                borderColor: selected ? Colors.primary : colors.outline,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text variant="titleSmall" style={[styles.label, { color: colors.onSurface }]}>
              {t(`settingsScreen.languages.${language}.label`)}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.description, { color: colors.onSurfaceVariant }]}
            >
              {t(`settingsScreen.languages.${language}.description`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.sm,
  },
  option: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 4,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
});
