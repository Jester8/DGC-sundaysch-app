import { View, TouchableOpacity, Text, useWindowDimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";

export default function BottomTabNavigation() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { activeTab, setActiveTab, isDarkMode } = useNavigation();

  const isTablet = width > 768;
  const isMobile = width <= 768;

  const getResponsiveSize = (baseSize: number) => {
    if (isTablet) {
    
      return baseSize * 0.7;
    } else {
     
      return baseSize;
    }
  };

  const getTabletPadding = (baseValue: number) => {
    if (isTablet) {
      return baseValue * 0.6; 
    }
    return baseValue;
  };

  const getActiveBackgroundColor = () => {
    return isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
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
        paddingVertical: getTabletPadding(getResponsiveSize(10)),
        paddingHorizontal: getTabletPadding(getResponsiveSize(12)),
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? "#000000ff" : "#f0f0f0",
        backgroundColor: isDarkMode ? "#000000ff" : "#ffffff",
      }}
    >
      <TouchableOpacity
        onPress={() => handleMenuPress("Home")}
        style={{
          alignItems: "center",
          paddingVertical: getTabletPadding(getResponsiveSize(6)),
          paddingHorizontal: getTabletPadding(getResponsiveSize(16)),
          borderRadius: isTablet ? 12 : 8,
          backgroundColor: activeTab === "Home" ? getActiveBackgroundColor() : "transparent",
        }}
      >
        <Feather
          name="home"
          size={getResponsiveSize(21)}
          color={activeTab === "Home" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000")}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(11),
            fontFamily: "Poppins_500Medium",
            color: activeTab === "Home" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000"),
            marginTop: getTabletPadding(getResponsiveSize(4)),
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("Outlines")}
        style={{
          alignItems: "center",
          paddingVertical: getTabletPadding(getResponsiveSize(8)),
          paddingHorizontal: getTabletPadding(getResponsiveSize(16)),
          borderRadius: isTablet ? 12 : 8,
          backgroundColor: activeTab === "Outlines" ? getActiveBackgroundColor() : "transparent",
        }}
      >
        <MaterialCommunityIcons
          name={activeTab === "Outlines" ? "file-document" : "file-document-outline"}
          size={getResponsiveSize(21)}
          color={activeTab === "Outlines" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000")}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(11),
            fontFamily: "Poppins_500Medium",
            color: activeTab === "Outlines" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000"),
            marginTop: getTabletPadding(getResponsiveSize(4)),
          }}
        >
          Manuals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("noted")}
        style={{
          alignItems: "center",
          paddingVertical: getTabletPadding(getResponsiveSize(8)),
          paddingHorizontal: getTabletPadding(getResponsiveSize(16)),
          borderRadius: isTablet ? 12 : 8,
          backgroundColor: activeTab === "noted" ? getActiveBackgroundColor() : "transparent",
        }}
      >
        <Feather
          name="edit-3"
          size={getResponsiveSize(21)}
          color={activeTab === "noted" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000")}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(11),
            fontFamily: "Poppins_500Medium",
            color: activeTab === "noted" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000"),
            marginTop: getTabletPadding(getResponsiveSize(4)),
          }}
        >
          Notes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleMenuPress("Profile")}
        style={{
          alignItems: "center",
          paddingVertical: getTabletPadding(getResponsiveSize(8)),
          paddingHorizontal: getTabletPadding(getResponsiveSize(16)),
          borderRadius: isTablet ? 12 : 8,
          backgroundColor: activeTab === "Profile" ? getActiveBackgroundColor() : "transparent",
        }}
      >
        <Feather
          name="user"
          size={getResponsiveSize(21)}
          color={activeTab === "Profile" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000")}
        />
        <Text
          style={{
            fontSize: getResponsiveSize(11),
            fontFamily: "Poppins_500Medium",
            color: activeTab === "Profile" ? (isDarkMode ? "#ffffff" : "#9d00d4") : (isDarkMode ? "#ffffff" : "#000000"),
            marginTop: getTabletPadding(getResponsiveSize(4)),
          }}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}