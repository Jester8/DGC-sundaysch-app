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

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isPhone = width <= 600;

  // Responsive sizing
  const bannerHeight = getResponsiveSize(180);
  const headerArrowSize = isPhone ? 20 : getResponsiveSize(14);
  const headerTitleSize = isPhone ? 12 : getResponsiveSize(10);

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
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#333333" : "#e0e0e0",
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back"
            size={headerArrowSize}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { 
              color: isDarkMode ? "#FFFFFF" : "#000000",
              fontSize: headerTitleSize,
            },
          ]}
        >
          OUTLINE
        </Text>
        <View style={{ width: headerArrowSize }} />
      </View>

      {/* Date */}
      {manualData.date && (
        <View style={{ paddingHorizontal: getResponsiveSize(16), paddingTop: getResponsiveSize(16), paddingBottom: getResponsiveSize(8) }}>
          <Text
            style={{
              fontSize: isPhone ? 12 : getResponsiveSize(9),
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#ffffffff" : "#666666",
            }}
          >
            {manualData.date}
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Banner with Title Overlay */}
        {manualData.imageUrl && (
          <View style={[styles.heroContainer, { height: bannerHeight, marginHorizontal: getResponsiveSize(16), marginTop: getResponsiveSize(8), marginBottom: getResponsiveSize(16) }]}>
            <Image
              source={{ uri: manualData.imageUrl }}
              style={styles.heroImage}
            />
          
          </View>
        )}

        <View style={{ paddingHorizontal: getResponsiveSize(16), paddingBottom: getResponsiveSize(40) }}>
          {/* Memory Verse */}
          {manualData.memoryVerse && (
            <View style={{ marginBottom: getResponsiveSize(23) }}>
              <View
                style={{
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  borderRadius: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(8),
                }}
              >
                <Text
                  style={{
                    fontSize: isPhone ? 12 : getResponsiveSize(8),
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                    letterSpacing: 0.3,
                  }}
                >
                  Memory Verse:
                </Text>
              </View>
              <Text
                style={{
                  fontSize: isPhone ? 12 : getResponsiveSize(9),
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#b0b0b0" : "#666666",
                  lineHeight: getResponsiveSize(16),
                }}
              >
                "{manualData.memoryVerse}"
              </Text>
            </View>
          )}

          {/* Scripture Reference */}
          {manualData.text && (
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <View
                style={{
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  borderRadius: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(8),
                }}
              >
                <Text
                  style={{
                    fontSize: isPhone ? 12 : getResponsiveSize(8),
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                    letterSpacing: 0.3,
                  }}
                >
                  Scripture Reference:
                </Text>
              </View>
              <Text
                style={{
                  fontSize: isPhone ? 12 : getResponsiveSize(9),
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#b0b0b0" : "#666666",
                  lineHeight: getResponsiveSize(16),
                }}
              >
                {manualData.text}
              </Text>
            </View>
          )}

          {/* Introduction */}
          {manualData.introduction && (
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#9d00d4" : "#9d00d4",
                  borderRadius: getResponsiveSize(4),
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(8),
                }}
              >
                <Text
                  style={{
                   fontSize: isPhone ? 12 : getResponsiveSize(9),
                    fontFamily: "Poppins_600SemiBold",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                    letterSpacing: 0.3,
                  }}
                >
                  Introduction
                </Text>
              </View>
              <Text
                style={{
                   fontSize: isPhone ? 12 : getResponsiveSize(9),
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#b0b0b0" : "#666666",
                  lineHeight: getResponsiveSize(16),
                }}
              >
                {manualData.introduction}
              </Text>
            </View>
          )}

          {/* Main Points */}
          {manualData.mainPoints && manualData.mainPoints.length > 0 && (
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <View
                style={{
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  borderRadius: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(12),
                }}
              >
                <Text
                  style={{
                   fontSize: isPhone ? 12 : getResponsiveSize(9),
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                    letterSpacing: 0.3,
                  }}
                >
                  Sub Topic:
                </Text>
              </View>
              {manualData.mainPoints.map((point: MainPoint, index: number) => (
                <View key={index} style={{ marginBottom: getResponsiveSize(12) }}>
                  <Text
                    style={{
                    fontSize: isPhone ? 12 : getResponsiveSize(9),
                      fontFamily: "Poppins_600SemiBold",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      marginBottom: getResponsiveSize(4),
                    }}
                  >
                    {index + 1}. {point.title}
                  </Text>
                  <Text
                    style={{
                     fontSize: isPhone ? 12 : getResponsiveSize(9),
                      fontFamily: "Poppins_400Regular",
                      color: isDarkMode ? "#b0b0b0" : "#666666",
                      lineHeight: getResponsiveSize(16),
                      marginBottom: getResponsiveSize(4),
                    }}
                  >
                    {point.description}
                  </Text>
                  {point.references && point.references.length > 0 && (
                    <Text
                      style={{
                         fontSize: isPhone ? 12 : getResponsiveSize(9),
                        fontFamily: "Poppins_400Regular",
                        color: isDarkMode ? "#999999" : "#999999",
                      }}
                    >
                      ({point.references.join("; ")})
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Class Discussion */}
          {manualData.classDiscussion && (
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <View
                style={{
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  borderRadius: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(8),
                }}
              >
                <Text
                  style={{
                    fontSize: isPhone ? 12 : getResponsiveSize(9),
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                    letterSpacing: 0.3,
                  }}
                >
                  Class Discussion
                </Text>
              </View>
              <Text
                style={{
                  fontSize: isPhone ? 12 : getResponsiveSize(9),
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#b0b0b0" : "#666666",
                  lineHeight: getResponsiveSize(16),
                }}
              >
                {manualData.classDiscussion}
              </Text>
            </View>
          )}

          {/* Conclusion */}
          {manualData.conclusion && (
            <View style={{ marginBottom: getResponsiveSize(20) }}>
              <View
                style={{
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(8),
                  paddingVertical: getResponsiveSize(4),
                  borderRadius: getResponsiveSize(4),
                  alignSelf: "flex-start",
                  marginBottom: getResponsiveSize(8),
                }}
              >
                <Text
                  style={{
                   fontSize: isPhone ? 12 : getResponsiveSize(9),
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                    letterSpacing: 0.3,
                  }}
                >
                  Conclusion
                </Text>
              </View>
              <Text
                style={{
              fontSize: isPhone ? 12 : getResponsiveSize(9),
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#b0b0b0" : "#666666",
                  lineHeight: getResponsiveSize(16),
                }}
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
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1,
  },
  heroContainer: {
    position: "relative",
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
    backgroundColor: "rgba(157, 0, 212, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroTitle: {
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
    lineHeight: 22,
  },
  heroSubtitle: {
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontStyle: "italic",
  },
});
