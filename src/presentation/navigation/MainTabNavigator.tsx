import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@presentation/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '@presentation/screens/home/HomeScreen';
import { HistoryScreen } from '@presentation/screens/history/HistoryScreen';
import { ArticleListScreen } from '@presentation/screens/article/ArticleListScreen';
import { SettingsScreen } from '@presentation/screens/settings/SettingsScreen';
import { Colors } from '@core/theme/colors';
import { BorderRadius } from '@core/theme/typography';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? Colors.dark.onSurfaceVariant : Colors.light.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surfaceElevated : Colors.white,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.outline,
          height: 72 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 12,
          shadowColor: isDark ? '#000000' : Colors.black,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.42 : 0.08,
          shadowRadius: 18,
          elevation: 0,
        },
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 11,
          marginBottom: 2,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons: Record<
            keyof MainTabParamList,
            React.ComponentProps<typeof MaterialCommunityIcons>['name']
          > = {
            Home: 'garage',
            History: 'history',
            Articles: 'newspaper-variant',
            Settings: 'cog',
          };
          return (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: focused
                    ? isDark
                      ? 'rgba(36, 107, 253, 0.16)'
                      : Colors.primaryLight
                    : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={icons[route.name]}
                size={focused ? size + 1 : size}
                color={focused ? Colors.primary : color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('navigation.home') }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t('navigation.history') }} />
      <Tab.Screen name="Articles" component={ArticleListScreen} options={{ tabBarLabel: t('navigation.articles') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('navigation.settings') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    borderRadius: BorderRadius.full,
  },
  iconWrap: {
    minWidth: 44,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
