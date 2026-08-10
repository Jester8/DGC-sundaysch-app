import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "./_navigationContext";

const folderDarkPng = require("../../assets/images/folder-dark.png");
const ACCENT = "#9d00d4";
const CARD_ACCENTS_LIGHT = ["#f3e5fb", "#e8f0fe", "#fdece9", "#eafaf0"];
const CARD_ACCENTS_DARK = ["#241a2e", "#1a2233", "#2b1c1a", "#16261e"];

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function Note() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { isDarkMode } = useNavigation();
  const [notesData, setNotesData] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from AsyncStorage
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const savedNotes = await AsyncStorage.getItem("notes");
      if (savedNotes) {
        setNotesData(JSON.parse(savedNotes));
      } else {
        setNotesData([]);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

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
      // Make sizes smaller on tablets
      return baseSize * 0.85 * scaleFactor;
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
  const headerFontSize = getFontSize(13, 0.9); // 16px mobile, ~14.4px tablet
  const seeAllFontSize = getFontSize(14, 0.85); // 14px mobile, ~11.9px tablet
  const cardTitleFontSize = getFontSize(12, 0.85); // 12px mobile, ~10.2px tablet
  const dateFontSize = getFontSize(9, 0.85); // 9px mobile, ~7.65px tablet
  const addNoteFontSize = getFontSize(11, 0.85); // 11px mobile, ~9.35px tablet

  // Responsive padding and spacing
  const getPadding = () => {
    if (isTablet) {
      return getResponsiveSize(20); // Less padding on tablet
    }
    return getResponsiveSize(16); // Normal padding on mobile
  };

  const getSpacing = () => {
    if (isTablet) {
      return getResponsiveSize(14); // Less spacing on tablet
    }
    return getResponsiveSize(16); // Normal spacing on mobile
  };

  // Calculate card dimensions based on device
  const getCardDimensions = () => {
    const containerPadding = getPadding() * 2;
    const cardSpacing = getSpacing();
    
    if (isTablet) {
      // For tablets, show more columns if space allows
      const numColumns = isLargeTablet ? 3 : 2;
      const totalSpacing = cardSpacing * (numColumns - 1) + containerPadding;
      const cardWidth = (width - totalSpacing) / numColumns;
      return {
        cardWidth,
        cardHeight: cardWidth * 0.6, // Keep aspect ratio
        cardSpacing,
        numColumns,
      };
    } else {
      // For phones, always 2 columns
      const numColumns = 2;
      const totalSpacing = cardSpacing * (numColumns - 1) + containerPadding;
      const cardWidth = (width - totalSpacing) / numColumns;
      return {
        cardWidth,
        cardHeight: cardWidth * 0.6,
        cardSpacing,
        numColumns: 2,
      };
    }
  };

  const { cardWidth, cardHeight, cardSpacing, numColumns } = getCardDimensions();

  const handleAddNote = () => {
    router.push({
      pathname: "/Home/Notepad",
      params: { noteId: "null" },
    });
  };

  const handleNotePress = (noteId: string) => {
    router.push({
      pathname: "/Home/Notepad",
      params: { noteId },
    });
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const updatedNotes = notesData.filter((note) => note.id !== noteId);
            await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
            setNotesData(updatedNotes);
            Alert.alert("Success", "Note deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete note");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const renderNoteCard = ({ item, index }: { item: NoteItem; index: number }) => {
    const isLastInRow = (index + 1) % numColumns === 0;
    const accents = isDarkMode ? CARD_ACCENTS_DARK : CARD_ACCENTS_LIGHT;

    return (
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          marginRight: isLastInRow ? 0 : cardSpacing,
          marginBottom: cardSpacing,
          position: "relative",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleNotePress(item.id)}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: accents[index % accents.length],
            borderRadius: getResponsiveSize(16),
            padding: getResponsiveSize(14),
            justifyContent: "flex-end",
          }}
        >
          <MaterialIcons
            name="description"
            size={getResponsiveSize(isTablet ? 13 : 15)}
            color={ACCENT}
            style={{ position: "absolute", top: getResponsiveSize(12), left: getResponsiveSize(14) }}
          />
          <Text
            numberOfLines={3}
            style={{
              fontSize: cardTitleFontSize,
              fontFamily: "Manrope_700Bold",
              color: isDarkMode ? "#f5f5f5" : "#1a1a1a",
              lineHeight: cardTitleFontSize * 1.3,
            }}
          >
            {item.title || "Untitled Note"}
          </Text>
          <Text
            style={{
              fontSize: dateFontSize,
              fontFamily: "Manrope_500Medium",
              color: isDarkMode ? "#9a9a9a" : "#777777",
              marginTop: getResponsiveSize(6),
            }}
          >
            {item.date}
          </Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => handleDeleteNote(item.id)}
          style={{
            position: "absolute",
            top: getResponsiveSize(6),
            right: getResponsiveSize(6),
            backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.85)",
            borderRadius: getResponsiveSize(20),
            padding: getResponsiveSize(5),
          }}
        >
          <MaterialIcons
            name="delete-outline"
            size={getResponsiveSize(isTablet ? 12 : 14)}
            color={isDarkMode ? "#ffffff" : "#ff4444"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddCard = () => {
    const totalItems = notesData.length + 1;
    const isLastInRow = totalItems % numColumns === 0;
    const isFullRow = notesData.length % numColumns === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAddNote}
        style={{
          width: cardWidth,
          height: cardHeight,
          backgroundColor: isDarkMode ? "rgba(157,0,212,0.08)" : "rgba(157,0,212,0.04)",
          borderRadius: getResponsiveSize(16),
          borderWidth: 1.2,
          borderStyle: "dashed",
          borderColor: ACCENT,
          padding: getResponsiveSize(14),
          justifyContent: "center",
          alignItems: "center",
          marginRight: isLastInRow ? 0 : cardSpacing,
          marginBottom: cardSpacing,
        }}
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {isDarkMode ? (
            <Image
              source={require("../../assets/images/folder-light.png")}
              style={{
                width: getResponsiveSize(isTablet ? 26 : 30),
                height: getResponsiveSize(isTablet ? 26 : 30),
              }}
            />
          ) : (
            <Image
              source={folderDarkPng}
              style={{
                width: getResponsiveSize(isTablet ? 26 : 30),
                height: getResponsiveSize(isTablet ? 26 : 30),
              }}
            />
          )}
          <Text
            style={{
              fontSize: addNoteFontSize,
              fontFamily: "Manrope_600SemiBold",
              color: ACCENT,
              marginTop: getResponsiveSize(8),
              textAlign: "center",
            }}
          >
            {notesData.length === 0 ? "Add Your First Note" : "Add New Note"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const displayData = [...notesData, { id: "add" }] as any[];

  return (
    <View
      style={{
        paddingHorizontal: getPadding(),
        paddingVertical: getResponsiveSize(20),
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
        flex: 1,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: getSpacing(),
        }}
      >
        <Text
          style={{
            fontSize: headerFontSize + 3,
            fontFamily: "Manrope_800ExtraBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Your Notes
        </Text>
        {notesData.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Home/noted")}>
            <Text
              style={{
                fontSize: seeAllFontSize,
                fontFamily: "Manrope_600SemiBold",
                color: ACCENT,
              }}
            >
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes Grid */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text
            style={{
              color: isDarkMode ? "#ffffff" : "#000000",
              fontSize: cardTitleFontSize,
              fontFamily: "Manrope_400Regular",
            }}
          >
            Loading notes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={({ item, index }) =>
            item.id === "add" ? renderAddCard() : renderNoteCard({ item, index })
          }
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          scrollEnabled={false}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
          contentContainerStyle={{
            paddingBottom: getSpacing(),
          }}
        />
      )}
    </View>
  );
}