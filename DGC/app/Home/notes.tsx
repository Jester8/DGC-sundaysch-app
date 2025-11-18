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

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function Note() {
  const { width } = useWindowDimensions();
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

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isPhone = width <= 600;

  const containerPadding = getResponsiveSize(12);
  const cardSpacing = getResponsiveSize(16);
  const cardWidth = (width - containerPadding * 5 - cardSpacing) / 2;
  const headerFontSize = isPhone ? 14 : getResponsiveSize(11);
  const headerMarginRight = getResponsiveSize(10);
  const seeAllFontSize = isPhone ? 14 : getResponsiveSize(10);
  const cardTitleFontSize = getResponsiveSize(10);

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
    const isLastCard = index === notesData.length - 1;

    return (
      <View
        style={{
          width: cardWidth,
          height: cardWidth * 0.6,
          marginRight: isLastCard ? 15 : cardSpacing,
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
            backgroundColor: "#9d00d4",
            borderRadius: getResponsiveSize(16),
            padding: getResponsiveSize(16),
            justifyContent: "flex-end",
          }}
        >
          <Text
            numberOfLines={3}
            style={{
              fontSize: cardTitleFontSize,
              fontFamily: "Poppins_600SemiBold",
              color: "#ffffff",
            }}
          >
            {item.title || "Untitled Note"}
          </Text>
          <Text
            style={{
              fontSize: getResponsiveSize(8),
              fontFamily: "Poppins_400Regular",
              color: "rgba(255,255,255,0.7)",
              marginTop: getResponsiveSize(8),
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
            top: getResponsiveSize(8),
            right: getResponsiveSize(8),
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: getResponsiveSize(20),
            padding: getResponsiveSize(6),
          }}
        >
          <MaterialIcons
            name="delete"
            size={getResponsiveSize(10)}
            color={isDarkMode ? "#ffffff" : "#ffffffff"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddCard = () => {
    const isLastCard = notesData.length === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleAddNote}
        style={{
          width: cardWidth,
          height: cardWidth * 0.6,
          backgroundColor: "transparent",
          borderRadius: getResponsiveSize(16),
          borderWidth: 1,
          borderColor: isDarkMode ? "#333333" : "#000000",
          padding: getResponsiveSize(16),
          justifyContent: "center",
          alignItems: "center",
          marginRight: isLastCard ? 0 : cardSpacing,
          marginBottom: cardSpacing,
        }}
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {isDarkMode ? (
            <Image
              source={require("../../assets/images/folder-light.png")}
              style={{
                width: getResponsiveSize(40),
                height: getResponsiveSize(40),
              }}
            />
          ) : (
            <Image
              source={folderDarkPng}
              style={{
                width: getResponsiveSize(40),
                height: getResponsiveSize(40),
              }}
            />
          )}
          <Text
            style={{
              fontSize: getResponsiveSize(10),
              fontFamily: "Poppins_500Medium",
              color: isDarkMode ? "#b0b0b0" : "#666666",
              marginTop: getResponsiveSize(8),
              textAlign: "center",
            }}
          >
            Add Your First Note
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const displayData = [...notesData, { id: "add" }] as any[];

  return (
    <View
      style={{
        paddingHorizontal: containerPadding,
        paddingVertical: getResponsiveSize(20),
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
        flex: 1,
        marginLeft: headerMarginRight,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: getResponsiveSize(16),
          marginLeft: headerMarginRight,
        }}
      >
        <Text
          style={{
            fontSize: headerFontSize,
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Your Notes
        </Text>
        {notesData.length > 0 && (
          <TouchableOpacity activeOpacity={0.7}>
            <Text
              style={{
                fontSize: seeAllFontSize,
                fontFamily: "Poppins_600SemiBold",
                color: isDarkMode ? "#ffffff" : "#000000",
                marginRight: headerMarginRight,
              }}
            >
              See all 
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes Grid */}
      {loading ? (
        <Text
          style={{
            color: isDarkMode ? "#ffffff" : "#000000",
            textAlign: "center",
            marginTop: getResponsiveSize(20),
          }}
        >
          Loading notes...
        </Text>
      ) : (
        <FlatList
          data={displayData}
          renderItem={({ item, index }) =>
            item.id === "add" ? renderAddCard() : renderNoteCard({ item, index })
          }
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{
            justifyContent: "space-between",
          }}
        />
      )}
    </View>
  );
}