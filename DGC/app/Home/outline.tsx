import { useState, useEffect, useMemo, useCallback } from "react";
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
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://dgc-backend.onrender.com";
const OUTLINE_STORAGE_KEY = "outline_all_manuals";

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
  coverBannerImg?: string;
}

interface MonthData {
  name: string;
  data: OutlineItem[];
}

interface SearchResult extends OutlineItem {
  monthName: string;
}

const getResponsiveSize = (size: number): number => {
  return size;
};

// Main unlock function - ONLY Jan 4th unlocked, rest every 4 days after
const isManualUnlocked = (month: string, dateString: string, order: number = 0): boolean => {
  console.log("Unlock check:", {
    month: month,
    date: dateString,
    order: order
  });
  
  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  try {
    // Check if this is January 4th specifically
    const lowerDate = dateString.toLowerCase();
    if (month === "January") {
      // Check for January 4th in various formats
      if (lowerDate.includes("4th") || lowerDate === "4" || 
          lowerDate.includes("fourth") || dateString.includes("4")) {
        console.log("✓ January 4th - Always unlocked");
        return true;
      }
      
      // Also check for numeric 4 in the date
      const numbers = dateString.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          if (parseInt(num, 10) === 4) {
            console.log("✓ January 4th (found numeric 4) - Always unlocked");
            return true;
          }
        }
      }
    }
    
    // For all other manuals, check 4-day unlock schedule starting from Jan 4th
    
    // First, we need to determine this manual's position in the sequence
    // We'll use a combination of month, date, and order
    
    // Get month index (0 = January)
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) {
      console.log("Invalid month:", month);
      return false; // Lock invalid months
    }
    
    // Try to extract day number from date string
    let manualDay = 0;
    const numbers = dateString.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      manualDay = parseInt(numbers[0], 10);
    }
    
    // If we couldn't extract day, use order as fallback
    if (manualDay === 0 && order > 0) {
      manualDay = order;
    }
    
    if (manualDay === 0) {
      console.log("Could not determine day for:", dateString);
      return false; // Lock if we can't determine
    }
    
    // Create date object for this manual
    const manualDate = new Date(currentYear, monthIndex, manualDay);
    
    // Base unlock date: January 4th, 2024
    const baseUnlockDate = new Date(currentYear, 0, 4, 0, 0, 0, 0); // Jan 4th
    
    // Calculate days difference from January 4th
    const daysFromBase = Math.floor((manualDate.getTime() - baseUnlockDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Manuals before Jan 4th should be locked
    if (daysFromBase < 0) {
      console.log(`✗ Locking ${month} ${manualDay} (before Jan 4th)`);
      return false;
    }
    
    // Calculate which 4-day cycle this manual belongs to
    // Since Jan 4th is cycle 0 (already handled above), Jan 5th-7th would be cycle 0 (locked)
    // Jan 8th-11th would be cycle 1 (unlocks 4 days after Jan 4th)
    // Jan 12th-15th would be cycle 2 (unlocks 8 days after Jan 4th)
    const unlockCycle = Math.floor(daysFromBase / 4) + 1;
    
    // Calculate unlock date: Jan 4th + (unlockCycle * 4 days)
    const unlockDate = new Date(baseUnlockDate);
    unlockDate.setDate(baseUnlockDate.getDate() + (unlockCycle * 4));
    
    // For debugging
    console.log("4-day unlock calculation:", {
      month: month,
      manualDay: manualDay,
      manualDate: manualDate.toDateString(),
      daysFromBase: daysFromBase,
      unlockCycle: unlockCycle,
      unlockDate: unlockDate.toDateString(),
      currentDate: currentDate.toDateString(),
      isUnlocked: currentDate >= unlockDate
    });
    
    // Check if current date is on or after the unlock date
    if (currentDate >= unlockDate) {
      console.log(`✓ Unlocking ${month} ${manualDay} (unlocked on ${unlockDate.toDateString()})`);
      return true;
    } else {
      console.log(`✗ Locking ${month} ${manualDay} (unlocks on ${unlockDate.toDateString()})`);
      return false;
    }
    
  } catch (error) {
    console.error("Error in unlock logic:", error);
    return false; // Lock on error
  }
};

