import { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNavigation } from "./Home/_navigationContext";

interface OnboardingSlide {
  id: string;
  image: NodeRequire;
  title: string;
  subtitle: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    image: require("@/assets/images/img1.png"),
    title: "Welcome to",
    subtitle: "Davidic Generation Church",
    description:
      "Read the Sunday school teachings and understand easily from your devices",
  },
  {
    id: "2",
    image: require("@/assets/images/img2.png"),
    title: "Where",
    subtitle: "Growth is Compulsory",
    description:
      "Read the Sunday school teachings and understand easily from your devices",
  },
  {
    id: "3",
    image: require("@/assets/images/img3.png"),
    title: "The Least of Us is as David",
    subtitle: "Greatest among Us is as God",
    description:
      "Read the Sunday school teachings and understand easily from your devices",
  },
];

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const screenDimensions = Dimensions.get("window");
  const isLandscape = width > height;
  const isSmallDevice = width < 350;
  const isMediumDevice = width >= 350 && width < 500;
  
  const router = useRouter();
  const { setHasCompletedOnboarding } = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (currentIndex + 1) / slides.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === slides.length - 1) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const getResponsiveFontSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.min(baseSize * scale, baseSize * 1.3);
  };

  const getResponsivePadding = (basePadding: number) => {
    return Math.max(basePadding * (width / 375), basePadding * 0.8);
  };

  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={{ width, height }}>
      <Image
        source={item.image}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(73,0,108,0.1)", "rgba(40, 8, 46, 0.4)", "rgba(73,0,108,0.9)"]}
        start={{ x: 0.5, y: -0.1 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <SafeAreaView
        style={{
          position: "absolute",
          top: isLandscape ? 10 : 70,
          left: getResponsivePadding(20),
          right: getResponsivePadding(20),
        }}
      >
        <View
          style={{
            height: 3,
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <Animated.View
            style={{
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              height: "100%",
              backgroundColor: "#fff",
            }}
          />
        </View>
        {index !== slides.length - 1 && (
          <TouchableOpacity
            onPress={handleCompleteOnboarding}
            style={{ alignSelf: "flex-end", marginTop: 6 }}
          >
            <Text
              style={{
                fontSize: getResponsiveFontSize(14),
                fontFamily: "Poppins_500Medium",
                color: "#FFFFFF",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Texts and Button */}
      <View
        style={{
          position: "absolute",
          bottom: isLandscape ? 20 : 80,
          left: getResponsivePadding(20),
          right: getResponsivePadding(20),
        }}
      >
        <Text
          style={{
            fontSize: getResponsiveFontSize(24),
            color: "#FFFFFF",
            marginBottom: 6,
            fontFamily: "PlayfairDisplay_400Regular_Italic",
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: getResponsiveFontSize(24),
            color: "#FFFFFF",
            marginBottom: index === slides.length - 1 ? 10 : 14,
            lineHeight: getResponsiveFontSize(40),
            fontFamily: "Poppins_700Bold",
          }}
        >
          {item.subtitle}
        </Text>

        {index !== slides.length - 1 && (
          <Text
            style={{
              fontSize: getResponsiveFontSize(15),
              color: "#FFFFFF",
              opacity: 0.9,
              lineHeight: getResponsiveFontSize(20),
              fontFamily: "Poppins_400Regular",
              marginBottom: 25,
            }}
          >
            {item.description}
          </Text>
        )}

        {index === slides.length - 1 && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCompleteOnboarding}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 40,
              paddingVertical: isSmallDevice ? 12 : 8,
              paddingHorizontal: isSmallDevice ? 16 : 20,
              alignSelf: "start",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 4,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: getResponsiveFontSize(18),
                fontFamily: "Poppins_600SemiBold",
                color: "#49006C",
              }}
            >
              Get Started
            </Text>

            <View
              style={{
                width: isSmallDevice ? 30 : 36,
                height: isSmallDevice ? 30 : 33,
                borderRadius: 10,
                backgroundColor: "#49006C",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 12,
              }}
            >
              <Ionicons
                name="arrow-forward"
                size={isSmallDevice ? 18 : 22}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
}