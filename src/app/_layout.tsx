import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onDailyTapped, rescheduleDaily } from '@/lib/notify';
import { AppStateProvider, useAppState } from '@/state/app-state';
import { FONT_MAP } from '@/theme/fonts';

// The whole app is Hebrew: RTL everywhere. On native the expo-localization plugin (forcesRTL) applies it
// from the first launch; these calls keep it on if the setting is ever lost.
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

function Root() {
  const { theme, ready, daily } = useAppState();
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const done = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (done) SplashScreen.hideAsync();
  }, [done]);

  // Daily question: keep the next two weeks scheduled (Shabbat and Yom Tov skipped); open the answer on tap.
  useEffect(() => {
    if (ready) rescheduleDaily(daily).catch(() => {});
  }, [ready, daily]);
  useEffect(() => onDailyTapped((id) => router.push({ pathname: '/answer/[id]', params: { id } })), []);

  const navTheme = useMemo(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: theme.colors.bg, card: theme.colors.bg, text: theme.colors.ink, primary: theme.colors.acc } };
  }, [theme]);

  if (!done) return null;

  const webDir = Platform.OS === 'web' ? ({ dir: 'rtl', lang: 'he' } as object) : {};
  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }} {...webDir}>
        <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="answer/[id]" />
          <Stack.Screen name="topic/[name]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="hard-now" options={{ animation: 'fade' }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Root />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
