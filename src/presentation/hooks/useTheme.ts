import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@presentation/store/settings.store';
import { LightTheme, DarkTheme } from '@core/theme/theme';
import { Colors } from '@core/theme/colors';

export function useTheme() {
  const { themeMode } = useSettingsStore();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark');

  const theme = isDark ? DarkTheme : LightTheme;
  const colors = isDark ? Colors.dark : Colors.light;

  return { theme, isDark, colors };
}