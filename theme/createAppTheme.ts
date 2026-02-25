// theme/createAppTheme.ts
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Color } from 'expo-router';

type ThemeVariant = 'light' | 'dark';
type ThemeMode = 'system' | 'light' | 'dark' | 'dynamic';

export function createAppTheme(
  variant: ThemeVariant,
  mode: ThemeMode
): Theme {
  const isDark = variant === 'dark';

  const base = isDark ? DarkTheme : DefaultTheme;

  const isDynamic = mode === 'dynamic';

  const background = Platform.select({
    ios: isDynamic
      ? Color.ios.systemBackground
      : isDark
      ? '#000'
      : '#fff',
    android: isDynamic
      ? Color.android.dynamic.surface
      : isDark
      ? '#121212'
      : '#ffffff',
    default: isDark ? '#000' : '#fff',
  })!;

  const text = Platform.select({
    ios: isDynamic
      ? Color.ios.label
      : isDark
      ? '#fff'
      : '#000',
    android: isDynamic
      ? Color.android.dynamic.onSurface
      : isDark
      ? '#fff'
      : '#000',
    default: isDark ? '#fff' : '#000',
  })!;

  const primary = Platform.select({
    ios: isDynamic
      ? Color.ios.systemBlue
      : base.colors.primary,
    android: isDynamic
      ? Color.android.dynamic.primary
      : base.colors.primary,
    default: base.colors.primary,
  })!;

  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary,
      background,
      card: background,
      text,
      border: isDark ? '#222' : '#ddd',
      notification: primary,
    },
  };
}