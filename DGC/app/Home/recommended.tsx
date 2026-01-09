import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  PanResponder,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";

const API_BASE_URL = "https://dgc-backend.onrender.com";
const STORAGE_KEY = "recommended_manuals";
const LAST_READ_KEY = "last_read_manual";
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface ManualItem {
  _id: string;
  id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  month: string;
  date: string;
  coverBannerImg?: string;
  text?: string;
  introduction?: string;
  mainPoints?: Array<{
    title: string;
    description: string;
    references: string[];
  }>;
  classDiscussion?: string;
  conclusion?: string;
  week?: number;
  order?: number;
}

interface SkeletonLoaderProps {
  isDarkMode: boolean;
  itemSize: { width: number };
  scale: number;
}

const SkeletonLoader = ({ isDarkMode, itemSize, scale }: SkeletonLoaderProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: itemSize.width * 0.04 * scale,
      paddingHorizontal: itemSize.width * 0.04 * scale,
      paddingVertical: itemSize.width * 0.03 * scale,
      borderWidth: 1,
      borderColor: isDarkMode ? "#333333" : "#e0e0e0",
      borderRadius: itemSize.width * 0.05 * scale,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
    }}
  >
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: itemSize.width * 0.04 * scale,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02 * scale,
          marginBottom: itemSize.width * 0.03 * scale,
          width: "80%",
        }}
      />
      <View
        style={{
          height: itemSize.width * 0.032 * scale,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02 * scale,
          marginBottom: itemSize.width * 0.02 * scale,
          width: "60%",
        }}
      />
      <View
        style={{
          height: itemSize.width * 0.032 * scale,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02 * scale,
          width: "50%",
        }}
      />
    </View>
  </View>
);

const ContinueReadSkeletonLoader = ({ isDarkMode, itemSize, scale }: SkeletonLoaderProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: itemSize.width * 0.05 * scale,
      paddingHorizontal: itemSize.width * 0.04 * scale,
      paddingVertical: itemSize.width * 0.03 * scale,
      borderWidth: 1,
      borderColor: isDarkMode ? "#333333" : "#e0e0e0",
      borderRadius: itemSize.width * 0.04 * scale,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
    }}
  >
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: itemSize.width * 0.04 * scale,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02 * scale,
          width: "70%",
        }}
      />
    </View>

    <View
      style={{
        width: itemSize.width * 0.08 * scale,
        height: itemSize.width * 0.08 * scale,
        borderRadius: itemSize.width * 0.02 * scale,
        backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
        marginLeft: itemSize.width * 0.04 * scale,
      }}
    />
  </View>
);

interface RecommendedProps {
  isDarkMode?: boolean;
}

// Assign global order across ALL manuals
const assignGlobalOrderToManuals = (manuals: ManualItem[]): ManualItem[] => {
  return manuals.map((manual, index) => ({
    ...manual,
    order: index + 1,
  }));
};

// Main unlock function - Based on manual ORDER, not date
const isManualUnlocked = (month: string, dateString: string, order: number = 0): boolean => {
  console.log("Recommended unlock check:", {
    month: month,
    date: dateString,
    order: order
  });
  
  // Get current date
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  try {
    // Jan 4th (order 1 or order 0) is always unlocked
    if (month === "January" && (order === 0 || order === 1)) {
      console.log("✓ January 4th (order 1) - Always unlocked");
      return true;
    }
    
    // Base unlock date: January 4th
    const baseUnlockDate = new Date(currentYear, 0, 4, 0, 0, 0, 0);
    
    if (order <= 0) {
      console.log("✗ Invalid order:", order);
      return false;
    }
    
    const daysToAdd = (order - 1) * 4;
    const unlockDate = new Date(baseUnlockDate);
    unlockDate.setDate(baseUnlockDate.getDate() + daysToAdd);
    
    // Reset time to midnight for proper date comparison
    unlockDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    console.log("Order-based unlock calculation:", {
      month: month,
      order: order,
      daysToAdd: daysToAdd,
      unlockDate: unlockDate.toDateString(),
      currentDate: currentDate.toDateString(),
      isUnlocked: currentDate >= unlockDate
    });
    
    // Check if current date is on or after the unlock date
    if (currentDate >= unlockDate) {
      console.log(`✓ Unlocking order ${order} (unlocked on ${unlockDate.toDateString()})`);
      return true;
    } else {
      console.log(`✗ Locking order ${order} (unlocks on ${unlockDate.toDateString()})`);
      return false;
    }
    
  } catch (error) {
    console.error("Error in unlock logic:", error);
    return false;
  }
};

