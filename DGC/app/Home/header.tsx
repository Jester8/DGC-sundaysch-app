import { View, Image, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  const { width } = useWindowDimensions();

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  // Large, clear logo for visibility
  const logoSize = getResponsiveSize(70);
  const iconSize = getResponsiveSize(26);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: getResponsiveSize(16),
        paddingVertical: getResponsiveSize(10),
        backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      }}
    >
      {/* Logo (Switches between dark/light) */}
      <Image
        source={
          isDarkMode
            ? require("@/assets/images/main.png")
            : require("@/assets/images/dark.png")
        }
        style={{
          width: logoSize,
          height: logoSize,
          resizeMode: "contain",
        }}
      />

      {/* Right Icons */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: getResponsiveSize(12),
        }}
      >
        {/* Notification Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            padding: getResponsiveSize(8),
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={iconSize}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        {/* Dark/Light Mode Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleDarkMode}
          style={{
            padding: getResponsiveSize(8),
          }}
        >
          <Ionicons
            name={isDarkMode ? "moon" : "sunny"}
            size={iconSize}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
