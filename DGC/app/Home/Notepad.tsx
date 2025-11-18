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

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
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
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [textSegments, setTextSegments] = useState<TextSegment[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isTablet = width > 600;
  const isPhone = width <= 600;

  const getHeaderIconSize = () => isPhone ? 20 : getResponsiveSize(14);
  const getHeaderTextSize = () => isPhone ? 16 : getResponsiveSize(10);
  const getTitleInputSize = () => isPhone ? 14 : getResponsiveSize(10);
  const getContentInputSize = () => isPhone ? 12 : getResponsiveSize(12);

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

  const handleBulletList = () => {
    const before = content.substring(0, cursorPosition);
    const after = content.substring(cursorPosition);
    const newContent = before + "• " + after;
    setContent(newContent);
    autoSaveNote(title, newContent);
    setCursorPosition(cursorPosition + 2);
  };

  const handleNumberedListClick = () => {
    setShowFormatMenu(true);
  };

  const applyNumberedList = () => {
    const lineNumber = (content.substring(0, cursorPosition).match(/\n/g) || []).length + 1;
    const before = content.substring(0, cursorPosition);
    const after = content.substring(cursorPosition);
    const newContent = before + `${lineNumber}. ` + after;
    setContent(newContent);
    autoSaveNote(title, newContent);
    setCursorPosition(cursorPosition + `${lineNumber}. `.length);
    setShowFormatMenu(false);
  };

  const applyBold = () => {
    const selectedText = content.substring(selectedRange?.start || cursorPosition, selectedRange?.end || cursorPosition);
    if (selectedText.length === 0) {
      const before = content.substring(0, cursorPosition);
      const after = content.substring(cursorPosition);
      const newContent = before + "**bold text**" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    } else {
      const before = content.substring(0, selectedRange!.start);
      const after = content.substring(selectedRange!.end);
      const newContent = before + "**" + selectedText + "**" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    }
    setShowFormatMenu(false);
    setSelectedRange(null);
  };

  const applyItalic = () => {
    const selectedText = content.substring(selectedRange?.start || cursorPosition, selectedRange?.end || cursorPosition);
    if (selectedText.length === 0) {
      const before = content.substring(0, cursorPosition);
      const after = content.substring(cursorPosition);
      const newContent = before + "*italic text*" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    } else {
      const before = content.substring(0, selectedRange!.start);
      const after = content.substring(selectedRange!.end);
      const newContent = before + "*" + selectedText + "*" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    }
    setShowFormatMenu(false);
    setSelectedRange(null);
  };

  const applyUnderline = () => {
    const selectedText = content.substring(selectedRange?.start || cursorPosition, selectedRange?.end || cursorPosition);
    if (selectedText.length === 0) {
      const before = content.substring(0, cursorPosition);
      const after = content.substring(cursorPosition);
      const newContent = before + "__underlined text__" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    } else {
      const before = content.substring(0, selectedRange!.start);
      const after = content.substring(selectedRange!.end);
      const newContent = before + "__" + selectedText + "__" + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    }
    setShowFormatMenu(false);
    setSelectedRange(null);
  };

  const applyColor = (color: string) => {
    const selectedText = content.substring(selectedRange?.start || cursorPosition, selectedRange?.end || cursorPosition);
    if (selectedText.length === 0) {
      const before = content.substring(0, cursorPosition);
      const after = content.substring(cursorPosition);
      const newContent = before + `<color="${color}">colored text</color>` + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    } else {
      const before = content.substring(0, selectedRange!.start);
      const after = content.substring(selectedRange!.end);
      const newContent = before + `<color="${color}">` + selectedText + `</color>` + after;
      setContent(newContent);
      autoSaveNote(title, newContent);
    }
    setShowFormatMenu(false);
    setSelectedRange(null);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
      {/* Header - Centered */}
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
            size={getHeaderIconSize()}
            color={isDarkMode ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: getHeaderTextSize(),
            fontFamily: "Poppins_600SemiBold",
            color: isDarkMode ? "#ffffff" : "#000000",
            flex: 1,
            textAlign: "center",
          }}
        >
          NOTE
        </Text>

        <View style={{ width: getResponsiveSize(24) }} />
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
              fontSize: getTitleInputSize(),
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
            onSelectionChange={(e) => {
              setCursorPosition(e.nativeEvent.selection.start);
              setSelectedRange({
                start: e.nativeEvent.selection.start,
                end: e.nativeEvent.selection.end,
              });
            }}
            multiline
            style={{
              fontSize: getContentInputSize(),
              fontFamily: "Poppins_400Regular",
              color: isDarkMode ? "#ffffff" : "#000000",
              minHeight: 300,
              textAlignVertical: "top",
              lineHeight: getResponsiveSize(20),
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
          paddingHorizontal: getResponsiveSize(12),
        }}
      >
        {/* Formatting Options Row */}
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
              color={isDarkMode ? "#9d00d4" : "#9d00d4"}
            />
          </TouchableOpacity>

          {/* Numbered List with Format Menu */}
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingHorizontal: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(8),
            }}
            onPress={handleNumberedListClick}
          >
            <MaterialIcons
              name="format-list-numbered"
              size={getResponsiveSize(24)}
              color={isDarkMode ? "#9d00d4" : "#9d00d4"}
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
              color={isDarkMode ? "#9d00d4" : "#9d00d4"}
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
              color={isDarkMode ? "#9d00d4" : "#9d00d4"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Format Menu Modal */}
      {showFormatMenu && (
        <View
          style={{
            position: "absolute",
            bottom: getResponsiveSize(100),
            left: 0,
            right: 0,
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f0f0f0",
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? "#444" : "#ddd",
            paddingVertical: getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(16),
          }}
        >
          {/* Numbered List Option */}
          <TouchableOpacity
            style={{
              paddingVertical: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(12),
              marginBottom: getResponsiveSize(8),
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={applyNumberedList}
          >
            <MaterialIcons
              name="format-list-numbered"
              size={getResponsiveSize(20)}
              color={isDarkMode ? "#9d00d4" : "#9d00d4"}
              style={{ marginRight: getResponsiveSize(12) }}
            />
            <Text
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: getResponsiveSize(9),
                fontFamily: "Poppins_400Regular",
              }}
            >
              Add Numbered List
            </Text>
          </TouchableOpacity>

          {/* Bold Option */}
          <TouchableOpacity
            style={{
              paddingVertical: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(12),
              marginBottom: getResponsiveSize(8),
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={applyBold}
          >
            <Text
              style={{
                color: isDarkMode ? "#9d00d4" : "#9d00d4",
                fontSize: getResponsiveSize(14),
                fontWeight: "bold",
                marginRight: getResponsiveSize(12),
              }}
            >
              B
            </Text>
            <Text
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: getResponsiveSize(9),
                fontFamily: "Poppins_400Regular",
              }}
            >
              Bold
            </Text>
          </TouchableOpacity>

          {/* Italic Option */}
          <TouchableOpacity
            style={{
              paddingVertical: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(12),
              marginBottom: getResponsiveSize(8),
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={applyItalic}
          >
            <Text
              style={{
                color: isDarkMode ? "#9d00d4" : "#9d00d4",
                fontSize: getResponsiveSize(14),
                fontStyle: "italic",
                marginRight: getResponsiveSize(12),
              }}
            >
              I
            </Text>
            <Text
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: getResponsiveSize(9),
                fontFamily: "Poppins_400Regular",
              }}
            >
              Italic
            </Text>
          </TouchableOpacity>

          {/* Underline Option */}
          <TouchableOpacity
            style={{
              paddingVertical: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(12),
              marginBottom: getResponsiveSize(8),
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={applyUnderline}
          >
            <Text
              style={{
                color: isDarkMode ? "#9d00d4" : "#9d00d4",
                fontSize: getResponsiveSize(14),
                textDecorationLine: "underline",
                marginRight: getResponsiveSize(12),
              }}
            >
              U
            </Text>
            <Text
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: getResponsiveSize(9),
                fontFamily: "Poppins_400Regular",
              }}
            >
              Underline
            </Text>
          </TouchableOpacity>

          {/* Color Options */}
          <Text
            style={{
              color: isDarkMode ? "#ffffff" : "#000000",
              fontSize: getResponsiveSize(9),
              fontFamily: "Poppins_600SemiBold",
              marginBottom: getResponsiveSize(8),
              marginTop: getResponsiveSize(4),
            }}
          >
            Color
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: getResponsiveSize(8),
            }}
          >
            {["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"].map((color) => (
              <TouchableOpacity
                key={color}
                style={{
                  width: getResponsiveSize(32),
                  height: getResponsiveSize(32),
                  borderRadius: 16,
                  backgroundColor: color,
                  borderWidth: 2,
                  borderColor: isDarkMode ? "#444" : "#ddd",
                }}
                onPress={() => applyColor(color)}
              />
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={{
              paddingVertical: getResponsiveSize(12),
              paddingHorizontal: getResponsiveSize(12),
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => setShowFormatMenu(false)}
          >
            <Text
              style={{
                color: isDarkMode ? "#ffffff" : "#000000",
                fontSize: getResponsiveSize(9),
                fontFamily: "Poppins_400Regular",
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overlay to close menu */}
      {showFormatMenu && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={() => setShowFormatMenu(false)}
          activeOpacity={1}
        />
      )}
    </View>
  );
}