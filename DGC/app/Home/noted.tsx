import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";

interface Note {
  id: string;
  title: string;
  date: string;
}

export default function Noted() {
  const { isDarkMode } = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Who is The King od The Kingdom | Sept....",
      date: "Worship - September 21st, 2025",
    },
    {
      id: "2",
      title: "The Heart of Worship",
      date: "Worship - September 21st, 2025",
    },
    {
      id: "3",
      title: "Worship - September 21st, 2025",
      date: "Worship - September 21st, 2025",
    },
    {
      id: "4",
      title: "Worship - September 21st, 2025",
      date: "Worship - September 21st, 2025",
    },
    {
      id: "5",
      title: "Worship - September 21st, 2025",
      date: "Worship - September 21st, 2025",
    },
    {
      id: "6",
      title: "Worship - September 21st, 2025",
      date: "Worship - September 21st, 2025",
    },
  ]);
  const [searchText, setSearchText] = useState("");

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      date: new Date().toLocaleDateString(),
    };
    setNotes([newNote, ...notes]);
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

        <View style={styles.notesGrid}>
          {filteredNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={styles.noteCard}
            >
              <Text style={styles.noteTitle} numberOfLines={3}>
                {note.title}
              </Text>
              <Text style={styles.noteDate} numberOfLines={2}>
                {note.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 2,
    fontFamily: "Poppins_700Bold",
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
  noteCard: {
    width: "48%",
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
    bottom: 150,
  },
  fabTabletTop: {
    top: 880,
  },
});