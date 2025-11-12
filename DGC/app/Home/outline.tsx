import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

const API_BASE_URL = "http://192.168.56.2:5000";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface OutlineItem {
  _id: string;
  id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  text: string;
  introduction: string;
  mainPoints: Array<{
    title: string;
    description: string;
    references: string[];
  }>;
  classDiscussion: string;
  conclusion: string;
  month: string;
  date: string;
  order: number;
  imageUrl?: string;
}

export default function Outline() {
  const { isDarkMode } = useNavigation();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [monthsData, setMonthsData] = useState<
    { name: string; data: OutlineItem[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    fetchAllMonths();
  }, []);

  const fetchAllMonths = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/manuals/all`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const formattedMonths = months.map((month) => ({
          name: month,
          data: data.data[month] || [],
        }));
        setMonthsData(formattedMonths);
      }
    } catch (error) {
      console.error("Error fetching months:", error);
      const emptyMonths = months.map((month) => ({
        name: month,
        data: [],
      }));
      setMonthsData(emptyMonths);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (monthName: string) => {
    setExpandedMonth(expandedMonth === monthName ? null : monthName);
  };

  const filteredMonths = monthsData.map((month) => ({
    ...month,
    data: month.data.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000000" : "#FFF" },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? "#B800E6" : "#B800E6"}
          />
          <Text
            style={[styles.loadingText, { color: isDarkMode ? "#FFF" : "#000" }]}
          >
            Loading outlines...
          </Text>
        </View>
        <BottomTabNavigation />
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: isDarkMode ? "#FFF" : "#000" }]}>
          Outlines
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              borderColor: isDarkMode ? "#FFF" : "#000",
              backgroundColor: isDarkMode ? "#1a1a1a" : "#FFF",
            },
          ]}
        >
          <Feather name="search" size={19} color={isDarkMode ? "#666" : "#999"} />

          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? "#FFF" : "#000" }]}
            placeholder="Search"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.monthsContainer}>
          {filteredMonths.map((month) => (
            <View key={month.name}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => toggleMonth(month.name)}
              >
                <Text style={styles.monthButtonText}>{month.name}</Text>
                <MaterialIcons
                  name={
                    expandedMonth === month.name ? "expand-less" : "expand-more"
                  }
                  size={32}
                  color="#FFF"
                  weight="900"
                />
              </TouchableOpacity>

              {expandedMonth === month.name && (
                <View style={styles.cardsContainer}>
                  {month.data.length > 0 ? (
                    month.data.map((item) => {
                      // Responsive sizing for smaller screens
                      const isSmallScreen = width < 380;
                      const titleSize = isSmallScreen ? 14 : 16;
                      const textSize = isSmallScreen ? 11 : 13;
                      const badgeTextSize = isSmallScreen ? 10 : 12;
                      const imageSize = isSmallScreen ? 80 : 100;

                      return (
                      <TouchableOpacity
                        key={item._id}
                        activeOpacity={0.7}
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                            borderColor: isDarkMode ? "#ffffff" : "#000000",
                          },
                        ]}
                      >
                        {/* Image on Left */}
                        {item.imageUrl && (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={[
                              styles.cardImage,
                              { width: imageSize, height: imageSize },
                            ]}
                          />
                        )}

                        {/* Content on Right */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          {/* Title */}
                          <Text
                            numberOfLines={3}
                            style={[
                              styles.cardTitle,
                              {
                                color: isDarkMode ? "#ffffff" : "#000000",
                                fontSize: titleSize,
                              },
                            ]}
                          >
                            {item.title}
                          </Text>

                          {/* Scripture References */}
                          {item.text && (
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.scriptureRef,
                                {
                                  color: isDarkMode ? "#b0b0b0" : "#000000",
                                  fontSize: textSize,
                                },
                              ]}
                            >
                              {item.text}
                            </Text>
                          )}

                          {/* Theme Badge and Date Row */}
                          <View style={styles.themeDateRowCard}>
                            {item.theme && (
                              <View style={styles.themeBadgeCard}>
                                <Text 
                                  numberOfLines={1}
                                  style={[
                                    styles.themeBadgeTextCard,
                                    { fontSize: badgeTextSize },
                                  ]}
                                >
                                  {item.theme}
                                </Text>
                              </View>
                            )}
                            {item.date && (
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.dateTextCard,
                                  {
                                    color: isDarkMode ? "#b0b0b0" : "#000000",
                                    fontSize: badgeTextSize,
                                  },
                                ]}
                              >
                                {item.date}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text
                        style={[
                          styles.emptyText,
                          { color: isDarkMode ? "#999" : "#666" },
                        ]}
                      >
                        No outlines available yet
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

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
  subtitle: {
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 20,
    fontFamily: "Poppins_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 29,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  monthsContainer: {
    gap: 12,
    marginBottom: 80,
  },
  monthButton: {
    backgroundColor: "#B800E6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
  },
  cardsContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#1a1a1a",
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: "cover",
    flexShrink: 0,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 10,
    fontFamily: "Poppins_700Bold",
    lineHeight: 20,
    color: "#ffffff",
  },
  scriptureRef: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginBottom: 12,
    lineHeight: 18,
  },
  themeDateRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  themeBadgeCard: {
    backgroundColor: "#B800E6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  themeBadgeTextCard: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "Poppins_700Bold",
    fontStyle: "italic",
  },
  dateTextCard: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#b0b0b0",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  themeDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  themeBadge: {
    backgroundColor: "#B800E6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  themeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "Poppins_600SemiBold",
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  memoryVerse: {
    fontSize: 13,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
    lineHeight: 18,
  },
  references: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    fontFamily: "Poppins_600SemiBold",
  },
  sectionText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
  },
  mainPoint: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#B800E6",
    paddingVertical: 8,
  },
  pointTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "Poppins_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
});