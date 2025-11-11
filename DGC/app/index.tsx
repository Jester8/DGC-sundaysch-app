import { useEffect } from "react";
import { View, Image, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useNavigation } from "./Home/_navigationContext";

export default function Index() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useNavigation();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;

  const logoSize = isMobile ? 120 : isTablet ? 160 : 200;

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        router.push("/Home/home");
      } else {
        router.push("/onboarding");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, hasCompletedOnboarding, isLoading]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#390054", "#49006c", "#2a0042"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Image
          source={require("@/assets/images/layout.png")}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.3,
          }}
          resizeMode="cover"
        />

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Image
            source={require("@/assets/images/main.png")}
            style={{
              width: logoSize * 2,
              height: logoSize * 1.5,
            }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
}