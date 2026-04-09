import React, { memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { Colors } from '@core/theme/colors';
import { useTheme } from '@presentation/hooks/useTheme';

interface AppInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
  right?: React.ReactNode;
  editable?: boolean;
}

export const AppInput = memo<AppInputProps>(({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  style,
  left,
  right,
  editable = true,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <>
      <TextInput
        textColor={colors.onSurface}
        placeholderTextColor={colors.onSurfaceVariant}
        label={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        error={Boolean(error)}
        cursorColor={Colors.primary}
        selectionColor={Colors.primary}
        activeOutlineColor={Colors.primary}
        outlineColor={colors.outline}
        style={[
          styles.input,
          { backgroundColor: isDark ? colors.surfaceElevated : colors.surface },
          style,
        ]}
        outlineStyle={styles.outline}
        contentStyle={styles.content}
        left={left}
        right={right}
        editable={editable}
      />
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}
    </>
  );
});

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  input: {},
  outline: {
    borderRadius: 12,
  },
  content: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
});
