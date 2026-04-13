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
  Home: { reminderMessage?: string } | undefined;
  History: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AddVehicle: undefined;
  AddReminder: undefined;
  AddService: undefined;
  UpdateOdometer: { vehicleId?: string };
  ArticleDetail: { article: Article };
  VehicleDetail: { vehicleId: string };
  VehiclesList: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type AddVehicleScreenProps = NativeStackScreenProps<RootStackParamList, 'AddVehicle'>;
export type AddReminderScreenProps = NativeStackScreenProps<RootStackParamList, 'AddReminder'>;
export type AddServiceScreenProps = NativeStackScreenProps<RootStackParamList, 'AddService'>;
export type UpdateOdometerScreenProps = NativeStackScreenProps<RootStackParamList, 'UpdateOdometer'>;
export type ArticleDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ArticleDetail'
>;
export type HistoryTabProps = BottomTabScreenProps<MainTabParamList, 'History'>;
export type VehiclesListScreenProps = NativeStackScreenProps<RootStackParamList, 'VehiclesList'>;
