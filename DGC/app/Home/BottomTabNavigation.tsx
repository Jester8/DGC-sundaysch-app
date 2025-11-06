import { View, TouchableOpacity, Text, useWindowDimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";

export default function BottomTabNavigation() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { activeTab, setActiveTab, isDarkMode } = useNavigation();

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const handleMenuPress = (menu: string) => {
    if (menu === "Outlines") {
      setActiveTab("Outlines");
      router.push("/Home/outline");
    } else if (menu === "noted") {
      setActiveTab("noted");
      router.push("/Home/noted");
    } else if (menu === "Home") {
      setActiveTab("Home");
      router.push("/Home/home");
    } else if (menu === "Profile") {
      setActiveTab("Profile");
      router.push("/Home/Signup");
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: getResponsiveSize(12),
        paddingHorizontal: getResponsiveSize(16),
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? "#333333" : "#f0f0f0",
        backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      }}
    >
      <TouchableOpacity
        onPress={() => handleMenuPress("Home")}
        style={{
          alignItems: "center",
          paddingVertical: getResponsiveSize(8),
          paddingHorizontal: getResponsiveSize(16),
        }}
      >
        <Feather
          name="home"
          size={getResponsiveSize(24)}
          color={isDarkMode ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(12),
            fontFamily: "Poppins_500Medium",
            color: isDarkMode ? "#ffffff" : "#000000",
            marginTop: getResponsiveSize(4),
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("Outlines")}
        style={{
          alignItems: "center",
          paddingVertical: getResponsiveSize(8),
          paddingHorizontal: getResponsiveSize(16),
        }}
      >
        <MaterialCommunityIcons
          name={activeTab === "Outlines" ? "file-document" : "file-document-outline"}
          size={getResponsiveSize(24)}
          color={isDarkMode ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(12),
            fontFamily: "Poppins_500Medium",
            color: isDarkMode ? "#ffffff" : "#000000",
            marginTop: getResponsiveSize(4),
          }}
        >
          Outlines
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("noted")}
        style={{
          alignItems: "center",
          paddingVertical: getResponsiveSize(8),
          paddingHorizontal: getResponsiveSize(16),
        }}
      >
        <Feather
          name="edit-3"
          size={getResponsiveSize(24)}
          color={isDarkMode ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(12),
            fontFamily: "Poppins_500Medium",
            color: isDarkMode ? "#ffffff" : "#000000",
            marginTop: getResponsiveSize(4),
          }}
        >
          Notes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("Profile")}
        style={{
          alignItems: "center",
          paddingVertical: getResponsiveSize(8),
          paddingHorizontal: getResponsiveSize(16),
        }}
      >
        <Feather
          name="user"
          size={getResponsiveSize(24)}
          color={isDarkMode ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(12),
            fontFamily: "Poppins_500Medium",
            color: isDarkMode ? "#ffffff" : "#000000",
            marginTop: getResponsiveSize(4),
          }}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}