import { View, TouchableOpacity, Text, useWindowDimensions, Platform, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";

const ACCENT = "#9d00d4";
const isIOS = Platform.OS === "ios";

type TabKey = "Home" | "Outlines" | "noted" | "Devotionals";

const TABS: Array<{
  key: TabKey;
  label: string;
  route: string;
  family: "feather" | "mci" | "material";
  icon: string;
  iconActive: string;
}> = [
  { key: "Home", label: "Home", route: "/Home/home", family: "feather", icon: "home", iconActive: "home" },
  { key: "Outlines", label: "Manuals", route: "/Home/outline", family: "mci", icon: "file-document-outline", iconActive: "file-document" },
  { key: "noted", label: "Notes", route: "/Home/noted", family: "feather", icon: "edit-3", iconActive: "edit-3" },
  { key: "Devotionals", label: "Devotionals", route: "/Home/devotionals", family: "material", icon: "wb-sunny", iconActive: "wb-sunny" },
];

// iOS 26 "Liquid Glass" treatment — a floating, frosted, fully-rounded pill
// instead of the old edge-to-edge flat bar. Deliberately used on both
// platforms here (unlike a strict per-OS split) since expo-blur renders a
// reasonable frosted effect on Android too; only the exact blur intensity
// differs slightly per platform below.
export default function BottomTabNavigation() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTab, setActiveTab, isDarkMode } = useNavigation();

  const isTablet = width > 768;

  const handleMenuPress = (tab: (typeof TABS)[number]) => {
    if (tab.key === activeTab) return;
    setActiveTab(tab.key);
    router.push(tab.route as any);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.floatingWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <BlurView
        intensity={isIOS ? 78 : 100}
        tint={isDarkMode ? "dark" : "light"}
        style={[
          styles.glassBar,
          isTablet && styles.glassBarTablet,
          {
            borderColor: isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.65)",
            backgroundColor: isDarkMode ? "rgba(20,20,20,0.55)" : "rgba(255,255,255,0.55)",
          },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.family === "mci" ? MaterialCommunityIcons : tab.family === "material" ? MaterialIcons : Feather;
          const color = isActive ? ACCENT : isDarkMode ? "#9a9a9a" : "#7a7a7a";

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleMenuPress(tab)}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Icon name={(isActive ? tab.iconActive : tab.icon) as any} size={isTablet ? 18 : 22} color={color} />
              <Text
                style={[
                  styles.label,
                  { color, fontFamily: isActive ? "Manrope_700Bold" : "Manrope_500Medium" },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
  },
  glassBar: {
    flexDirection: "row",
    borderRadius: 32,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  glassBarTablet: {
    alignSelf: "center",
    width: "60%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});
