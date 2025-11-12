import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.56.2:5000";

interface RecommendedItem {
  _id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  month: string;
  date: string;
  imageUrl?: string;
}

interface SkeletonLoaderProps {
  isDarkMode: boolean;
  itemSize: { width: number };
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
  const [recommendedData, setRecommendedData] = useState<RecommendedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [continueLoading, setContinueLoading] = useState(true);

  const isSmallDevice = width < 350;

  useEffect(() => {
    fetchRecommended();

    const continueTimer = setTimeout(() => {
      setContinueLoading(false);
    }, 1000);

    return () => clearTimeout(continueTimer);
  }, []);

  const fetchRecommended = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/manuals/recommended`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setRecommendedData(data.data);
        setLoading(false); 
      } else {
        throw new Error("Failed to fetch recommended manuals");
      }
    } catch (err) {
      console.error("Error fetching recommended:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setLoading(false);
    }
  };

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
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: itemSize.imageSize,
            height: itemSize.imageHeight,
            borderRadius: getResponsiveSize(10),
            marginRight: getResponsiveSize(10),
            resizeMode: "cover",
          }}
        />
      )}

      <View style={{ flex: 1 }}>
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

        <Text
          numberOfLines={1}
          style={{
            fontSize: versesFontSize,
            fontFamily: "Poppins_400Regular",
            color: isDarkMode ? "#b0b0b0" : "#666666",
            marginBottom: getResponsiveSize(6),
          }}
        >
          {item.memoryVerse}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: getResponsiveSize(6),
            flexWrap: "wrap",
          }}
        >
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
              {item.theme}
            </Text>
          </View>

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

      {error ? (
        <View
          style={{
            paddingVertical: getResponsiveSize(16),
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: titleFontSize,
              fontFamily: "Poppins_600SemiBold",
              color: "#FF6B6B",
              marginBottom: getResponsiveSize(8),
            }}
          >
            ⚠️ Error Loading
          </Text>
          <Text
            style={{
              fontSize: versesFontSize,
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#b0b0b0" : "#666666",
              textAlign: "center",
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchRecommended}
            style={{
              marginTop: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(16),
              paddingVertical: getResponsiveSize(8),
              backgroundColor: "#9d00d4",
              borderRadius: getResponsiveSize(8),
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "Poppins_600SemiBold",
                fontSize: versesFontSize,
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
              key={index}
              isDarkMode={isDarkMode}
              itemSize={itemSize}
            />
          ))}
        </View>
      ) : recommendedData.length > 0 ? (
        <FlatList
          data={recommendedData}
          renderItem={renderRecommendedItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
        />
      ) : (
        <View
          style={{
            paddingVertical: getResponsiveSize(20),
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: titleFontSize,
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