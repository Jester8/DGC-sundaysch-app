 import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RecommendedItem {
  id: string;
  title: string;
  image: NodeRequire;
  verses: string;
  category: string;
  date: string;
}

const recommendedData: RecommendedItem[] = [
  {
    id: "1",
    title: "The King's Responsibilities to His Citizens",
    image: require("@/assets/images/king.png"),
    verses: "Isaiah 9:7; Psalm 23:1; Psalm 9:7–8",
    category: "THE KING OF THE KINGDOM",
    date: "Sun, 19th Oct, 2025",
  },
  {
    id: "2",
    title: "How the King Reigns (The Modus Operandi of the King)",
    image: require("@/assets/images/king.png"),
    verses: "Psalm 103:19; Revelation 19:11–16",
    category: "THE KING OF THE KINGDOM",
    date: "Sun, 12th Oct, 2025",
  },
  {
    id: "3",
    title: "Who Is The King of The Kingdom",
    image: require("@/assets/images/king.png"),
    verses: "Isaiah 9:6–7; Psalm 24:7–10; Revelation 19:6",
    category: "THE KING OF THE KINGDOM",
    date: "Sun, 5th Oct, 2025",
  },
  {
    id: "4",
    title: "The Heart of Worship",
    image: require("@/assets/images/wor.png"),
    verses: "Matthew 22:37–38",
    category: "WORSHIP",
    date: "Sun, 28th Sept, 2025",
  },
];

interface SkeletonLoaderProps {
  isDarkMode: boolean;
  itemSize: { width: number; imageSize: number; imageHeight: number };
}

const SkeletonLoader = ({ isDarkMode, itemSize }: SkeletonLoaderProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: itemSize.width * 0.04,
      paddingHorizontal: itemSize.width * 0.04,
      paddingVertical: itemSize.width * 0.03,
      borderWidth: 1,
      borderColor: isDarkMode ? "#333333" : "#e0e0e0",
      borderRadius: itemSize.width * 0.05,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
    }}
  >
    {/* Image Skeleton */}
    <View
      style={{
        width: itemSize.imageSize,
        height: itemSize.imageHeight,
        borderRadius: itemSize.width * 0.04,
        marginRight: itemSize.width * 0.04,
        backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
      }}
    />

    {/* Text Skeleton */}
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: itemSize.width * 0.04,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02,
          marginBottom: itemSize.width * 0.03,
          width: "80%",
        }}
      />
      <View
        style={{
          height: itemSize.width * 0.032,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02,
          marginBottom: itemSize.width * 0.02,
          width: "60%",
        }}
      />
      <View
        style={{
          height: itemSize.width * 0.032,
          backgroundColor: isDarkMode ? "#333333" : "#e0e0e0",
          borderRadius: itemSize.width * 0.02,
          width: "50%",
        }}
      />
    </View>
  </View>
);

interface RecommendedProps {
  isDarkMode: boolean;
}

export default function Recommended({ isDarkMode }: RecommendedProps) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [continueLoading, setContinueLoading] = useState(true);

  const isSmallDevice = width < 350;
  const isMediumDevice = width >= 350 && width < 500;
  const isLargeDevice = width >= 768; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const itemSize = {
    width: width - getResponsiveSize(32),
    imageSize: getResponsiveSize(80),
    imageHeight: getResponsiveSize(80),
  };

  const titleFontSize = getResponsiveSize(9);
  const versesFontSize = getResponsiveSize(9);
  const categoryFontSize = getResponsiveSize(9);
  const dateFontSize = getResponsiveSize(9);
  const headerFontSize = getResponsiveSize(9);
  const seeAllFontSize = getResponsiveSize(9);

  const renderRecommendedItem = ({ item }: { item: RecommendedItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: getResponsiveSize(12),
        paddingHorizontal: getResponsiveSize(12),
        paddingVertical: getResponsiveSize(10),
        borderWidth: 0.7,
        borderColor: "#000000",
        borderRadius: getResponsiveSize(14),
        backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
      }}
    >
      {/* Item Image */}
      <Image
        source={item.image}
        style={{
          width: itemSize.imageSize,
          height: itemSize.imageHeight,
          borderRadius: getResponsiveSize(10),
          marginRight: getResponsiveSize(10),
          resizeMode: "cover",
        }}
      />

      {/* Item Content */}
      <View style={{ flex: 1 }}>
        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: titleFontSize,
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
            marginBottom: getResponsiveSize(4),
          }}
        >
          {item.title}
        </Text>

        {/* Verses */}
        <Text
          numberOfLines={1}
          style={{
            fontSize: versesFontSize,
            fontFamily: "Poppins_400Regular",
            color: isDarkMode ? "#b0b0b0" : "#666666",
            marginBottom: getResponsiveSize(6),
          }}
        >
          {item.verses}
        </Text>

        {/* Category and Date */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: getResponsiveSize(6), flexWrap: "wrap" }}>
          {/* Category Badge */}
          <View
            style={{
              backgroundColor: "#9d00d4",
              paddingHorizontal: getResponsiveSize(6),
              paddingVertical: getResponsiveSize(3),
              borderRadius: getResponsiveSize(3),
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: categoryFontSize,
                fontFamily: "Poppins_600SemiBold",
                color: "#ffffff",
              }}
            >
              {item.category}
            </Text>
          </View>

          {/* Date */}
          <Text
            numberOfLines={1}
            style={{
              fontSize: dateFontSize,
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#b0b0b0" : "#666666",
            }}
          >
            {item.date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        paddingHorizontal: getResponsiveSize(16),
        paddingVertical: getResponsiveSize(20),
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
      {/* Continue Last Read */}
      <Text
        style={{
          fontSize: headerFontSize,
          fontFamily: "Poppins_600SemiBold",
          color: isDarkMode ? "#ffffff" : "#000000",
          marginBottom: getResponsiveSize(12),
        }}
      >
        Continue Last Read
      </Text>

      {continueLoading ? (
        <View
          style={{
            width: "100%",
            height: getResponsiveSize(40),
            backgroundColor: "#9d00d4",
            borderRadius: getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(16),
            paddingVertical: getResponsiveSize(12),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: getResponsiveSize(20),
          }}
        >
          <Text
            style={{
              fontSize: getResponsiveSize(10),
              fontFamily: "Poppins_500Medium",
              color: "#ffffff",
            }}
          >
            Power of Worship
          </Text>
          <View
            style={{
              width: getResponsiveSize(25),
              height: getResponsiveSize(25),
              borderRadius: getResponsiveSize(8),
              backgroundColor: "rgba(255, 252, 252, 0.94)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
  name="arrow-forward"
  size={isSmallDevice ? 16 : 20}
  color="#8c17c2ff"
/>
          </View>
        </View>
      ) : null}

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: getResponsiveSize(16),
        }}
      >
        <Text
          style={{
            fontSize: headerFontSize,
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Recommended 
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text
            style={{
              fontSize: seeAllFontSize,
              fontFamily: "Poppins_500Medium",
              color: isDarkMode ? "#ffffff" : "#000000",
              textDecorationLine: "underline",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View>
          {[1, 2, 3, 4].map((index) => (
            <SkeletonLoader
              key={index}
              isDarkMode={isDarkMode}
              itemSize={itemSize}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={recommendedData}
          renderItem={renderRecommendedItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}