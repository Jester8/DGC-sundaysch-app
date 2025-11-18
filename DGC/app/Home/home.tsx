import { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  useWindowDimensions,
  FlatList,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  {
    id: "1",
    image: require("@/assets/images/jan4.png"),
  },
  {
    id: "2",
    image: require("@/assets/images/jan11.png"),
  },
  {
    id: "3",
    image: require("@/assets/images/jan18.png"),
  },
  {
    id: "4",
    image: require("@/assets/images/sign.png"),
  },
];

const BannerSkeleton = ({ width, height, isDarkMode, getResponsiveSize }: any) => (
  <View
    style={{
      width: width - getResponsiveSize(32),
      height: height,
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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerLoading, setBannerLoading] = useState(true);

  const isLandscape = width > height;

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const bannerHeight = isLandscape ? getResponsiveSize(100) : getResponsiveSize(150);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % bannerSlides.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentBannerIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentBannerIndex]);

  const renderBannerSlide = ({ item }: { item: BannerSlide }) => (
    <View
      style={{
        width: width - getResponsiveSize(32),
        height: bannerHeight,
        borderRadius: getResponsiveSize(16),
        overflow: "hidden",
        marginHorizontal: getResponsiveSize(16),
        position: "relative",
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
        style={{
          width: "100%",
          height: "100%",
          resizeMode: "cover",
        }}
        onLoadEnd={() => setBannerLoading(false)}
      />
    </View>
  );

  const renderPaginationDot = (index: number) => (
    <TouchableOpacity
      key={index}
      onPress={() => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setCurrentBannerIndex(index);
      }}
      style={{
        width: index === currentBannerIndex ? getResponsiveSize(15) : getResponsiveSize(5),
        height: getResponsiveSize(2),
        borderRadius: getResponsiveSize(5),
        backgroundColor:
          index === currentBannerIndex
            ? isDarkMode
              ? "#ffffff"
              : "#ffffffff"
            : isDarkMode
            ? "rgba(0, 0, 0, 0.3)"
            : "rgba(73,0,108,0.3)",
        marginHorizontal: getResponsiveSize(4),
      }}
    />
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? "#000000" : "#ffffff",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginTop: getResponsiveSize(16),
            alignItems: "center",
          }}
        >
          <FlatList
            ref={flatListRef}
            data={bannerSlides}
            renderItem={renderBannerSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (width - getResponsiveSize(32))
              );
              setCurrentBannerIndex(Math.min(index, bannerSlides.length - 1));
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              bottom: getResponsiveSize(10),
            }}
          >
            {bannerSlides.map((_, index) => renderPaginationDot(index))}
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: getResponsiveSize(16),
            paddingBottom: getResponsiveSize(20),
          }}
        >
          <Recommended isDarkMode={isDarkMode} />
        </View>
        <Note isDarkMode={isDarkMode} />
      </ScrollView>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}