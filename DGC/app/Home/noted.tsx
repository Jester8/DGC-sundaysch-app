import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function Noted() {
  const { isDarkMode } = useNavigation();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isTablet = width >= 768;
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  // Load notes from AsyncStorage
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const savedNotes = await AsyncStorage.getItem("notes");
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
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

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Responsive font sizes
  const getResponsiveFontSize = (baseSize: number) => {
    return isTablet ? baseSize * 0.8 : baseSize * 0.9;
  };

  // Responsive icon sizes
  const getResponsiveIconSize = (baseSize: number) => {
    return isTablet ? baseSize * 0.7 : baseSize;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[
          styles.subtitle, 
          { 
            color: isDarkMode ? "#FFF" : "#000",
            fontSize: getResponsiveFontSize(24)
          }
        ]}>
          Notes
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              borderColor: isDarkMode ? "#333" : "#000",
              backgroundColor: isDarkMode ? "#1a1a1a" : "#FFFFFF",
            },
          ]}
        >
          <Feather
            name="search"
            size={getResponsiveIconSize(16)}
            color={isDarkMode ? "#666" : "#999"}
          />
          <TextInput
            style={[
              styles.searchInput, 
              { 
                color: isDarkMode ? "#FFF" : "#000",
                fontSize: getResponsiveFontSize(12)
              }
            ]}
            placeholder="Search"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Notes List or Empty State */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={{ 
              color: isDarkMode ? "#FFF" : "#000",
              fontSize: getResponsiveFontSize(12)
            }}>
              Loading notes...
            </Text>
          </View>
        ) : filteredNotes.length > 0 ? (
          <View style={styles.notesGrid}>
            {filteredNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                onPress={() => handleNotePress(note.id)}
              >
                <Text style={[
                  styles.noteTitle, 
                  { fontSize: getResponsiveFontSize(12) }
                ]} numberOfLines={3}>
                  {note.title || "Untitled Note"}
                </Text>
                <Text style={[
                  styles.noteDate, 
                  { fontSize: getResponsiveFontSize(10) }
                ]} numberOfLines={2}>
                  {note.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <View style={styles.emptyStateContent}>
              <MaterialIcons
                name="note"
                size={getResponsiveIconSize(48)}
                color={isDarkMode ? "#666" : "#ccc"}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { 
                    color: isDarkMode ? "#FFF" : "#000",
                    fontSize: getResponsiveFontSize(16)
                  },
                ]}
              >
                No Notes Yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { 
                    color: isDarkMode ? "#999" : "#666",
                    fontSize: getResponsiveFontSize(12)
                  },
                ]}
              >
                Create your first note 
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          isTablet ? styles.fabTabletTop : styles.fabPhoneBottom,
          { backgroundColor: isDarkMode ? "#1a1a1a" : "#000000" },
        ]}
        onPress={handleAddNote}
      >
        <Feather name="plus" size={getResponsiveIconSize(20)} color={isDarkMode ? "#B800E6" : "#FFFFFF"} />
      </TouchableOpacity>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 20,
    fontFamily: "Poppins_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: "Poppins_400Regular",
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 100,
  },
  noteCard: {
    width: "48%",
    backgroundColor: "#B800E6",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    justifyContent: "space-between",
  },
  noteTitle: {
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 16,
  },
  noteDate: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    marginBottom: 100,
  },
  emptyStateContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontWeight: "600",
    marginTop: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  emptyStateSubtitle: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  fabPhoneBottom: {
    bottom: 200,
  },
  fabTabletTop: {
    top: 880,
  },
});