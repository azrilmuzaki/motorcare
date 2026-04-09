import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Article } from '@domain/types/article.types';

export type AuthStackParamList = {
  Login:
    | {
        message?: string;
        email?: string;
      }
    | undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Articles: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AddVehicle: undefined;
  ArticleDetail: { article: Article };
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type AddVehicleScreenProps = NativeStackScreenProps<RootStackParamList, 'AddVehicle'>;
export type ArticleDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ArticleDetail'
>;
export type HistoryTabProps = BottomTabScreenProps<MainTabParamList, 'History'>;
