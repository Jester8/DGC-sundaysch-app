import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigation } from "./_navigationContext";
import * as ImagePicker from "expo-image-picker";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";

const ACCENT = "#9d00d4";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

// Real inline rich text (bold/italic/lists/images embedded in the flow of
// the note) instead of the old approach, which wrote **/__ markers into a
// plain TextInput and never actually rendered them as formatting.
export default function Notepad() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { isDarkMode } = useNavigation();
  const richText = useRef<RichEditor>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isPhone = width <= 600;
  const getHeaderIconSize = () => (isPhone ? 20 : getResponsiveSize(16));
  const getHeaderTextSize = () => (isPhone ? 13 : getResponsiveSize(10));
  const getTitleInputSize = () => (isPhone ? 18 : getResponsiveSize(12));

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
      if (savedNotes) notes = JSON.parse(savedNotes);

      if (noteId) {
        const index = notes.findIndex((n) => n.id === noteId);
        if (index !== -1) {
          notes[index] = { id: noteId, title: newTitle, content: newContent, date: currentDate };
        }
      } else if (newTitle.trim() || newContent.trim()) {
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

  const handleContentChange = (html: string) => {
    setContent(html);
    autoSaveNote(title, html);
  };

  const handleDeleteNote = async () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const savedNotes = await AsyncStorage.getItem("notes");
            if (savedNotes && noteId) {
              let notes: NoteItem[] = JSON.parse(savedNotes);
              notes = notes.filter((n) => n.id !== noteId);
              await AsyncStorage.setItem("notes", JSON.stringify(notes));
            }
            router.back();
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  const insertPickedImage = (uri: string) => {
    richText.current?.insertImage(uri, "max-width:100%; border-radius:8px;");
  };

  const handleAddImage = () => {
    Alert.alert("Add Image", "Choose a source", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission Denied", "Camera access is required");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) insertPickedImage(result.assets[0].uri);
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) insertPickedImage(result.assets[0].uri);
        },
      },
    ]);
  };

  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const bgColor = isDarkMode ? "#000000" : "#ffffff";
  const iconTint = isDarkMode ? "#9a9a9a" : "#555555";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: getResponsiveSize(16),
          paddingTop: getResponsiveSize(50),
          paddingBottom: getResponsiveSize(12),
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={getHeaderIconSize()} color={textColor} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: getHeaderTextSize(),
            fontFamily: "Manrope_700Bold",
            letterSpacing: 1,
            color: textColor,
          }}
        >
          NOTE
        </Text>

        {noteId ? (
          <TouchableOpacity onPress={handleDeleteNote}>
            <Ionicons name="trash-outline" size={getHeaderIconSize()} color="#ff4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: getHeaderIconSize() }} />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: textColor, fontFamily: "Manrope_400Regular" }}>Loading note...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1, paddingHorizontal: getResponsiveSize(16) }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              placeholder="Note Title"
              placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              value={title}
              onChangeText={handleTitleChange}
              style={{
                fontSize: getTitleInputSize(),
                fontFamily: "Manrope_700Bold",
                color: textColor,
                paddingVertical: getResponsiveSize(12),
              }}
            />

            <RichEditor
              ref={richText}
              initialContentHTML={content}
              onChange={handleContentChange}
              editorInitializedCallback={() => setEditorReady(true)}
              placeholder="Write your note..."
              useContainer={false}
              initialHeight={280}
              style={{ minHeight: 280, flex: 1 }}
              editorStyle={{
                backgroundColor: bgColor,
                color: textColor,
                placeholderColor: isDarkMode ? "#666666" : "#999999",
                caretColor: ACCENT,
                contentCSSText: `font-family: -apple-system, sans-serif; font-size: 15px; line-height: 22px; padding-bottom: 40px;`,
              }}
            />

            <View style={{ height: getResponsiveSize(140) }} />
          </ScrollView>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? "#2a2a2a" : "#eeeeee",
              backgroundColor: isDarkMode ? "#0d0d0d" : "#fafafa",
              paddingBottom: getResponsiveSize(24),
            }}
          >
            <RichToolbar
              editor={richText}
              disabled={!editorReady}
              iconTint={iconTint}
              selectedIconTint={ACCENT}
              disabledIconTint={isDarkMode ? "#333333" : "#cccccc"}
              style={{ backgroundColor: "transparent" }}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.setStrikethrough,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.blockquote,
                actions.insertImage,
                actions.undo,
                actions.redo,
              ]}
              onPressAddImage={handleAddImage}
            />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
