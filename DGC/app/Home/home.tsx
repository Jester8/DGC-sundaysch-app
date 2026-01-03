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
}

const bannerSlides: BannerSlide[] = [
  { id: "1", image: require("@/assets/images/4th.png") },
  { id: "2", image: require("@/assets/images/11th.png") },
  { id: "3", image: require("@/assets/images/18th.png") },
  { id: "4", image: require("@/assets/images/25th.png") },
  { id: "5", image: require("@/assets/images/sign.png") },
];

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

  // Auto-scroll banner
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerSlides.length;
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex, 
        animated: true 
      });
      setCurrentBannerIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentBannerIndex]);

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
      <Image
        source={item.image}
        style={{ width: "100%", height: "100%", resizeMode: "cover" }}
        onLoadEnd={() => setBannerLoading(false)}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Banner Section */}
        <View style={{ marginTop: getResponsiveSize(16), alignItems: "center" }}>
          <FlatList
            ref={flatListRef}
            data={bannerSlides}
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
          
          {/* White Indicator Dots */}
          <View style={styles.indicatorContainer}>
            {bannerSlides.map((_, index) => (
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