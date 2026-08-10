import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

const ACCENT = "#9d00d4";

export default function Devotionals() {
  const { isDarkMode } = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" }]}>
      <Text style={[styles.title, { color: isDarkMode ? "#FFF" : "#000" }]}>Devotionals</Text>

      <View style={styles.centerContainer}>
        <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? "#241a2e" : "#f3e5fb" }]}>
          <MaterialIcons name="wb-sunny" size={40} color={ACCENT} />
        </View>
        <Text style={[styles.comingSoonTitle, { color: isDarkMode ? "#FFF" : "#000" }]}>Coming Soon</Text>
        <Text style={[styles.comingSoonSubtitle, { color: isDarkMode ? "#999" : "#666" }]}>
          Daily devotionals to help you grow spiritually every day will show up here shortly.
        </Text>
      </View>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "Manrope_800ExtraBold",
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 80,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 19,
    fontFamily: "Manrope_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  comingSoonSubtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
});