// Function to get next unlock date for display
const getNextUnlockDate = (): string | null => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Base unlock date: January 4th
  const baseUnlockDate = new Date(currentYear, 0, 4, 0, 0, 0, 0);
  
  // Calculate days since Jan 4th
  const daysSinceBase = Math.floor((currentDate.getTime() - baseUnlockDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find the next 4-day cycle
  let nextUnlockCycle = 0;
  
  if (daysSinceBase >= 0) {
    // If we're past Jan 4th, find next cycle
    nextUnlockCycle = Math.floor(daysSinceBase / 4) + 1;
  } else {
    // If we're before Jan 4th, first unlock is Jan 4th
    return "January 4, " + currentYear;
  }
  
  const nextUnlockDate = new Date(baseUnlockDate);
  nextUnlockDate.setDate(baseUnlockDate.getDate() + (nextUnlockCycle * 4));
  
  // If next unlock date is today or in the past, find the next one
  if (nextUnlockDate <= currentDate) {
    nextUnlockCycle++;
    nextUnlockDate.setDate(baseUnlockDate.getDate() + (nextUnlockCycle * 4));
  }
  
  return nextUnlockDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

export default function Outline() {
  const { isDarkMode } = useNavigation();
  const router = useRouter();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [nextUnlockDate, setNextUnlockDate] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadOutlineData();
  }, []);

  useEffect(() => {
    // Update next unlock date
    const date = getNextUnlockDate();
    setNextUnlockDate(date);
    
    const interval = setInterval(() => {
      const newDate = getNextUnlockDate();
      setNextUnlockDate(newDate);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const saveToStorage = async (data: MonthData[]) => {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(OUTLINE_STORAGE_KEY, jsonData);
      console.log("Outline data saved to storage successfully");
    } catch (error) {
      console.error("Error saving outline data to storage:", error);
    }
  };

  const loadFromStorage = async () => {
    try {
      const jsonData = await AsyncStorage.getItem(OUTLINE_STORAGE_KEY);
      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log("Outline data loaded from storage");
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error loading outline data from storage:", error);
      return null;
    }
  };

  const loadOutlineData = async () => {
    try {
      setLoading(true);

      const cachedData = await loadFromStorage();
      if (cachedData && cachedData.length > 0) {
        setMonthsData(cachedData);
      }

      const response = await fetch(`${API_BASE_URL}/api/manuals/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const formattedMonths: MonthData[] = months.map((month) => ({
          name: month,
          data: data.data[month] || [],
        }));

        await saveToStorage(formattedMonths);
        setMonthsData(formattedMonths);
        
        // Log unlock status for all manuals
        console.log("=== UNLOCK STATUS ===");
        formattedMonths.forEach(month => {
          if (month.data.length > 0) {
            console.log(`\n--- ${month.name} ---`);
            month.data.forEach(item => {
              const isUnlocked = isManualUnlocked(item.month, item.date, item.order);
              console.log({
                title: item.title,
                date: item.date,
                month: item.month,
                isUnlocked: isUnlocked ? "UNLOCKED" : "LOCKED"
              });
            });
          }
        });
        console.log("=== END UNLOCK STATUS ===");
      }
    } catch (error) {
      console.error("Error fetching months:", error);

      const cachedData = await loadFromStorage();
      if (!cachedData || cachedData.length === 0) {
        const emptyMonths: MonthData[] = months.map((month) => ({
          name: month,
          data: [],
        }));
        setMonthsData(emptyMonths);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = useCallback((monthName: string) => {
    setExpandedMonth((prev) => (prev === monthName ? null : monthName));
  }, []);

  const handleCardPress = useCallback(
    (item: OutlineItem) => {
      const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);
      console.log("Manual clicked:", {
        title: item.title,
        month: item.month,
        date: item.date,
        isUnlocked: isUnlocked
      });
      
      if (!isUnlocked) {
        console.log("Manual is locked");
        return;
      }

      // For January 4th, use special component
      if (item.month === "January" && (item.date.includes("4") || item.date.includes("4th"))) {
        router.push({
          pathname: "/Home/January4ManualDetail",
          params: { manual: JSON.stringify(item) },
        });
      } else {
        // For all other manuals
        router.push({
          pathname: "/Home/ManualDetail",
          params: { manual: JSON.stringify(item) },
        });
      }
      
      setShowSearchResults(false);
      setSearchText("");
    },
    [router]
  );

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];

    const query = searchText.toLowerCase();
    const results: SearchResult[] = [];

    monthsData.forEach((month) => {
      month.data.forEach((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const themeMatch = item.theme.toLowerCase().includes(query);
        const textMatch = item.text.toLowerCase().includes(query);
        const dateMatch = item.date.toLowerCase().includes(query);
        const introMatch = item.introduction.toLowerCase().includes(query);
        const memoryVerseMatch = item.memoryVerse.toLowerCase().includes(query);
        const classDiscussionMatch = item.classDiscussion.toLowerCase().includes(query);
        const mainPointsMatch = item.mainPoints.some(
          (point) =>
            point.title.toLowerCase().includes(query) ||
            point.description.toLowerCase().includes(query)
        );

        if (
          titleMatch ||
          themeMatch ||
          textMatch ||
          dateMatch ||
          introMatch ||
          memoryVerseMatch ||
          classDiscussionMatch ||
          mainPointsMatch
        ) {
          results.push({ ...item, monthName: month.name });
        }
      });
    });

    return results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query) ? 2 : 0;
      const aTheme = a.theme.toLowerCase().includes(query) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(query) ? 2 : 0;
      const bTheme = b.theme.toLowerCase().includes(query) ? 1 : 0;
      return bTitle + bTheme - (aTitle + aTheme);
    });
  }, [monthsData, searchText]);

  const filteredMonths = useMemo(
    () =>
      monthsData.map((month) => ({
        ...month,
        data: month.data.filter((item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase())
        ),
      })),
    [monthsData, searchText]
  );

  const renderSearchResultCard = ({ item }: { item: SearchResult }) => {
    const img = item.coverBannerImg || item.imageUrl || "https://via.placeholder.com/200";
    const isSmallScreen = width < 380;
    const imageSize = isSmallScreen ? 60 : 80;
    const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);

    return (
      <TouchableOpacity
        activeOpacity={isUnlocked ? 0.7 : 1}
        onPress={() => handleCardPress(item)}
        style={[
          styles.searchResultCard,
          {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: getResponsiveSize(12),
            paddingHorizontal: getResponsiveSize(12),
            paddingVertical: getResponsiveSize(10),
            borderWidth: 1,
            borderColor: isDarkMode ? "#444444" : "#cccccc",
            borderRadius: getResponsiveSize(12),
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
            elevation: 2,
          },
        ]}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: img }}
            style={[styles.searchResultImage, { 
              width: imageSize, 
              height: imageSize,
            }]}
            onError={() => console.log("Image failed:", img)}
          />
          {!isUnlocked && (
            <BlurView
              intensity={90}
              tint={isDarkMode ? "dark" : "light"}
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 8,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <MaterialIcons name="lock" size={28} color={isDarkMode ? "#FFF" : "#000"} />
            </BlurView>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={2}
            style={[styles.searchResultTitle, { 
              color: isUnlocked ? (isDarkMode ? "#FFF" : "#000") : (isDarkMode ? "#888" : "#999") 
            }]}
          >
            {item.title}
          </Text>
          {item.text && (
            <Text
              numberOfLines={1}
              style={[styles.searchResultScripture, { 
                color: isUnlocked ? (isDarkMode ? "#DDD" : "#444") : (isDarkMode ? "#666" : "#AAA") 
              }]}
            >
              {item.text}
            </Text>
          )}
          <View style={styles.searchResultMeta}>
            {item.theme && (
              <Text style={[
                styles.searchResultTheme,
                { 
                  backgroundColor: isUnlocked ? "#707070ff" : (isDarkMode ? "#555555" : "#AAAAAA"),
                }
              ]}>
                {item.theme}
              </Text>
            )}
            {item.date && (
              <Text style={[styles.searchResultDate, { 
                color: isUnlocked ? (isDarkMode ? "#999" : "#666") : (isDarkMode ? "#777" : "#999") 
              }]}>
                {item.date}
              </Text>
            )}
            <Text style={[styles.searchResultMonth, { 
              color: isUnlocked ? (isDarkMode ? "#999" : "#666") : (isDarkMode ? "#777" : "#999") 
            }]}>
              {item.monthName}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000000" : "#FFF" },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#ffffffff" : "#010002ff"} />
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
          Manuals
        </Text>
        
        {/* Unlock Schedule Information */}
        <View style={[
          styles.scheduleContainer,
          { 
            backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5",
            borderLeftColor: "#9d00d4"
          }
        ]}>
          <MaterialIcons name="schedule" size={20} color="#9d00d4" />
          <View style={styles.scheduleTextContainer}>
            <Text style={[styles.scheduleTitle, { color: isDarkMode ? "#FFFFFF" : "#333" }]}>
              Manual Release Schedule
            </Text>
            
            <Text style={[styles.scheduleText, { color: isDarkMode ? "#CCCCCC" : "#666" }]}>
              New manuals unlock every 7 days
            </Text>
            
           
            
           
          </View>
        </View>

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
            placeholder="Search manuals, themes, verses..."
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setShowSearchResults(text.trim().length > 0);
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchText("");
              setShowSearchResults(false);
            }}>
              <MaterialIcons name="close" size={20} color={isDarkMode ? "#666" : "#999"} />
            </TouchableOpacity>
          )}
        </View>

        {showSearchResults && searchResults.length > 0 && (
          <View
            style={[
              styles.searchResultsContainer,
              { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" },
            ]}
          >
            <Text style={[styles.searchResultsTitle, { color: isDarkMode ? "#CCC" : "#666" }]}>
              Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResultCard}
              keyExtractor={(item) => `${item.monthName}-${item._id || item.id}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
                    marginVertical: 8,
                  }}
                />
              )}
            />
          </View>
        )}

      
        {showSearchResults && searchResults.length === 0 && searchText.trim().length > 0 && (
          <View
            style={[
              styles.noResultsContainer,
              { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" },
            ]}
          >
            <MaterialIcons
              name="search-off"
              size={40}
              color={isDarkMode ? "#666" : "#999"}
            />
            <Text style={[styles.noResultsText, { color: isDarkMode ? "#888" : "#666" }]}>
              No manuals found
            </Text>
            <Text style={[styles.noResultsSubtext, { color: isDarkMode ? "#666" : "#999" }]}>
              Try searching with different keywords
            </Text>
          </View>
        )}

        {!showSearchResults && (
          <View style={styles.monthsContainer}>
            {filteredMonths.map((month) => (
              <View key={month.name}>
                <TouchableOpacity
                  style={styles.monthButton}
                  onPress={() => toggleMonth(month.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.monthButtonText}>{month.name}</Text>
                  <MaterialIcons
                    name={expandedMonth === month.name ? "expand-less" : "expand-more"}
                    size={32}
                    color="#FFF"
                  />
                </TouchableOpacity>

                {expandedMonth === month.name && (
                  <View style={styles.cardsContainer}>
                    {month.data.length > 0 ? (
                      month.data.map((item, index) => {
                        const img =
                          item.coverBannerImg ||
                          item.imageUrl ||
                          "https://via.placeholder.com/200";

                        const isSmallScreen = width < 380;
                        const imageSize = isSmallScreen ? 80 : 100;
                        const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);

                        const uniqueKey = `${month.name}-${item._id || item.id}-${item.order}-${index}`;

                        return (
                          <TouchableOpacity
                            key={uniqueKey}
                            activeOpacity={isUnlocked ? 0.7 : 1}
                            onPress={() => handleCardPress(item)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: getResponsiveSize(12),
                              paddingHorizontal: getResponsiveSize(12),
                              paddingVertical: getResponsiveSize(10),
                              borderWidth: 1,
                              borderColor: isDarkMode ? "#444444" : "#cccccc",
                              borderRadius: getResponsiveSize(12),
                              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                              elevation: 2,
                            }}
                          >
                            <View style={{ position: "relative" }}>
                              <Image
                                source={{ uri: img }}
                                style={[styles.cardImage, { 
                                  width: imageSize, 
                                  height: imageSize,
                                }]}
                                onError={(e) =>
                                  console.log("Image failed:", img, e.nativeEvent)
                                }
                              />
                              {!isUnlocked && (
                                <BlurView
                                  intensity={90}
                                  tint={isDarkMode ? "dark" : "light"}
                                  style={[
                                    StyleSheet.absoluteFillObject,
                                    {
                                      borderRadius: 12,
                                      overflow: "hidden",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    },
                                  ]}
                                >
                                  <MaterialIcons name="lock" size={32} color={isDarkMode ? "#FFF" : "#000"} />
                                </BlurView>
                              )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text
                                numberOfLines={3}
                                style={[styles.cardTitle, { 
                                  color: isUnlocked ? (isDarkMode ? "#FFF" : "#000") : (isDarkMode ? "#888" : "#999") 
                                }]}
                              >
                                {item.title}
                              </Text>
                              {item.text && (
                                <Text
                                  numberOfLines={1}
                                  style={[styles.scriptureRef, { 
                                    color: isUnlocked ? (isDarkMode ? "#DDD" : "#444") : (isDarkMode ? "#666" : "#AAA") 
                                  }]}
                                >
                                  {item.text}
                                </Text>
                              )}
                              <View style={styles.themeDateRowCard}>
                                {item.theme && (
                                  <View style={[styles.themeBadgeCard, { 
                                    backgroundColor: isUnlocked ? "#585858ff" : (isDarkMode ? "#444444" : "#AAAAAA"),
                                  }]}>
                                    <Text numberOfLines={1} style={styles.themeBadgeTextCard}>
                                      {item.theme}
                                    </Text>
                                  </View>
                                )}
                                {item.date && (
                                  <Text
                                    numberOfLines={1}
                                    style={[styles.dateTextCard, { 
                                      color: isUnlocked ? (isDarkMode ? "#CCC" : "#333") : (isDarkMode ? "#777" : "#999")
                                    }]}
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
                        <Text style={[styles.emptyText, { color: isDarkMode ? "#888" : "#777" }]}>
                          No manuals available yet
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  subtitle: { fontSize: 24, fontWeight: "700", fontStyle: "italic", marginBottom: 12 },
  scheduleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    gap: 12,
  },
  scheduleTextContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  scheduleText: {
    fontSize: 13,
    marginBottom: 4,
  },
  highlightText: {
    fontWeight: "bold",
  },
  scheduleNote: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
  },
  searchContainer: { flexDirection: "row", alignItems: "center", borderWidth: 0.7, borderRadius: 29, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14 },
  searchResultsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: 500,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  searchResultCard: {
    marginBottom: 8,
  },
  searchResultImage: {
    borderRadius: 8,
    resizeMode: "cover",
  },
  searchResultTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  searchResultScripture: {
    fontSize: 12,
    marginBottom: 8,
  },
  searchResultMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  searchResultTheme: {
    color: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "600",
    overflow: "hidden",
  },
  searchResultDate: {
    fontSize: 10,
    fontWeight: "500",
  },
  searchResultMonth: {
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
  },
  noResultsContainer: {
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 13,
    marginTop: 6,
  },
  monthsContainer: { gap: 12, marginBottom: 80 },
  monthButton: { backgroundColor: "#444444", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  cardsContainer: { gap: 12, marginTop: 12, marginBottom: 12 },
  cardImage: { borderRadius: 12, resizeMode: "cover" },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  scriptureRef: { fontSize: 13, marginBottom: 12 },
  themeDateRowCard: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  themeBadgeCard: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  themeBadgeTextCard: { fontSize: 12, fontWeight: "700", color: "#f0f0f0ff", fontStyle: "italic" },
  dateTextCard: { fontSize: 12 },
  emptyContainer: { paddingVertical: 16, alignItems: "center" },
  emptyText: { fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});