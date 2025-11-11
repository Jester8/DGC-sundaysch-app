import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NoteItem {
  id: string;
  title: string;
  date: string;
  isPurple: boolean;
}

const notesData: NoteItem[] = [
  {
    id: "1",
    title: "Who is The King of The Kingdom | Sept 2025",
    date: "",
    isPurple: true,
  },
  {
    id: "2",
    title: "The Heart of Worship",
    date: "",
    isPurple: true,
  },
  {
    id: "3",
    title: "Worship – September 21st, 2025",
    date: "",
    isPurple: true,
  },
  {
    id: "4",
    title: "Add Your First Note",
    date: "",
    isPurple: false,
  },
];

interface NoteProps {
  isDarkMode: boolean;
}

export default function Note({ isDarkMode }: NoteProps) {
  const { width } = useWindowDimensions();

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const containerPadding = getResponsiveSize(12);
  const cardSpacing = getResponsiveSize(12);
  const cardWidth = (width - containerPadding * 2 - cardSpacing) / 2;
  const headerFontSize = getResponsiveSize(10);
  const seeAllFontSize = getResponsiveSize(10);
  const cardTitleFontSize = getResponsiveSize(10);

  const renderNoteCard = ({ item, index }: { item: NoteItem; index: number }) => {
    const isLastCard = index === notesData.length - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          width: cardWidth,
          height: cardWidth * 0.8,
          backgroundColor: item.isPurple ? "#9d00d4" : "transparent",
          borderRadius: getResponsiveSize(16),
          borderWidth: item.isPurple ? 0 : 1.5,
          borderColor: isDarkMode ? "#333333" : "#000000",
          padding: getResponsiveSize(16),
          justifyContent: "flex-end",
          marginRight: isLastCard ? 0 : cardSpacing,
          marginBottom: cardSpacing,
        }}
      >
        {item.isPurple ? (
          <Text
            numberOfLines={3}
            style={{
              fontSize: cardTitleFontSize,
              fontFamily: "Poppins_600SemiBold",
              color: "#ffffff",
            }}
          >
            {item.title}
          </Text>
        ) : (
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name="document-outline"
              size={getResponsiveSize(30)}
              color={isDarkMode ? "#666666" : "#000000"}
            />
            <Text
              style={{
                fontSize: getResponsiveSize(10),
                fontFamily: "Poppins_500Medium",
                color: isDarkMode ? "#b0b0b0" : "#666666",
                marginTop: getResponsiveSize(8),
                textAlign: "center",
              }}
            >
              {item.title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{
        paddingHorizontal: containerPadding,
        paddingVertical: getResponsiveSize(20),
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
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
          Read Up Your Notes
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text
            style={{
              fontSize: seeAllFontSize,
              fontFamily: "Poppins_600SemiBold",
              color: isDarkMode ? "#ffffff" : "#000000",
              textDecorationLine: "underline",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes Grid */}
      <FlatList
        data={notesData}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
      />
    </View>
  );
}