import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "./_navigationContext";

const API_BASE_URL = "https://dgc-backend.onrender.com";

interface ManualItem {
  _id: string;
  id: string;
  title: string;
  theme: string;
  memoryVerse: string;
  month: string;
  date: string;
  imageUrl?: string;
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
  isDarkMode?: boolean;
}

export default function Recommended({ isDarkMode: propIsDarkMode }: RecommendedProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { isDarkMode: contextIsDarkMode } = useNavigation();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode;

  const [loading, setLoading] = useState(true);
  const [allManuals, setAllManuals] = useState<ManualItem[]>([]);
  const [recommendedData, setRecommendedData] = useState<ManualItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllManualsAndRecommended();
  }, []);

  const fetchAllManualsAndRecommended = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all manuals
      const allResponse = await fetch(`${API_BASE_URL}/api/manuals/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!allResponse.ok) {
        throw new Error(`HTTP error! status: ${allResponse.status}`);
      }

      const allData = await allResponse.json();

      if (allData.success && allData.data) {
        // Flatten all manuals into a single array
        const flattenedManuals: ManualItem[] = [];
        Object.values(allData.data).forEach((monthManuals: any) => {
          if (Array.isArray(monthManuals)) {
            flattenedManuals.push(...monthManuals);
          }
        });
        setAllManuals(flattenedManuals);

        // Fetch recommended manuals
        const recResponse = await fetch(
          `${API_BASE_URL}/api/manuals/recommended`
        );

        if (!recResponse.ok) {
          throw new Error(`HTTP error! status: ${recResponse.status}`);
        }

        const recData = await recResponse.json();

        if (recData.success && recData.data) {
          // Map recommended manuals with full data from allManuals
          const recommendedWithFullData = recData.data.map(
            (recItem: any) => {
              const fullManual = flattenedManuals.find(
                (m) => m._id === recItem._id || m.id === recItem.id
              );
              return fullManual || recItem;
            }
          );
          setRecommendedData(recommendedWithFullData);
        } else {
          setRecommendedData(recData.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching manuals:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isPhone = width <= 600;

  const itemSize = {
    width: width - getResponsiveSize(32),
    imageSize: getResponsiveSize(80),
    imageHeight: getResponsiveSize(80),
  };

  const titleFontSize = getResponsiveSize(10);
  const versesFontSize = getResponsiveSize(9);
  const categoryFontSize = getResponsiveSize(9);
  const dateFontSize = getResponsiveSize(9);
  const headerFontSize = isPhone ? 12 : getResponsiveSize(11);
  const seeAllFontSize = isPhone ? 12 : getResponsiveSize(9);

  const handleCardPress = useCallback(
    (item: ManualItem) => {
      router.push({
        pathname: "/Home/ManualDetail",
        params: { manual: JSON.stringify(item) },
      });
    },
    [router]
  );

  const handleSeeAll = () => {
    router.push("/Home/outline");
  };

  const renderRecommendedItem = ({ item }: { item: ManualItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleCardPress(item)}
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
        Recommended for You
      </Text>

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
          This Week
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
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
            onPress={fetchAllManualsAndRecommended}
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