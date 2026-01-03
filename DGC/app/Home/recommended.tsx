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

const isManualUnlocked = (month: string, dateString: string): boolean => {
  console.log("Recommended unlock check:", {
    month: month,
    date: dateString,
    isJanuary: month === "January",
    dateString: dateString
  });
  
  if (month === "January") {
    try {
      const lowerDate = dateString.toLowerCase();
      
      if (lowerDate.includes("4th") || lowerDate === "4") {
        console.log("Unlocking January 4th:", dateString);
        return true;
      }
      
      const numbers = dateString.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          if (parseInt(num, 10) === 4) {
            console.log("Found date 4 in:", dateString);
            return true;
          }
        }
      }
      
      console.log("Locking January (not 4th):", dateString);
      return false;
    } catch (error) {
      console.error("Error parsing date:", error);
      return false;
    }
  }
  
  return true;
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

    const cachedData = await loadFromStorage();
    if (cachedData && cachedData.length > 0) {
      // Ensure we have at least 4 items
      const dataToShow = cachedData.length >= 4 ? cachedData.slice(0, 4) : cachedData;
      setRecommendedData(dataToShow);
    }

    const recResponse = await fetch(`${API_BASE_URL}/api/manuals/recommended`);

    if (!recResponse.ok) {
      throw new Error(`HTTP error! status: ${recResponse.status}`);
    }

    const recData = await recResponse.json();

    if (recData.success && recData.data) {
      console.log("Recommended data:", recData.data);
      console.log("IDs:", recData.data.map((item: any) => item._id || item.id));
      
      // Ensure we save all data but display only 4
      await saveToStorage(recData.data);
      
      // Take first 4 items for display
      const dataToShow = recData.data.length >= 4 ? recData.data.slice(0, 4) : recData.data;
      setRecommendedData(dataToShow);
    } else {
      if (!cachedData || cachedData.length === 0) {
        setError("No recommendations available");
      }
    }
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    
    const cachedData = await loadFromStorage();
    if (!cachedData || cachedData.length === 0) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } else {
      // Use cached data but limit to 4
      const dataToShow = cachedData.length >= 4 ? cachedData.slice(0, 4) : cachedData;
      setRecommendedData(dataToShow);
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
  const titleFontSize = getFontSize(12, 0.95); // 14px mobile, ~12.6px tablet
  const versesFontSize = getFontSize(12, 0.85); // 12px mobile, ~10.2px tablet
  const categoryFontSize = getFontSize(11, 0.85); // 11px mobile, ~9.35px tablet
  const dateFontSize = getFontSize(11, 0.85); // 11px mobile, ~9.35px tablet
  const headerFontSize = getFontSize(12, 0.9); // 16px mobile, ~14.4px tablet
  const seeAllFontSize = getFontSize(12, 0.85); // 14px mobile, ~11.9px tablet

  // Responsive image size
  const getImageSize = () => {
    if (isTablet) {
      return getResponsiveSize(80); // Smaller images on tablet
    }
    return getResponsiveSize(80); // Normal on mobile
  };

  const itemSize = {
    width: width - getResponsiveSize(32),
    imageSize: getImageSize(),
    imageHeight: getImageSize(),
  };

  const getPadding = () => {
    if (isTablet) {
      return getResponsiveSize(20); // Less padding on tablet
    }
    return getResponsiveSize(16); // Normal padding on mobile
  };

 const handleCardPress = useCallback(
  (item: ManualItem) => {
    const isUnlocked = isManualUnlocked(item.month, item.date);
    console.log("Recommended manual clicked:", {
      title: item.title,
      month: item.month,
      date: item.date,
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
      const isUnlocked = isManualUnlocked(lastReadManual.month, lastReadManual.date);
      if (!isUnlocked) {
        return;
      }
      
      router.push({
        pathname: "/Home/ManualDetail",
        params: { manual: JSON.stringify(lastReadManual) },
      });
    }
  }, [lastReadManual, router]);

 // Update the renderRecommendedItem function in Recommended component
const renderRecommendedItem = ({ item }: { item: ManualItem }) => {
  const isUnlocked = isManualUnlocked(item.month, item.date);
  
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
        borderColor: isDarkMode ? "#444444" : "#cccccc", // Normal color for all cards
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
          {/* REMOVED: Special badge for January 4th */}
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
              color: isUnlocked ? (isDarkMode ? "#b0b0b0" : "#666666") : (isDarkMode ? "#777" : "#999"), // Normal color
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
                fontSize: titleFontSize * scale, // Use responsive font size
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
      marginBottom: getResponsiveSize(isTablet ? 16 : 20) * scale, // Less margin on tablet
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
      width: isSmallPhone ? getResponsiveSize(26) * scale : getResponsiveSize(isTablet ? 28 : 30) * scale, // Smaller on tablet
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