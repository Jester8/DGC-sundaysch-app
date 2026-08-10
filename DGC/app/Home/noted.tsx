import { useState, useCallback } from "react";
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

const ACCENT = "#9d00d4";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

// A handful of soft accent tints cycled per card so the grid doesn't read as
// one flat block of identical cards — purely cosmetic, no data behind it.
const CARD_ACCENTS_LIGHT = ["#f3e5fb", "#e8f0fe", "#fdece9", "#eafaf0"];
const CARD_ACCENTS_DARK = ["#241a2e", "#1a2233", "#2b1c1a", "#16261e"];

export default function Noted() {
  const { isDarkMode } = useNavigation();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isTablet = width >= 768;
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const savedNotes = await AsyncStorage.getItem("notes");
      setNotes(savedNotes ? JSON.parse(savedNotes) : []);
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
    router.push({ pathname: "/Home/Notepad", params: { noteId: "null" } });
  };

  const handleNotePress = (noteId: string) => {
    router.push({ pathname: "/Home/Notepad", params: { noteId } });
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const getResponsiveFontSize = (baseSize: number) => (isTablet ? baseSize * 0.8 : baseSize * 0.9);
  const getResponsiveIconSize = (baseSize: number) => (isTablet ? baseSize * 0.7 : baseSize);

  const accents = isDarkMode ? CARD_ACCENTS_DARK : CARD_ACCENTS_LIGHT;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.subtitle, { color: isDarkMode ? "#FFF" : "#000", fontSize: getResponsiveFontSize(26) }]}
          >
            Notes
          </Text>
          {!loading && notes.length > 0 && (
            <View style={[styles.countPill, { backgroundColor: isDarkMode ? "#241a2e" : "#f3e5fb" }]}>
              <Text style={[styles.countPillText, { color: ACCENT }]}>{notes.length}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              borderColor: isDarkMode ? "#2a2a2a" : "#ececec",
              backgroundColor: isDarkMode ? "#141414" : "#f7f7f7",
            },
          ]}
        >
          <Feather name="search" size={getResponsiveIconSize(17)} color={isDarkMode ? "#777" : "#999"} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? "#FFF" : "#000", fontSize: getResponsiveFontSize(13) }]}
            placeholder="Search your notes"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <MaterialIcons name="close" size={getResponsiveIconSize(18)} color={isDarkMode ? "#777" : "#999"} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={{ color: isDarkMode ? "#888" : "#999", fontSize: getResponsiveFontSize(13) }}>
              Loading notes…
            </Text>
          </View>
        ) : filteredNotes.length > 0 ? (
          <View style={styles.notesGrid}>
            {filteredNotes.map((note, index) => (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.75}
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: accents[index % accents.length],
                    borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  },
                ]}
                onPress={() => handleNotePress(note.id)}
              >
                <MaterialIcons name="description" size={getResponsiveIconSize(16)} color={ACCENT} style={{ marginBottom: 8 }} />
                <Text
                  style={[styles.noteTitle, { fontSize: getResponsiveFontSize(13), color: isDarkMode ? "#F5F5F5" : "#1a1a1a" }]}
                  numberOfLines={3}
                >
                  {note.title || "Untitled Note"}
                </Text>
                <Text
                  style={[styles.noteDate, { fontSize: getResponsiveFontSize(10.5), color: isDarkMode ? "#9a9a9a" : "#777777" }]}
                  numberOfLines={1}
                >
                  {note.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <View style={styles.emptyStateContent}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? "#241a2e" : "#f3e5fb" }]}>
                <MaterialIcons name="edit-note" size={getResponsiveIconSize(40)} color={ACCENT} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: isDarkMode ? "#FFF" : "#000", fontSize: getResponsiveFontSize(17) }]}>
                {searchText ? "No notes match your search" : "No notes yet"}
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: isDarkMode ? "#999" : "#666", fontSize: getResponsiveFontSize(13) }]}>
                {searchText ? "Try a different keyword." : "Jot down what stands out as you read a manual."}
              </Text>
              {!searchText && (
                <TouchableOpacity style={styles.emptyStateCta} onPress={handleAddNote} activeOpacity={0.85}>
                  <Feather name="plus" size={getResponsiveIconSize(15)} color="#FFFFFF" />
                  <Text style={[styles.emptyStateCtaText, { fontSize: getResponsiveFontSize(13) }]}>New Note</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, isTablet ? styles.fabTabletTop : styles.fabPhoneBottom]} onPress={handleAddNote} activeOpacity={0.85}>
        <Feather name="plus" size={getResponsiveIconSize(22)} color="#FFFFFF" />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  subtitle: {
    fontFamily: "Manrope_800ExtraBold",
  },
  countPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countPillText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  noteCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 104,
    justifyContent: "flex-end",
  },
  noteTitle: {
    fontFamily: "Manrope_700Bold",
    lineHeight: 18,
    marginBottom: 8,
  },
  noteDate: {
    fontFamily: "Manrope_500Medium",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 320,
  },
  emptyStateContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontFamily: "Manrope_700Bold",
    textAlign: "center",
  },
  emptyStateSubtitle: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Manrope_400Regular",
    lineHeight: 19,
  },
  emptyStateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACCENT,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 20,
  },
  emptyStateCtaText: {
    fontFamily: "Manrope_700Bold",
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  fabPhoneBottom: {
    bottom: 100,
  },
  fabTabletTop: {
    top: 880,
  },
});
