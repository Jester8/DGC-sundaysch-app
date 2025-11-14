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

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const updatedNotes = notes.filter((note) => note.id !== noteId);
            await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
            setNotes(updatedNotes);
            Alert.alert("Success", "Note deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete note");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: isDarkMode ? "#FFF" : "#000" }]}>
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
            size={18}
            color={isDarkMode ? "#666" : "#999"}
          />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? "#FFF" : "#000" }]}
            placeholder="Search"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Notes List or Empty State */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={{ color: isDarkMode ? "#FFF" : "#000" }}>
              Loading notes...
            </Text>
          </View>
        ) : filteredNotes.length > 0 ? (
          <View style={styles.notesGrid}>
            {filteredNotes.map((note) => (
              <View key={note.id} style={styles.noteCardContainer}>
                <TouchableOpacity
                  style={styles.noteCard}
                  onPress={() => handleNotePress(note.id)}
                >
                  <Text style={styles.noteTitle} numberOfLines={3}>
                    {note.title || "Untitled Note"}
                  </Text>
                  <Text style={styles.noteDate} numberOfLines={2}>
                    {note.date}
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeleteNote(note.id)}
                  style={styles.deleteButton}
                >
                  <MaterialIcons
                    name="delete"
                    size={16}
                    color={isDarkMode ? "#ffffff" : "#000000"}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <View style={styles.emptyStateContent}>
              <MaterialIcons
                name="note"
                size={64}
                color={isDarkMode ? "#666" : "#ccc"}
              />
              <Text
                style={[
                  styles.emptyStateTitle,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                No Notes Yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: isDarkMode ? "#999" : "#666" },
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
        <Feather name="plus" size={28} color={isDarkMode ? "#B800E6" : "#FFFFFF"} />
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
    fontSize: 28,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 24,
    fontFamily: "Poppins_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 100,
  },
  noteCardContainer: {
    width: "48%",
    position: "relative",
  },
  noteCard: {
    backgroundColor: "#B800E6",
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    justifyContent: "space-between",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    marginTop: 12,
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
    marginBottom: 100,
  },
  emptyStateContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 12,
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