// Get the 4 unlocked manuals to display - rotates based on current date
const getDisplayManuals = (allManuals: ManualItem[]): ManualItem[] => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const currentYear = currentDate.getFullYear();
  const baseUnlockDate = new Date(currentYear, 0, 4, 0, 0, 0, 0);
  
  // Calculate days elapsed since January 4th
  const daysElapsed = Math.floor((currentDate.getTime() - baseUnlockDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate the window: every 4 days, show the next 4 manuals
  const windowIndex = Math.floor(daysElapsed / 4);
  
  console.log("=== DISPLAY WINDOW CALCULATION ===");
  console.log({
    currentDate: currentDate.toDateString(),
    daysElapsed: daysElapsed,
    windowIndex: windowIndex,
    startOrder: windowIndex + 1,
    endOrder: windowIndex + 4
  });
  
  // Get 4 manuals starting from the calculated window
  const displayManuals = allManuals.filter(manual => {
    const order = manual.order || 0;
    return order > windowIndex && order <= windowIndex + 4;
  });
  
  console.log("=== MANUALS TO DISPLAY ===");
  displayManuals.forEach(m => {
    console.log({
      title: m.title,
      order: m.order,
      month: m.month,
      date: m.date
    });
  });
  console.log("=== END DISPLAY MANUALS ===");
  
  return displayManuals;
};

export default function Recommended({ isDarkMode: propIsDarkMode }: RecommendedProps) {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { isDarkMode: contextIsDarkMode } = useNavigation();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode;

  const [loading, setLoading] = useState(true);
  const [recommendedData, setRecommendedData] = useState<ManualItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastReadManual, setLastReadManual] = useState<ManualItem | null>(null);
  const [loadingLastRead, setLoadingLastRead] = useState(true);
  const [scale, setScale] = useState(1);
  
  const lastDistanceRef = useRef(0);
  const panResponderRef = useRef<any>(null);

  // Pinch to zoom gesture handler
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt) => {
        const touches = evt.nativeEvent.touches;
        return touches.length === 2;
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (lastDistanceRef.current > 0) {
            const scaleDelta = distance / lastDistanceRef.current;
            const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * scaleDelta));
            setScale(newScale);
          }

          lastDistanceRef.current = distance;
        }
      },
      onPanResponderRelease: () => {
        lastDistanceRef.current = 0;
      },
    });
  }, [scale]);

  useEffect(() => {
    loadRecommendedData();
    loadLastReadManual();
  }, []);

  const saveToStorage = async (data: ManualItem[]) => {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(STORAGE_KEY, jsonData);
      console.log("Data saved to storage successfully");
    } catch (err) {
      console.error("Error saving data to storage:", err);
    }
  };

  const loadFromStorage = async () => {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonData) {
        const data = JSON.parse(jsonData);
        console.log("Data loaded from storage");
        return data;
      }
      return null;
    } catch (err) {
      console.error("Error loading data from storage:", err);
      return null;
    }
  };

  const saveLastReadManual = async (manual: ManualItem) => {
    try {
      const jsonData = JSON.stringify(manual);
      await AsyncStorage.setItem(LAST_READ_KEY, jsonData);
      setLastReadManual(manual);
      console.log("Last read manual saved successfully");
    } catch (err) {
      console.error("Error saving last read manual:", err);
    }
  };

  const loadLastReadManual = async () => {
    try {
      setLoadingLastRead(true);
      const jsonData = await AsyncStorage.getItem(LAST_READ_KEY);
      if (jsonData) {
        const manual = JSON.parse(jsonData);
        setLastReadManual(manual);
        console.log("Last read manual loaded");
      }
    } catch (err) {
      console.error("Error loading last read manual:", err);
    } finally {
      setLoadingLastRead(false);
    }
  };

  const loadRecommendedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch fresh data from backend first
      const recResponse = await fetch(`${API_BASE_URL}/api/manuals/recommended`);

      if (!recResponse.ok) {
        throw new Error(`HTTP error! status: ${recResponse.status}`);
      }

      const recData = await recResponse.json();

      if (recData.success && recData.data && recData.data.length > 0) {
        console.log("Recommended data fetched:", recData.data);
        console.log("Total items from backend:", recData.data.length);
        console.log("IDs:", recData.data.map((item: any) => item._id || item.id));
        
        // Assign global order across all manuals
        const dataWithGlobalOrder = assignGlobalOrderToManuals(recData.data);
        
        // Log all manuals with their orders
        console.log("=== ALL MANUALS WITH ORDERS ===");
        dataWithGlobalOrder.forEach(item => {
          console.log({
            order: item.order,
            title: item.title,
            month: item.month,
            date: item.date
          });
        });
        console.log("=== END ALL MANUALS ===");
        
        // Save ALL data to storage
        await saveToStorage(dataWithGlobalOrder);
        
        // Get only the 4 manuals to display based on current date window
        const dataToShow = getDisplayManuals(dataWithGlobalOrder);
        setRecommendedData(dataToShow);
        
        // Log unlock status for displayed manuals
        console.log("=== RECOMMENDED UNLOCK STATUS ===");
        dataToShow.forEach(item => {
          const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);
          console.log({
            title: item.title,
            date: item.date,
            month: item.month,
            order: item.order,
            isUnlocked: isUnlocked ? "UNLOCKED" : "LOCKED"
          });
        });
        console.log("=== END RECOMMENDED UNLOCK STATUS ===");
      } else {
        throw new Error("No data from backend");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      
      // Fall back to cached data if fetch fails
      const cachedData = await loadFromStorage();
      if (cachedData && cachedData.length > 0) {
        console.log("Using cached data, total items:", cachedData.length);
        const dataWithGlobalOrder = assignGlobalOrderToManuals(cachedData);
        const dataToShow = getDisplayManuals(dataWithGlobalOrder);
        setRecommendedData(dataToShow);
      } else {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Improved responsive size calculation
  const getResponsiveSize = (baseSize: number) => {
    // Base width for mobile (iPhone 375)
    const baseWidth = 375;
    
    // Calculate scale factor
    let scaleFactor = width / baseWidth;
    
    // For tablets, make the scaling less aggressive
    if (width > 768) { // Tablet
      // Cap the scale factor for tablets
      scaleFactor = Math.min(scaleFactor, 1.2);
      // Make fonts smaller on tablets
      return baseSize * 0.8 * scaleFactor;
    } else if (width <= 320) { // Small phones
      return baseSize * 0.9;
    }
    
    return baseSize * scaleFactor;
  };

  // Better device detection
  const isSmallPhone = width <= 375;
  const isPhone = width <= 600;
  const isTablet = width > 768;
  const isLargeTablet = width > 1024;

  // Responsive font sizes - smaller on tablets
  const getFontSize = (baseSize: number, tabletMultiplier: number = 0.85) => {
    if (isTablet) {
      return baseSize * tabletMultiplier;
    }
    return baseSize;
  };

  // Apply responsive sizes
  const titleFontSize = getFontSize(12, 0.95);
  const versesFontSize = getFontSize(12, 0.85);
  const categoryFontSize = getFontSize(11, 0.85);
  const dateFontSize = getFontSize(11, 0.85);
  const headerFontSize = getFontSize(12, 0.9);
  const seeAllFontSize = getFontSize(12, 0.85);

  // Responsive image size
  const getImageSize = () => {
    if (isTablet) {
      return getResponsiveSize(80);
    }
    return getResponsiveSize(80);
  };

  const itemSize = {
    width: width - getResponsiveSize(32),
    imageSize: getImageSize(),
    imageHeight: getImageSize(),
  };

  const getPadding = () => {
    if (isTablet) {
      return getResponsiveSize(20);
    }
    return getResponsiveSize(16);
  };

  const handleCardPress = useCallback(
    (item: ManualItem) => {
      const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);
      console.log("Recommended manual clicked:", {
        title: item.title,
        month: item.month,
        date: item.date,
        order: item.order,
        isUnlocked: isUnlocked
      });
      
      if (!isUnlocked) {
        return;
      }

      saveLastReadManual(item);
      
      // Check if this is January 4th and route to January4ManualDetail
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
    },
    [router]
  );

  const handleSeeAll = () => {
    router.push("/Home/outline");
  };

  const handleContinueRead = useCallback(() => {
    if (lastReadManual) {
      const isUnlocked = isManualUnlocked(lastReadManual.month, lastReadManual.date, lastReadManual.order || 0);
      if (!isUnlocked) {
        return;
      }
      
      router.push({
        pathname: "/Home/ManualDetail",
        params: { manual: JSON.stringify(lastReadManual) },
      });
    }
  }, [lastReadManual, router]);

  const renderRecommendedItem = ({ item }: { item: ManualItem }) => {
    const isUnlocked = isManualUnlocked(item.month, item.date, item.order || 0);
    
    return (
      <TouchableOpacity
        activeOpacity={isUnlocked ? 0.7 : 1}
        onPress={() => handleCardPress(item)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: getResponsiveSize(12) * scale,
          paddingHorizontal: getPadding() * scale,
          paddingVertical: getResponsiveSize(10) * scale,
          borderWidth: 1,
          borderColor: isDarkMode ? "#444444" : "#cccccc",
          borderRadius: getResponsiveSize(12) * scale,
          backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          elevation: 2,
        }}
      >
        {item.coverBannerImg && (
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: item.coverBannerImg }}
              style={{
                width: itemSize.imageSize * scale,
                height: itemSize.imageHeight * scale,
                borderRadius: getResponsiveSize(10) * scale,
                marginRight: getResponsiveSize(10) * scale,
                resizeMode: "cover",
              }}
            />
            {!isUnlocked && (
              <BlurView
                intensity={90}
                tint={isDarkMode ? "dark" : "light"}
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    width: itemSize.imageSize * scale,
                    height: itemSize.imageHeight * scale,
                    borderRadius: getResponsiveSize(10) * scale,
                    marginRight: getResponsiveSize(10) * scale,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <MaterialIcons 
                  name="lock" 
                  size={isTablet ? 20 : 24}
                  color={isDarkMode ? "#FFF" : "#000"} 
                />
              </BlurView>
            )}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: titleFontSize * scale,
              fontFamily: "Poppins_600SemiBold",
              color: isUnlocked ? (isDarkMode ? "#ffffff" : "#000000") : (isDarkMode ? "#888" : "#999"),
              marginBottom: getResponsiveSize(4) * scale,
              lineHeight: titleFontSize * 1.3, 
            }}
          >
            {item.title}
          </Text>

          <Text
            numberOfLines={1}
            style={{
              fontSize: versesFontSize * scale,
              fontFamily: "Poppins_400Regular",
              color: isUnlocked ? (isDarkMode ? "#b0b0b0" : "#666666") : (isDarkMode ? "#666" : "#AAA"),
              marginBottom: getResponsiveSize(6) * scale,
            }}
          >
            {item.memoryVerse}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: getResponsiveSize(6) * scale,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: isUnlocked ? "#343035ff" : (isDarkMode ? "#555555" : "#AAAAAA"),
                paddingHorizontal: getResponsiveSize(6) * scale,
                paddingVertical: getResponsiveSize(3) * scale,
                borderRadius: getResponsiveSize(3) * scale,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: categoryFontSize * scale,
                  fontFamily: "Poppins_600SemiBold",
                  color: "#ffffff",
                }}
              >
                {item.theme}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={{
                fontSize: dateFontSize * scale,
                fontFamily: "Poppins_400Regular",
                color: isUnlocked ? (isDarkMode ? "#b0b0b0" : "#666666") : (isDarkMode ? "#777" : "#999"),
              }}
            >
              {item.date}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = getResponsiveContinueReadStyles(
    width, 
    scale, 
    isDarkMode, 
    titleFontSize, 
    getResponsiveSize,
    isTablet
  );

  return (
    <View
      style={{
        paddingHorizontal: getPadding() * scale,
        paddingVertical: getResponsiveSize(20) * scale,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
      {...panResponderRef.current?.panHandlers}
    >
      {/* Continue Last Read Section */}
      {loadingLastRead ? (
        <>
          <Text
            style={{
              fontSize: headerFontSize * scale,
              fontFamily: "Poppins_600SemiBold",
              color: isDarkMode ? "#ffffff" : "#000000",
              marginBottom: getResponsiveSize(12) * scale,
            }}
          >
            Continue Last Read
          </Text>
          <ContinueReadSkeletonLoader isDarkMode={isDarkMode} itemSize={itemSize} scale={scale} />
        </>
      ) : lastReadManual ? (
        <>
          <Text
            style={{
              fontSize: headerFontSize * scale,
              fontFamily: "Poppins_600SemiBold",
              color: isDarkMode ? "#ffffff" : "#000000",
              marginBottom: getResponsiveSize(12) * scale,
            }}
          >
            Continue Last Read
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleContinueRead}
            style={[styles.continueReadButton, { 
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff", 
              borderColor: isDarkMode ? "#444444" : "#cccccc" 
            }]}
          >
            <Text
              numberOfLines={1}
              style={[styles.continueReadText, { 
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: titleFontSize * scale,
              }]}
            >
              {lastReadManual.title}
            </Text>

            <View style={styles.continueReadArrow}>
              <Text style={styles.continueReadArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        </>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: getResponsiveSize(16) * scale,
        }}
      >
        <Text
          style={{
            fontSize: headerFontSize * scale,
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Recommended for You 
        </Text>

        <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
          <Text
            style={{
              fontSize: seeAllFontSize * scale,
              fontFamily: "Poppins_500Medium",
              color: isDarkMode ? "#ffffffff" : "#000000",
              textDecorationLine: "underline",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View
          style={{
            paddingVertical: getResponsiveSize(16) * scale,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: titleFontSize * scale,
              fontFamily: "Poppins_600SemiBold",
              color: "#FF6B6B",
              marginBottom: getResponsiveSize(8) * scale,
            }}
          >
            ⚠️ No internet connection
          </Text>
          <Text
            style={{
              fontSize: versesFontSize * scale,
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#b0b0b0" : "#666666",
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadRecommendedData}
            style={{
              marginTop: getResponsiveSize(12) * scale,
              paddingHorizontal: getResponsiveSize(16) * scale,
              paddingVertical: getResponsiveSize(8) * scale,
              backgroundColor: "#9d00d4",
              borderRadius: getResponsiveSize(8) * scale,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "Poppins_600SemiBold",
                fontSize: versesFontSize * scale,
              }}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View>
          {[1, 2, 3, 4].map((index) => (
            <SkeletonLoader
              key={`skeleton-${index}`}
              isDarkMode={isDarkMode}
              itemSize={itemSize}
              scale={scale}
            />
          ))}
        </View>
      ) : recommendedData.length > 0 ? (
        <FlatList
          data={recommendedData}
          renderItem={renderRecommendedItem}
          keyExtractor={(item, index) => {
            if (item._id) {
              return item._id.toString();
            } else if (item.id) {
              return item.id.toString();
            } else {
              return `manual-${index}`;
            }
          }}
          scrollEnabled={false}
        />
      ) : (
        <View
          style={{
            paddingVertical: getResponsiveSize(20) * scale,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: titleFontSize * scale,
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#b0b0b0" : "#666666",
            }}
          >
            No recommendations available yet
          </Text>
        </View>
      )}
    </View>
  );
}

function getResponsiveContinueReadStyles(
  width: number,
  scale: number,
  isDarkMode: boolean,
  titleFontSize: number,
  getResponsiveSize: (size: number) => number,
  isTablet: boolean
) {
  const isSmallPhone = width <= 375;

  return StyleSheet.create({
    continueReadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: getResponsiveSize(isTablet ? 16 : 20) * scale,
      paddingHorizontal: isSmallPhone ? getResponsiveSize(10) * scale : getResponsiveSize(12) * scale,
      paddingVertical: isSmallPhone ? getResponsiveSize(8) * scale : getResponsiveSize(9) * scale,
      borderWidth: 1,
      borderRadius: getResponsiveSize(12) * scale,
      shadowColor: "#000000ff",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 8,
    },
    continueReadText: {
      fontSize: isSmallPhone ? titleFontSize * 0.85 * scale : titleFontSize * scale,
      fontFamily: "Poppins_600SemiBold",
      flex: 1,
    },
    continueReadArrow: {
      width: isSmallPhone ? getResponsiveSize(26) * scale : getResponsiveSize(isTablet ? 28 : 30) * scale,
      height: isSmallPhone ? getResponsiveSize(26) * scale : getResponsiveSize(isTablet ? 28 : 30) * scale,
      borderRadius: getResponsiveSize(6) * scale,
      backgroundColor: "#ae00ffff",
      alignItems: "center",
      justifyContent: "center",
      borderColor: "#8800ccff",
      borderWidth: 1,
      marginLeft: isSmallPhone ? getResponsiveSize(10) * scale : getResponsiveSize(12) * scale,
    },
    continueReadArrowText: {
      fontSize: isSmallPhone ? getResponsiveSize(16) * scale : getResponsiveSize(isTablet ? 16 : 18) * scale,
      fontWeight: "900",
      color: "#f0f0f0ff",
    },
  });
}