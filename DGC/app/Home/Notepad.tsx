import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigation } from "./_navigationContext";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function Notepad() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDarkMode } = useNavigation();
  const contentInputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  useEffect(() => {
    if (params?.noteId && params.noteId !== "null") {
      loadNote(params.noteId as string);
    }
  }, [params?.noteId]);

  const loadNote = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const savedNotes = await AsyncStorage.getItem("notes");
      if (savedNotes) {
        const notes: NoteItem[] = JSON.parse(savedNotes);
        const note = notes.find((n) => n.id === id);
        if (note) {
          setTitle(note.title);
          setContent(note.content);
          setNoteId(note.id);
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const autoSaveNote = useCallback(async (newTitle: string, newContent: string) => {
    try {
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      let notes: NoteItem[] = [];
      const savedNotes = await AsyncStorage.getItem("notes");
      if (savedNotes) {
        notes = JSON.parse(savedNotes);
      }

      if (noteId) {
        const index = notes.findIndex((n) => n.id === noteId);
        if (index !== -1) {
          notes[index] = {
            id: noteId,
            title: newTitle,
            content: newContent,
            date: currentDate,
          };
        }
      } else if (newTitle.trim()) {
        const newNote: NoteItem = {
          id: Date.now().toString(),
          title: newTitle,
          content: newContent,
          date: currentDate,
        };
        notes.push(newNote);
        setNoteId(newNote.id);
      }

      await AsyncStorage.setItem("notes", JSON.stringify(notes));
    } catch (error) {
      console.error("Error auto-saving note:", error);
    }
  }, [noteId]);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    autoSaveNote(text, content);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    autoSaveNote(title, text);
  };

  const handleDeleteNote = async () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const savedNotes = await AsyncStorage.getItem("notes");
              if (savedNotes && noteId) {
                let notes: NoteItem[] = JSON.parse(savedNotes);
                notes = notes.filter((n) => n.id !== noteId);
                await AsyncStorage.setItem("notes", JSON.stringify(notes));
                router.back();
              }
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Error", "Failed to delete note");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const insertText = (textToInsert: string) => {
    const before = content.substring(0, cursorPosition);
    const after = content.substring(cursorPosition);
    const newContent = before + textToInsert + after;
    setContent(newContent);
    autoSaveNote(title, newContent);
    setCursorPosition(cursorPosition + textToInsert.length);
  };

  const handleBulletList = () => {
    insertText("• ");
  };

  const handleNumberedList = () => {
    const lineNumber = (content.substring(0, cursorPosition).match(/\n/g) || []).length + 1;
    insertText(`${lineNumber}. `);
  };

  const handleAddUser = () => {
    insertText("@user ");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
      {/* Header - Moved down with more padding */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: getResponsiveSize(16),
          paddingVertical: getResponsiveSize(50),
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? "#333333" : "#e0e0e0",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={getResponsiveSize(24)}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: getResponsiveSize(16),
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          NOTE
        </Text>

        <TouchableOpacity onPress={handleDeleteNote} disabled={!noteId}>
          <MaterialIcons
            name="delete"
            size={getResponsiveSize(24)}
            color={noteId ? (isDarkMode ? "#ff4444" : "#cc0000") : (isDarkMode ? "#666666" : "#cccccc")}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isDarkMode ? "#ffffff" : "#000000",
            }}
          >
            Loading note...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{
            flex: 1,
            paddingHorizontal: getResponsiveSize(16),
            paddingVertical: getResponsiveSize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <TextInput
            placeholder="Note Title"
            placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
            value={title}
            onChangeText={handleTitleChange}
            style={{
              fontSize: getResponsiveSize(20),
              fontFamily: "Poppins_600SemiBold",
              color: isDarkMode ? "#ffffff" : "#000000",
              marginBottom: getResponsiveSize(24),
              paddingVertical: getResponsiveSize(12),
            }}
          />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            placeholder="Write your note..."
            placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
            value={content}
            onChangeText={handleContentChange}
            onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
            multiline
            style={{
              fontSize: getResponsiveSize(14),
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#ffffff" : "#000000",
              minHeight: 300,
              textAlignVertical: "top",
              lineHeight: getResponsiveSize(22),
            }}
          />

          <View style={{ height: getResponsiveSize(100) }} />
        </ScrollView>
      )}

      {/* Bottom Toolbar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? "#333333" : "#e0e0e0",
          backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
          paddingVertical: getResponsiveSize(12),
          paddingHorizontal: getResponsiveSize(16),
        }}
      >
        {/* Formatting Options Row 1 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            marginBottom: getResponsiveSize(12),
          }}
        >
          {/* Bullet List */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={handleBulletList}
          >
            <MaterialIcons
              name="format-list-bulleted"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#ccb300" : "#cc9900"}
            />
          </TouchableOpacity>

          {/* Numbered List */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={handleNumberedList}
          >
            <MaterialIcons
              name="format-list-numbered"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#ccb300" : "#cc9900"}
            />
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={() => Alert.alert("Camera", "Camera feature coming soon")}
          >
            <MaterialIcons
              name="photo-camera"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#ccb300" : "#cc9900"}
            />
          </TouchableOpacity>

          {/* User/Mention */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={handleAddUser}
          >
            <MaterialIcons
              name="person"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#ccb300" : "#cc9900"}
            />
          </TouchableOpacity>

          {/* Gallery/Image */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={() => Alert.alert("Gallery", "Gallery feature coming soon")}
          >
            <MaterialIcons
              name="image"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#ccb300" : "#cc9900"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}