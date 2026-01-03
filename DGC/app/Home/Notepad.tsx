import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigation } from "./_navigationContext";
import * as ImagePicker from "expo-image-picker";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
  images?: string[];
}

interface FormattedSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
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
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Formatting state
  const [formattedSegments, setFormattedSegments] = useState<FormattedSegment[]>([]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");

  const getResponsiveSize = (baseSize: number) => {
    const scale = width / 375;
    return Math.max(baseSize * scale, baseSize * 0.8);
  };

  const isPhone = width <= 600;

  const getHeaderIconSize = () => (isPhone ? 18 : getResponsiveSize(14));
  const getHeaderTextSize = () => (isPhone ? 14 : getResponsiveSize(10));
  const getTitleInputSize = () => (isPhone ? 16 : getResponsiveSize(10));
  const getContentInputSize = () => (isPhone ? 12 : getResponsiveSize(12));
  const getToolbarIconSize = () => (isPhone ? getResponsiveSize(24) : 14);

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
          setImages(note.images || []);
          parseFormattedContent(note.content);
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const parseFormattedContent = (text: string) => {
    const segments: FormattedSegment[] = [];
    let i = 0;

    while (i < text.length) {
      let bold = false;
      let italic = false;
      let underline = false;
      let color = "#000000";

      // Check for formatting markers
      if (text.substr(i, 2) === "**") {
        bold = true;
        i += 2;
      }
      if (text.substr(i, 1) === "*" && !bold) {
        italic = true;
        i += 1;
      }
      if (text.substr(i, 2) === "__") {
        underline = true;
        i += 2;
      }

      // Check for color marker
      const colorMatch = text.substr(i).match(/^<color="#([A-Fa-f0-9]{6})">/) || 
                        text.substr(i).match(/^<color="(#[A-Fa-f0-9]{6})">/) ||
                        text.substr(i).match(/^<color='(#[A-Fa-f0-9]{6})'>/);
      if (colorMatch) {
        color = colorMatch[1].startsWith("#") ? colorMatch[1] : "#" + colorMatch[1];
        i += colorMatch[0].length;
      }

      // Find end of segment
      let endIndex = text.length;
      if (bold) endIndex = Math.min(endIndex, text.indexOf("**", i));
      if (italic) endIndex = Math.min(endIndex, text.indexOf("*", i));
      if (underline) endIndex = Math.min(endIndex, text.indexOf("__", i));

      let segmentText = text.substring(i, endIndex);
      
      // Remove closing tags
      segmentText = segmentText.replace(/\*\*$/, "").replace(/\*$/, "").replace(/__$/, "").replace(/<\/color>$/, "");

      if (segmentText) {
        segments.push({
          text: segmentText,
          bold,
          italic,
          underline,
          color,
        });
      }

      i = endIndex + (bold ? 2 : italic ? 1 : underline ? 2 : 0);
    }

    setFormattedSegments(segments);
  };

  const autoSaveNote = useCallback(async (newTitle: string, newContent: string, newImages: string[] = []) => {
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
            images: newImages,
          };
        }
      } else if (newTitle.trim()) {
        const newNote: NoteItem = {
          id: Date.now().toString(),
          title: newTitle,
          content: newContent,
          date: currentDate,
          images: newImages,
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
    autoSaveNote(text, content, images);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    parseFormattedContent(text);
    autoSaveNote(title, text, images);
  };

  const handleDeleteNote = async () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
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
    ]);
  };

  const applyFormatting = (format: "bold" | "italic" | "underline" | "color", colorValue?: string) => {
    if (!selectedRange || selectedRange.start === selectedRange.end) {
      Alert.alert("Select Text", "Please select text to format");
      return;
    }

    const before = content.substring(0, selectedRange.start);
    const selectedText = content.substring(selectedRange.start, selectedRange.end);
    const after = content.substring(selectedRange.end);

    let formattedText = selectedText;

    if (format === "bold") {
      formattedText = isBold ? selectedText.replace(/\*\*/g, "") : `**${selectedText}**`;
    } else if (format === "italic") {
      formattedText = isItalic ? selectedText.replace(/\*/g, "") : `*${selectedText}*`;
    } else if (format === "underline") {
      formattedText = isUnderline ? selectedText.replace(/__/g, "") : `__${selectedText}__`;
    } else if (format === "color" && colorValue) {
      formattedText = `<color="${colorValue}">${selectedText}</color>`;
    }

    const newContent = before + formattedText + after;
    setContent(newContent);
    parseFormattedContent(newContent);
    autoSaveNote(title, newContent, images);
    setShowFormatMenu(false);
    setSelectedRange(null);
  };

  const handleBulletList = () => {
    const newContent = content + "\n• ";
    setContent(newContent);
    autoSaveNote(title, newContent, images);
  };

  const handleNumberedList = () => {
    const lines = content.split("\n");
    const lastLine = lines[lines.length - 1];
    const match = lastLine.match(/^(\d+)\./);
    const nextNumber = match ? parseInt(match[1]) + 1 : 1;
    const newContent = content + `\n${nextNumber}. `;
    setContent(newContent);
    autoSaveNote(title, newContent, images);
  };

  const launchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Camera access is required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const newImages = [...images, imageUri];
        setImages(newImages);
        autoSaveNote(title, content, newImages);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to launch camera");
      console.error(error);
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const newImages = [...images, imageUri];
        setImages(newImages);
        autoSaveNote(title, content, newImages);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image from library");
      console.error(error);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    autoSaveNote(title, content, newImages);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: getResponsiveSize(16),
          paddingVertical: getResponsiveSize(50),
          paddingBottom: getResponsiveSize(12),
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

       
      </View>

      

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>Loading note...</Text>
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

          {/* Images Display */}
          {images.length > 0 && (
            <View
              style={{
                marginTop: getResponsiveSize(20),
                marginBottom: getResponsiveSize(20),
              }}
            >
              <Text
                style={{
                  color: isDarkMode ? "#ffffff" : "#000000",
                  fontFamily: "Poppins_600SemiBold",
                  marginBottom: getResponsiveSize(12),
                  fontSize: 14,
                }}
              >
                Attached Images ({images.length})
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: getResponsiveSize(12),
                }}
              >
                {images.map((imageUri, index) => (
                  <View
                    key={index}
                    style={{
                      position: "relative",
                      width: getResponsiveSize(100),
                      height: getResponsiveSize(100),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImageIndex(index);
                        setShowImageModal(true);
                      }}
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "#ff4444",
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: getResponsiveSize(120) }} />
        </ScrollView>
      )}

      {/* Bottom Toolbar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? "#333333" : "#e0e0e0",
          backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
          paddingTop: getResponsiveSize(16),
          paddingBottom: getResponsiveSize(40),
          paddingHorizontal: getResponsiveSize(12),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {/* Bullet List */}
          <TouchableOpacity onPress={handleBulletList} style={{ alignItems: "center", padding: 8 }}>
            <MaterialIcons
              name="format-list-bulleted"
              size={getToolbarIconSize()}
               color={isDarkMode ? "#ffffff" : "#000000ff"}
            />
          </TouchableOpacity>

          {/* Numbered List */}
          <TouchableOpacity onPress={handleNumberedList} style={{ alignItems: "center", padding: 8 }}>
            <MaterialIcons
              name="format-list-numbered"
              size={getToolbarIconSize()}
             color={isDarkMode ? "#ffffff" : "#000000ff"}
            />
          </TouchableOpacity>

      
          {/* Camera */}
          <TouchableOpacity
            onPress={launchCamera}
            style={{ alignItems: "center", padding: 8 }}
          >
            <MaterialIcons
              name="photo-camera"
              size={getToolbarIconSize()}
              color={isDarkMode ? "#ffffff" : "#000000ff"}
            />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity
            onPress={pickImageFromLibrary}
            style={{ alignItems: "center", padding: 8 }}
          >
            <MaterialIcons
              name="image"
              size={getToolbarIconSize()}
             color={isDarkMode ? "#ffffff" : "#000000ff"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={30} color="#ffffff" />
          </TouchableOpacity>
          {images[selectedImageIndex] && (
            <Image
              source={{ uri: images[selectedImageIndex] }}
              style={{ width: "100%", height: "80%", resizeMode: "contain" }}
            />
          )}
        </View>
      </Modal>

    </View>
  );
}