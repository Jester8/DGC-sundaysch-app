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

// Helper function to parse date strings like "January 4", "January 11", etc.
const parseManualDate = (monthName: string, dateString: string): Date | null => {
  try {
    const cleanDateString = dateString.replace(/(\d+)(st|nd|rd|th)/g, '$1');
    const dateStr = `${monthName} ${cleanDateString} ${new Date().getFullYear()}`;
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try alternative parsing
      const match = dateString.match(/\d+/);
      if (match) {
        const day = parseInt(match[0], 10);
        const monthIndex = months.indexOf(monthName);
        if (monthIndex !== -1 && day >= 1 && day <= 31) {
          return new Date(new Date().getFullYear(), monthIndex, day);
        }
      }
      return null;
    }
    
    return date;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

// Function to check if a manual should be unlocked based on current date
// Teacher Preview: Unlocks 4 days after the manual's date
const isManualUnlocked = (month: string, dateString: string): boolean => {
  console.log("Manual unlock check:", {
    month: month,
    date: dateString,
    isJanuary: month === "January",
    dateString: dateString
  });
  
  // If it's not January, always unlocked
  if (month !== "January") {
    return true;
  }
  
  // Get the manual's date
  const manualDate = parseManualDate(month, dateString);
  if (!manualDate) {
    console.log("Could not parse date, defaulting to locked:", dateString);
    return false;
  }
  
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the manual date at midnight
  const manualDateAtMidnight = new Date(manualDate);
  manualDateAtMidnight.setHours(0, 0, 0, 0);
  
  // Special rule: January 4th is always unlocked (for testing/legacy)
  if (manualDateAtMidnight.getMonth() === 0 && manualDateAtMidnight.getDate() === 4) {
    console.log("January 4th is always unlocked");
    return true;
  }
  
  // Teacher preview: Manual unlocks 4 DAYS AFTER the manual's date
  // Example: January 11th manual unlocks on January 8th (4 days before January 11th)
  const teacherPreviewDate = new Date(manualDateAtMidnight);
  teacherPreviewDate.setDate(teacherPreviewDate.getDate() - 4); // 4 days before
  
  console.log("Teacher preview unlock check:", {
    manualDate: manualDateAtMidnight.toDateString(),
    teacherPreviewDate: teacherPreviewDate.toDateString(),
    today: today.toDateString(),
    isUnlockedForTeachers: today >= teacherPreviewDate
  });
  
  // Unlock for teachers 4 days before the actual date
  return today >= teacherPreviewDate;
};

// NEW: Function to get the next manual to unlock (for display)
// Shows 7 days after previous date
const getNextUnlockDate = (monthData: MonthData[]): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find January 4th date
  const january4th = new Date(today.getFullYear(), 0, 4); // January 4th
  
  // Find all January dates
  const januaryData = monthData.find(m => m.name === "January")?.data || [];
  
  // Sort January dates by their actual dates
  const januaryDates: Date[] = [];
  
  januaryData.forEach(item => {
    const manualDate = parseManualDate(item.month, item.date);
    if (manualDate) {
      const manualDateAtMidnight = new Date(manualDate);
      manualDateAtMidnight.setHours(0, 0, 0, 0);
      januaryDates.push(manualDateAtMidnight);
    }
  });
  
  // Sort dates
  januaryDates.sort((a, b) => a.getTime() - b.getTime());
  
  // Find the next date after January 4th that hasn't passed the teacher preview unlock
  for (const date of januaryDates) {
    if (date.getMonth() === 0 && date.getDate() === 4) {
      continue; // Skip January 4th (already unlocked)
    }
    
    const teacherPreviewDate = new Date(date);
    teacherPreviewDate.setDate(teacherPreviewDate.getDate() - 4); // 4 days before
    
    if (today < teacherPreviewDate) {
      // This manual hasn't unlocked yet for teachers
      // Display will show 7 days after January 4th = January 11th
      const displayDate = new Date(january4th);
      displayDate.setDate(displayDate.getDate() + 7); // 7 days after January 4th
      
      return displayDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  
  // If all manuals are unlocked or no January data
  return null;
};

// NEW: Function to get the actual teacher preview date for display
const getTeacherPreviewDate = (monthData: MonthData[]): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find all January dates
  const januaryData = monthData.find(m => m.name === "January")?.data || [];
  
  // Sort January dates by their actual dates
  const januaryDates: { date: Date, item: OutlineItem }[] = [];
  
  januaryData.forEach(item => {
    const manualDate = parseManualDate(item.month, item.date);
    if (manualDate) {
      const manualDateAtMidnight = new Date(manualDate);
      manualDateAtMidnight.setHours(0, 0, 0, 0);
      januaryDates.push({ date: manualDateAtMidnight, item });
    }
  });
  
  // Sort dates
  januaryDates.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Find the next manual that will unlock for teachers
  for (const { date, item } of januaryDates) {
    if (date.getMonth() === 0 && date.getDate() === 4) {
      continue; // Skip January 4th (already unlocked)
    }
    
    const teacherPreviewDate = new Date(date);
    teacherPreviewDate.setDate(teacherPreviewDate.getDate() - 4); // 4 days before
    
    if (today < teacherPreviewDate) {
      // Found the next manual that will unlock
      const teacherPreviewDisplay = teacherPreviewDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
      
      const actualDate = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
      
      return `${teacherPreviewDisplay} (for ${actualDate} manual)`;
    }
  }
  
  return null;
};

export default function Outline() {
  const { isDarkMode } = useNavigation();
  const router = useRouter();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [nextDisplayDate, setNextDisplayDate] = useState<string | null>(null);
  const [teacherPreviewDate, setTeacherPreviewDate] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadOutlineData();
  }, []);

  useEffect(() => {
    if (monthsData.length > 0) {
      const displayDate = getNextUnlockDate(monthsData);
      const previewDate = getTeacherPreviewDate(monthsData);
      setNextDisplayDate(displayDate);
      setTeacherPreviewDate(previewDate);
    }
  }, [monthsData]);

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
        
        // Log January manuals for debugging
        const januaryData = formattedMonths.find(m => m.name === "January")?.data || [];
        console.log("=== ALL JANUARY MANUALS ===");
        januaryData.forEach(item => {
          const manualDate = parseManualDate(item.month, item.date);
          if (manualDate) {
            const teacherPreviewDate = new Date(manualDate);
            teacherPreviewDate.setDate(teacherPreviewDate.getDate() - 4);
            
            const isUnlocked = isManualUnlocked(item.month, item.date);
            console.log({
              title: item.title,
              date: item.date,
              parsedDate: manualDate.toDateString(),
              teacherPreviewDate: teacherPreviewDate.toDateString(),
              isUnlocked: isUnlocked,
              isJanuary4th: manualDate.getDate() === 4 && manualDate.getMonth() === 0
            });
          }
        });
        console.log("=== END JANUARY MANUALS ===");
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
      const isUnlocked = isManualUnlocked(item.month, item.date);
      console.log("Manual clicked:", {
        title: item.title,
        month: item.month,
        date: item.date,
        isUnlocked: isUnlocked,
        isJanuary4th: item.month === "January" && item.date.includes("4")
      });
      
      if (!isUnlocked) {
        // Show locked message or modal here if needed
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
    const isUnlocked = isManualUnlocked(item.month, item.date);

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
  {/* Unlock Schedule Information - UPDATED WITH DARK MODE */}
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
            
            {/* Next Display Date (7 days after Jan 4th) */}
            {nextDisplayDate && (
              <Text style={[styles.scheduleText, { color: isDarkMode ? "#CCCCCC" : "#666" }]}>
                Next manual: <Text style={[styles.highlightText, { color: "#9d00d4" }]}>{nextDisplayDate}</Text>
              </Text>
            )}
            
            
            
            
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
                        const isUnlocked = isManualUnlocked(item.month, item.date);

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