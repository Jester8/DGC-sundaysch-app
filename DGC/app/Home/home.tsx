import { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "./header";
import Recommended from "./recommended";
import Note from "./notes";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

interface BannerSlide {
  id: string;
  image: NodeRequire;
  imageUrl?: string;
}

// Only keep sign.png as local fallback
const STATIC_BANNER: BannerSlide[] = [
  { id: "sign", image: require("@/assets/images/sign.png") },
];

const API_BASE_URL = "https://dgc-backend.onrender.com";

const BannerSkeleton = ({ width, height, isDarkMode, getResponsiveSize }: any) => (
  <View
    style={{
      width: width - getResponsiveSize(32),
      height,
      borderRadius: getResponsiveSize(16),
      overflow: "hidden",
      marginHorizontal: getResponsiveSize(16),
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f0f0f0",
    }}
  >
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: isDarkMode ? "#2a2a2a" : "#e0e0e0",
        opacity: 0.6,
      }}
    />
  </View>
);

export default function Home() {
  const { width, height } = useWindowDimensions();
  const { isDarkMode, setIsDarkMode } = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [allBanners, setAllBanners] = useState<BannerSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLandscape = width > height;

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const bannerHeight = isLandscape
    ? getResponsiveSize(100)
    : getResponsiveSize(150);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Get current month name
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  };

 
  const fetchMonthlyBanners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentMonth = getCurrentMonth();
      console.log(`Fetching banners for month: ${currentMonth}`);
      
      // Fetch manuals for current month
      const response = await fetch(`${API_BASE_URL}/api/manuals/month/${currentMonth.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }
      
      if (!result.data || result.data.length === 0) {
        // No banners for this month - just show sign.png
        console.log(`No banners found for ${currentMonth}, showing sign only`);
        setAllBanners(STATIC_BANNER);
        return;
      }
      
      const manuals = result.data;
      console.log(`Found ${manuals.length} manuals for ${currentMonth}`);
      
      // Create banners from manuals - only use manuals with imageUrl
      const banners: BannerSlide[] = [];
      
      for (const manual of manuals) {
        if (manual.imageUrl && manual.imageUrl.trim() !== '') {
          banners.push({
            id: manual._id || manual.id || `banner-${banners.length}`,
            image: require("@/assets/images/sign.png"), // Use sign.png as fallback if imageUrl fails
            imageUrl: manual.imageUrl,
          });
        }
        
        // Only take first 4 banners
        if (banners.length >= 4) break;
      }
      
      console.log(`Created ${banners.length} banners from API`);
      
      // Add sign.png as the last banner
      const combinedBanners = [
        ...banners,
        ...STATIC_BANNER
      ];
      
      setAllBanners(combinedBanners);
      
    } catch (error) {
      console.error("Error fetching monthly banners:", error);
      setError(error instanceof Error ? error.message : 'Failed to load banners');
      // On error, just show sign.png
      setAllBanners(STATIC_BANNER);
    } finally {
      setIsLoading(false);
      setBannerLoading(false);
    }
  };

  // Auto-scroll banner
  useEffect(() => {
    if (allBanners.length <= 1) return; // Don't auto-scroll if only one banner
    
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % allBanners.length;
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex, 
        animated: true 
      });
      setCurrentBannerIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentBannerIndex, allBanners.length]);

  // Handle scroll events to update indicator
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const bannerWidth = width - getResponsiveSize(32) + getResponsiveSize(32); // width + margin
    const index = Math.round(contentOffsetX / bannerWidth);
    setCurrentBannerIndex(index);
  };

  // Show welcome modal only on first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasOpened = await AsyncStorage.getItem("hasOpenedApp");
        if (!hasOpened) {
          setShowWelcomeModal(true);
          await AsyncStorage.setItem("hasOpenedApp", "true");
        }
      } catch {
        console.log("First launch check failed");
        setShowWelcomeModal(true); // fallback to showing modal
      }
    };
    checkFirstLaunch();
  }, []);

  // Fetch monthly banners on component mount
  useEffect(() => {
    fetchMonthlyBanners();
    
    // Refresh banners daily
    const refreshInterval = setInterval(() => {
      fetchMonthlyBanners();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    return () => clearInterval(refreshInterval);
  }, []);

  const renderBannerSlide = ({ item }: { item: BannerSlide }) => (
    <View
      style={{
        width: width - getResponsiveSize(32),
        height: bannerHeight,
        borderRadius: getResponsiveSize(16),
        overflow: "hidden",
        marginHorizontal: getResponsiveSize(16),
      }}
    >
      {bannerLoading && (
        <BannerSkeleton
          width={width}
          height={bannerHeight}
          isDarkMode={isDarkMode}
          getResponsiveSize={getResponsiveSize}
        />
      )}
      
      {/* Render image from URL if available, otherwise use local image */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          onLoadStart={() => setBannerLoading(true)}
          onLoadEnd={() => setBannerLoading(false)}
          onError={(error) => {
            console.error("Error loading banner image:", error.nativeEvent.error);
            // If URL fails, use local sign.png
            setBannerLoading(false);
          }}
        />
      ) : (
        <Image
          source={item.image}
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          onLoadEnd={() => setBannerLoading(false)}
        />
      )}
    </View>
  );


  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Banner Section */}
        <View style={{ marginTop: getResponsiveSize(16), alignItems: "center" }}>
          {error ? (
            <View
              style={{
                width: width - getResponsiveSize(32),
                height: bannerHeight,
                borderRadius: getResponsiveSize(16),
                overflow: "hidden",
                marginHorizontal: getResponsiveSize(16),
                backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#9d00d4",
                padding: getResponsiveSize(20),
              }}
            >
              <MaterialIcons name="error-outline" size={getResponsiveSize(32)} color="#9d00d4" />
              <Text style={{ 
                color: isDarkMode ? "#fff" : "#000",
                fontSize: getResponsiveSize(14),
                textAlign: "center",
                marginTop: getResponsiveSize(12),
                fontFamily: "Manrope_400Regular"
              }}>
                {error}
              </Text>
              <TouchableOpacity 
                onPress={fetchMonthlyBanners}
                style={{
                  marginTop: getResponsiveSize(16),
                  backgroundColor: "#9d00d4",
                  paddingHorizontal: getResponsiveSize(16),
                  paddingVertical: getResponsiveSize(8),
                  borderRadius: getResponsiveSize(8),
                }}
              >
                <Text style={{
                  color: "#fff",
                  fontSize: getResponsiveSize(12),
                  fontFamily: "Manrope_600SemiBold"
                }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : allBanners.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={allBanners}
                renderItem={renderBannerSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(data, index) => ({
                  length: width - getResponsiveSize(32) + getResponsiveSize(32),
                  offset: (width - getResponsiveSize(32) + getResponsiveSize(32)) * index,
                  index,
                })}
              />
              
              {/* White Indicator Dots - only show if more than 1 banner */}
              {allBanners.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {allBanners.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicatorDot,
                        {
                          backgroundColor: index === currentBannerIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                          width: index === currentBannerIndex ? getResponsiveSize(10) : getResponsiveSize(6),
                          height: getResponsiveSize(3),
                          borderRadius: getResponsiveSize(3),
                          marginHorizontal: getResponsiveSize(4),
                          marginTop: getResponsiveSize(-54),
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            // No banners available
            <View
              style={{
                width: width - getResponsiveSize(32),
                height: bannerHeight,
                borderRadius: getResponsiveSize(16),
                overflow: "hidden",
                marginHorizontal: getResponsiveSize(16),
                backgroundColor: isDarkMode ? "#1a1a1a" : "#f0f0f0",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDarkMode ? "#333" : "#e0e0e0",
                borderStyle: 'dashed',
              }}
            >
              <Image
                source={require("@/assets/images/sign.png")}
                style={{ width: "100%", height: "100%", resizeMode: "cover" }}
              />
            </View>
          )}
          
         
        </View>

        <View style={{ paddingHorizontal: getResponsiveSize(16) }}>
          <Recommended isDarkMode={isDarkMode} />
        </View>

        <Note isDarkMode={isDarkMode} />
      </ScrollView>

      <BottomTabNavigation />

      {/* Welcome Modal */}
      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: getResponsiveSize(20),
          }}
        >
          <View
            style={{
              width: isLandscape ? "70%" : "90%",
              maxWidth: 500,
              backgroundColor: isDarkMode ? "#111" : "#fff",
              borderRadius: getResponsiveSize(16),
              padding: getResponsiveSize(20),
              position: "relative",
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowWelcomeModal(false)}
              style={{
                position: "absolute",
                top: getResponsiveSize(1),
                right: getResponsiveSize(10),
                padding: getResponsiveSize(6),
              }}
            >
              <Text
                style={{
                  fontSize: getResponsiveSize(18),
                  fontWeight: "700",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: getResponsiveSize(20),
                fontWeight: "700",
                textAlign: "center",
                color: isDarkMode ? "#fff" : "#000",
                marginBottom: getResponsiveSize(12),
                marginTop: getResponsiveSize(10),
              }}
            >
              Welcome to DGC Sunday School Manual App
            </Text>

            <Text
              style={{
                fontSize: getResponsiveSize(14),
                color: isDarkMode ? "#ddd" : "#333",
                marginBottom: getResponsiveSize(12),
              }}
            >
              This app is designed to help you grow spiritually through structured
              Sunday School manuals that edify and ground you in sound doctrine.
            </Text>

            <Text
              style={{
                fontSize: getResponsiveSize(14),
                color: isDarkMode ? "#ddd" : "#333",
                marginBottom: getResponsiveSize(6),
              }}
            >
              ✍️ Take notes with the built-in Notepad
            </Text>

            <Text
              style={{
                fontSize: getResponsiveSize(14),
                color: isDarkMode ? "#ddd" : "#333",
              }}
            >
              📖 Study scriptures using the in-built Bible
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  indicatorDot: {
    transition: "all 0.3s ease",
  },
});