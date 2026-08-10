import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  PanResponder,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import {
  fetchAllManualsFromHygraph,
  toCompatManual,
  computeNextUpcomingISO,
  isManualUnlocked,
  type CompatManual,
} from "../../lib/hygraph";

const STORAGE_KEY = "recommended_manuals_hygraph";
const LAST_READ_KEY = "last_read_manual";
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const RECOMMENDED_COUNT = 4;

type ManualItem = CompatManual;

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

// "Recommended" = the most recently unlocked manuals (most recent first) —
// with the old REST backend's rolling 4-day order-window gone (see
// lib/hygraph.ts's isManualUnlocked), this is the simplest faithful
// replacement: whatever's currently readable, freshest first.
const getDisplayManuals = (allManuals: ManualItem[], nextUpcomingISO: string | null): ManualItem[] => {
  return allManuals
    .filter((manual) => isManualUnlocked(manual, nextUpcomingISO))
    .sort((a, b) => b.studyDate.localeCompare(a.studyDate))
    .slice(0, RECOMMENDED_COUNT);
};

export default function Recommended({ isDarkMode: propIsDarkMode }: RecommendedProps) {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { isDarkMode: contextIsDarkMode } = useNavigation();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode;

  const [loading, setLoading] = useState(true);
  const [recommendedData, setRecommendedData] = useState<ManualItem[]>([]);
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastReadManual, setLastReadManual] = useState<ManualItem | null>(null);
  const [loadingLastRead, setLoadingLastRead] = useState(true);
  const [scale, setScale] = useState(1);

  const nextUpcomingISO = useMemo(() => computeNextUpcomingISO(allManuals), [allManuals]);
  
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

      const rawManuals = await fetchAllManualsFromHygraph();
      const compatManuals = rawManuals.map((raw, index) => toCompatManual(raw, index + 1));

      await saveToStorage(compatManuals);
      setAllManuals(compatManuals);
      setRecommendedData(getDisplayManuals(compatManuals, computeNextUpcomingISO(compatManuals)));
    } catch (err) {
      console.error("Error fetching recommendations from Hygraph:", err);

      const cachedData = await loadFromStorage();
      if (cachedData && cachedData.length > 0) {
        setAllManuals(cachedData);
        setRecommendedData(getDisplayManuals(cachedData, computeNextUpcomingISO(cachedData)));
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
  // Matches "Your Notes"' header size on the same Home screen (notes.tsx).
  const headerFontSize = getFontSize(13, 0.9) + 3;
  const seeAllFontSize = getFontSize(12, 0.85);

  const itemSize = {
    width: width - getResponsiveSize(32),
  };

  const getPadding = () => {
    if (isTablet) {
      return getResponsiveSize(20);
    }
    return getResponsiveSize(16);
  };

  const handleCardPress = useCallback(
    (item: ManualItem) => {
      const isUnlocked = isManualUnlocked(item, nextUpcomingISO);
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
    [router, nextUpcomingISO]
  );

  const handleSeeAll = () => {
    router.push("/Home/outline");
  };

  const handleContinueRead = useCallback(() => {
    if (lastReadManual) {
      const isUnlocked = isManualUnlocked(lastReadManual, nextUpcomingISO);
      if (!isUnlocked) {
        return;
      }

      router.push({
        pathname: "/Home/ManualDetail",
        params: { manual: JSON.stringify(lastReadManual) },
      });
    }
  }, [lastReadManual, router, nextUpcomingISO]);

  const renderRecommendedItem = ({ item }: { item: ManualItem }) => {
    const isUnlocked = isManualUnlocked(item, nextUpcomingISO);

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
        <View
          style={{
            width: getResponsiveSize(40) * scale,
            height: getResponsiveSize(40) * scale,
            borderRadius: getResponsiveSize(20) * scale,
            marginRight: getResponsiveSize(10) * scale,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isUnlocked ? "rgba(157,0,212,0.12)" : isDarkMode ? "#2a2a2a" : "#eeeeee",
          }}
        >
          <MaterialIcons
            name={isUnlocked ? "menu-book" : "lock"}
            size={isTablet ? 16 : 18}
            color={isUnlocked ? "#9d00d4" : isDarkMode ? "#666" : "#aaa"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontSize: titleFontSize * scale,
              fontFamily: "Manrope_600SemiBold",
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
              fontFamily: "Manrope_400Regular",
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
                  fontFamily: "Manrope_600SemiBold",
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
                fontFamily: "Manrope_400Regular",
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
              fontFamily: "Manrope_600SemiBold",
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
              fontFamily: "Manrope_600SemiBold",
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
            fontFamily: "Manrope_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Recommended for You 
        </Text>

        <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
          <Text
            style={{
              fontSize: seeAllFontSize * scale,
              fontFamily: "Manrope_500Medium",
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
              fontFamily: "Manrope_600SemiBold",
              color: "#FF6B6B",
              marginBottom: getResponsiveSize(8) * scale,
            }}
          >
            ⚠️ No internet connection
          </Text>
          <Text
            style={{
              fontSize: versesFontSize * scale,
              fontFamily: "Manrope_400Regular",
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
                fontFamily: "Manrope_600SemiBold",
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
            paddingVertical: getResponsiveSize(36) * scale,
            paddingHorizontal: getResponsiveSize(24) * scale,
            alignItems: "center",
            borderRadius: getResponsiveSize(16) * scale,
            borderWidth: 1,
            borderColor: isDarkMode ? "#2a2a2a" : "#eeeeee",
            backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          }}
        >
          <View
            style={{
              width: getResponsiveSize(64) * scale,
              height: getResponsiveSize(64) * scale,
              borderRadius: getResponsiveSize(32) * scale,
              backgroundColor: isDarkMode ? "rgba(157,0,212,0.15)" : "rgba(157,0,212,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: getResponsiveSize(14) * scale,
            }}
          >
            <MaterialIcons name="auto-awesome" size={getResponsiveSize(28) * scale} color="#9d00d4" />
          </View>
          <Text
            style={{
              fontSize: titleFontSize * scale,
              fontFamily: "Manrope_700Bold",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              marginBottom: getResponsiveSize(6) * scale,
              textAlign: "center",
            }}
          >
            Nothing recommended yet
          </Text>
          <Text
            style={{
              fontSize: versesFontSize * scale,
              fontFamily: "Manrope_400Regular",
              color: isDarkMode ? "#999999" : "#777777",
              textAlign: "center",
              lineHeight: (versesFontSize + 6) * scale,
            }}
          >
            Once new manuals unlock, we'll surface the ones picked for you right here.
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
      fontFamily: "Manrope_600SemiBold",
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