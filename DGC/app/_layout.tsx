import { Stack, usePathname } from "expo-router";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { View, BackHandler, Platform, PanResponder } from "react-native";
import { NavigationProvider } from "@/app/Home/_navigationContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const pathname = usePathname();
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Platform.OS === "ios" && gestureState.dx > 50,
      onPanResponderRelease: () => {
        if (Platform.OS === "ios" && (pathname === "/" || pathname === "/home")) {
          BackHandler.exitApp();
        }
      },
    })
  ).current;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (pathname === "/" || pathname === "/home") {
        BackHandler.exitApp();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [pathname]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#fff" }} />;

  return (
    <NavigationProvider>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </NavigationProvider>
  );
}