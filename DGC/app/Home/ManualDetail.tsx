import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "./_navigationContext";
import { useRouter, useLocalSearchParams } from "expo-router";

interface MainPoint {
  title: string;
  description: string;
  references: string[];
}

interface ManualData {
  _id: string;
  id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  text: string;
  introduction: string;
  mainPoints: MainPoint[];
  classDiscussion: string;
  conclusion: string;
  month: string;
  date: string;
  order: number;
  imageUrl?: string;
}

export default function ManualDetail() {
  const { isDarkMode } = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { manual } = useLocalSearchParams();

  // Responsive sizing
  const bannerHeight = width < 380 ? 120 : 150;
  const titleFontSize = width < 380 ? 18 : 24;
  const subtitleFontSize = width < 380 ? 12 : 14;

  let manualData: ManualData | null = null;
  try {
    manualData = manual ? JSON.parse(Array.isArray(manual) ? manual[0] : manual as string) : null;
  } catch (error) {
    console.error("Error parsing manual:", error);
    manualData = null;
  }

  if (!manualData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Manual not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#FFF" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? "#000000" : "#FFF",
            borderBottomColor: isDarkMode ? "#333" : "#ddd",
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? "#FFF" : "#000" },
          ]}
        >
          OUTLINE
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Banner - Centered and Responsive */}
        {manualData.imageUrl && (
          <View style={[styles.heroContainer, { height: bannerHeight }]}>
            <Image
              source={{ uri: manualData.imageUrl }}
              style={styles.heroImage}
            />
        
          </View>
        )}

        <View style={[styles.content, { paddingHorizontal: 16 }]}>
          {/* Theme */}
          {manualData.theme && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#ffffffff" : "#000000ff" },
                ]}
              >
                Theme: {manualData.theme}
              </Text>
            </View>
          )}

          {/* Scripture Text */}
          {manualData.text && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                SCRIPTURE TEXT
              </Text>
              <Text
                style={[
                  styles.sectionText,
                  { color: isDarkMode ? "#b0b0b0" : "#666666" },
                ]}
              >
                {manualData.text}
              </Text>
            </View>
          )}

          {/* Memory Verse */}
          {manualData.memoryVerse && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                MEMORY VERSE
              </Text>
              <Text
                style={[
                  styles.memoryVerseText,
                  { color: isDarkMode ? "#b0b0b0" : "#666666" },
                ]}
              >
                "{manualData.memoryVerse}"
              </Text>
            </View>
          )}

          {/* Introduction */}
          {manualData.introduction && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                Introduction
              </Text>
              <Text
                style={[
                  styles.sectionText,
                  { color: isDarkMode ? "#b0b0b0" : "#666666" },
                ]}
              >
                {manualData.introduction}
              </Text>
            </View>
          )}

          {/* Main Points */}
          {manualData.mainPoints && manualData.mainPoints.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                {manualData.theme}
              </Text>
              {manualData.mainPoints.map((point: MainPoint, index: number) => (
                <View key={index} style={styles.pointContainer}>
                  <Text
                    style={[
                      styles.pointNumber,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    {index + 1}. {point.title}
                  </Text>
                  <Text
                    style={[
                      styles.pointDescription,
                      { color: isDarkMode ? "#b0b0b0" : "#666666" },
                    ]}
                  >
                    {point.description}
                  </Text>
                  {point.references && point.references.length > 0 && (
                    <Text
                      style={[
                        styles.pointReferences,
                        { color: isDarkMode ? "#999" : "#999" },
                      ]}
                    >
                      {point.references.join(", ")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Class Discussion */}
          {manualData.classDiscussion && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                Class Discussion
              </Text>
              <Text
                style={[
                  styles.sectionText,
                  { color: isDarkMode ? "#b0b0b0" : "#666666" },
                ]}
              >
                {manualData.classDiscussion}
              </Text>
            </View>
          )}

          {/* Conclusion */}
          {manualData.conclusion && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                Conclusion
              </Text>
              <Text
                style={[
                  styles.sectionText,
                  { color: isDarkMode ? "#b0b0b0" : "#666666" },
                ]}
              >
                {manualData.conclusion}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  heroContainer: {
    position: "relative",
    width: "80%",
    alignSelf: "center",
    height: 150,
    marginBottom: 24,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(184, 0, 230, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
    fontStyle: "italic",
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
  memoryVerseText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  pointContainer: {
    marginBottom: 16,
  },
  pointNumber: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    fontFamily: "Poppins_600SemiBold",
  },
  pointDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
    marginBottom: 4,
  },
  pointReferences: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
});