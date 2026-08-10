import React, { useEffect, useState, useRef } from "react"; 
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, useWindowDimensions, Linking, Modal, ActivityIndicator, FlatList, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from 'expo-blur';
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "./_navigationContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface MainPoint {
  title: string;
  description: string;
  references: string[];
}

interface ManualData {
  _id: string;
  id: string;
  title: string;
  theme?: string;
  memoryVerse: string;
  text: string;
  introduction: string;
  mainPoints: MainPoint[];
  classDiscussion: string;
  conclusion: string;
  declaration: string;
  month: string;
  date: string;
  order: number;
  week?: number;
  imageUrl?: string;
  subTopic?: string;
  recommendedBooks?: string[];
  feedbackLink?: string;
}

interface Verse {
  verse: number;
  text: string;
}

interface ScriptureReference {
  book: string;
  chapter: string;
  verse?: string;
}

interface BibleVersion {
  id: string;
  name: string;
  abbr: string;
}

const MANUAL_STORAGE_PREFIX = "manual_detail_jan4_";
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "NKJV", name: "New King James Version", abbr: "NKJV" },
  { id: "NLT", name: "New Living Translation", abbr: "NLT" },
  { id: "NIV", name: "New International Version", abbr: "NIV" },
  { id: "MSG", name: "The Message", abbr: "MSG" },
  { id: "AMP", name: "Amplified Bible", abbr: "AMP" },
];

const BOOK_MAP: { [key: string]: number } = {
  genesis: 1, exodus: 2, leviticus: 3, numbers: 4, deuteronomy: 5,
  joshua: 6, judges: 7, ruth: 8, 
  "1samuel": 9, "1stsamuel": 9, "isamuel": 9, "1sa": 9,
  "2samuel": 10, "2ndsamuel": 10, "iisamuel": 10, "2sa": 10,
  "1kings": 11, "1stkings": 11, "ikings": 11, "1ki": 11,
  "2kings": 12, "2ndkings": 12, "iikings": 12, "2ki": 12,
  "1chronicles": 13, "1stchronicles": 13, "ichronicles": 13, "1ch": 13,
  "2chronicles": 14, "2ndchronicles": 14, "iichronicles": 14, "2ch": 14,
  ezra: 15, nehemiah: 16, esther: 17, job: 18, psalm: 19, psalms: 19, proverbs: 20,
  ecclesiastes: 21, songofsolomon: 22, isaiah: 23, jeremiah: 24,
  lamentations: 25, ezekiel: 26, daniel: 27, hosea: 28, joel: 29, amos: 30,
  obadiah: 31, jonah: 32, micah: 33, nahum: 34, habakkuk: 35, zephaniah: 36,
  haggai: 37, zechariah: 38, malachi: 39, 
  matthew: 40, matt: 40, mt: 40,
  mark: 41, mr: 41, mk: 41,
  luke: 42, lk: 42,
  john: 43, jn: 43,
  acts: 44, ac: 44,
  romans: 45, ro: 45, rm: 45,
  "1corinthians": 46, "1stcorinthians": 46, "icorinthians": 46, "1cor": 46, "1co": 46,
  "2corinthians": 47, "2ndcorinthians": 47, "iicorinthians": 47, "2cor": 47, "2co": 47,
  galatians: 48, ga: 48, gal: 48,
  ephesians: 49, ep: 49, eph: 49,
  philippians: 50, php: 50, ph: 50,
  colossians: 51, col: 51, co: 51,
  "1thessalonians": 52, "1stthessalonians": 52, "ithessalonians": 52, "1thess": 52, "1th": 52,
  "2thessalonians": 53, "2ndthessalonians": 53, "iithessalonians": 53, "2thess": 53, "2th": 53,
  "1timothy": 54, "1sttimothy": 54, "itimothy": 54, "1tim": 54, "1ti": 54,
  "2timothy": 55, "2ndtimothy": 55, "iitimothy": 55, "2tim": 55, "2ti": 55,
  titus: 56, ti: 56, tit: 56,
  philemon: 57, phm: 57, ph: 57,
  hebrews: 58, he: 58, heb: 58, "he.": 58,
  james: 59, jas: 59, jm: 59,
  "1peter": 60, "1stpeter": 60, "ipeter": 60, "1pet": 60, "1pe": 60, "1p": 60, "1pt": 60, "1pete": 60,
  "2peter": 61, "2ndpeter": 61, "iipeter": 61, "2pet": 61, "2pe": 61, "2p": 61, "2pt": 61,
  "1john": 62, "1stjohn": 62, "ijohn": 62, "1jn": 62, "1j": 62,
  "2john": 63, "2ndjohn": 63, "iijohn": 63, "2jn": 63, "2j": 63,
  "3john": 64, "3rdjohn": 64, "iiijohn": 64, "3jn": 64, "3j": 64,
  jude: 65, ju: 65, jud: 65,
  revelation: 66, rev: 66, re: 66,
};

// Helper function to parse scripture references
const parseScriptureReference = (scriptureText: string) => {
  let text = scriptureText.trim();
  
  // Remove any trailing punctuation
  text = text.replace(/[,;.!?]+$/, '');
  
  // Enhanced book list with better handling
  const bookNames = [
    '1 Chronicles', '2 Chronicles', '1 Corinthians', '2 Corinthians',
    '1 John', '2 John', '3 John', '1 Kings', '2 Kings',
    '1 Peter', '2 Peter', '1 Samuel', '2 Samuel',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
    'Song of Solomon', 'Ecclesiastes', 'Lamentations',
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms', 'Proverbs', 'Isaiah', 'Jeremiah',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
    'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
    'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark',
    'Luke', 'John', 'Acts', 'Romans', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', 'Titus', 'Philemon',
    'Hebrews', 'James', 'Jude', 'Revelation'
  ];
  
  // Try to find which book this is with better spacing handling
  let foundBook = '';
  let remainingText = text;
  
  for (const book of bookNames) {
    const lowerBook = book.toLowerCase();
    const lowerText = text.toLowerCase();
    
    // Check multiple patterns for better matching
    if (lowerText.startsWith(lowerBook) || 
        lowerText.startsWith(lowerBook + ' ') ||
        lowerText.replace(/\s+/g, '').startsWith(lowerBook.replace(/\s+/g, ''))) {
      foundBook = book;
      
      // Find the actual book text in the original
      const bookRegex = new RegExp(book.replace(/\s+/g, '\\s*'), 'i');
      const bookMatch = text.match(bookRegex);
      if (bookMatch) {
        remainingText = text.substring(bookMatch[0].length).trim();
      }
      break;
    }
  }
  
  // Try common abbreviations
  if (!foundBook) {
    const abbrevMap: { [key: string]: string } = {
      '1 pet': '1 Peter',
      '1peter': '1 Peter',
      '1 pet.': '1 Peter',
      '1peter.': '1 Peter',
      '1pe': '1 Peter',
      '1pe.': '1 Peter',
      '1pt': '1 Peter',
      '1pt.': '1 Peter',
      '1 p': '1 Peter',
      '1p': '1 Peter',
      '2 pet': '2 Peter',
      '2peter': '2 Peter',
      '2 pet.': '2 Peter',
      '2peter.': '2 Peter',
      '2pe': '2 Peter',
      '2pe.': '2 Peter',
      '2pt': '2 Peter',
      '2pt.': '2 Peter',
      '2 p': '2 Peter',
      '2p': '2 Peter',
      'heb': 'Hebrews',
      'heb.': 'Hebrews',
      'he': 'Hebrews',
      'he.': 'Hebrews',
    };
    
    const lowerText = text.toLowerCase();
    for (const [abbrev, fullBook] of Object.entries(abbrevMap)) {
      // Check if the text starts with the abbreviation
      if (lowerText.startsWith(abbrev) || 
          lowerText.startsWith(abbrev + ' ')) {
        foundBook = fullBook;
        remainingText = text.substring(abbrev.length).trim();
        
        // Remove any period that might be after an abbreviated book
        if (remainingText.startsWith('.')) {
          remainingText = remainingText.substring(1).trim();
        }
        break;
      }
    }
  }
  
  if (!foundBook) {
    return { book: '', chapter: '', verse: '' };
  }
  
  // Parse chapter and verse with better spacing
  let chapter = '';
  let verse = '';
  
  // Handle various formats
  const chapterVerseMatch = remainingText.match(/^[\s\.]*(\d+)(?::(\d+(?:[–\-—]\d+)?)?)?/);
  
  if (chapterVerseMatch) {
    chapter = chapterVerseMatch[1];
    verse = chapterVerseMatch[2] || '';
  }
  
  return { 
    book: foundBook, 
    chapter: chapter, 
    verse: verse 
  };
};

const IntroductionFormatter = ({ text, onScripturePress, isDarkMode, fontSize, fontFamily, color, lineHeight, scale }: any) => {
  if (!text) {
    return <Text style={{ fontSize: fontSize * scale, fontFamily, color, lineHeight: lineHeight * scale }}></Text>;
  }

  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
    '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  // Add abbreviations with proper spacing
  const bookVariations = [
    ...books,
    '1 Pet', '1Pet', '1 Pet.', '1Pet.', 
    '2 Pet', '2Pet', '2 Pet.', '2Pet.',
    'Heb', 'Heb.', 
    '1 Jn', '1Jn', '1 Jn.', '1Jn.',
    '2 Jn', '2Jn', '2 Jn.', '2Jn.',
    '3 Jn', '3Jn', '3 Jn.', '3Jn.',
  ];

  // Sort by length (longest first) for proper matching
  const sortedBooks = [...bookVariations].sort((a, b) => b.length - a.length);
  
  // Create regex pattern with better spacing handling
  const bookPattern = sortedBooks
    .map(book => {
      const escapedBook = book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapedBook.replace(/\s+/g, '\\s*'); // Use \s* to handle optional spaces
    })
    .join('|');
  
  // Enhanced scripture pattern for better spacing
  const scripturePattern = new RegExp(
    `(${bookPattern})\\s*(\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?)?)`,
    'gi'
  );

  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return (
    <View>
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        const lowerLine = trimmedLine.toLowerCase();
        const isOldTestament = lowerLine.startsWith('old testament');
        const isNewTestament = lowerLine.startsWith('new testament');
        const isHeading = isOldTestament || isNewTestament;
        
        if (isHeading) {
          return (
            <Text
              key={lineIndex}
              style={{
                fontSize: fontSize * scale,
                fontFamily: "Manrope_600SemiBold",
                color: isDarkMode ? "#FFFFFF" : "#000000",
                lineHeight: lineHeight * scale,
                marginBottom: 14,
                marginTop: lineIndex > 0 ? 18 : 0
              }}
            >
              {trimmedLine}
            </Text>
          );
        }
        
        const isBulletPoint = trimmedLine.startsWith('-') || trimmedLine.startsWith('•');
        const contentToProcess = isBulletPoint ? trimmedLine.substring(1).trim() : trimmedLine;
        
        // Check if this line contains notable examples
        const lowerContent = contentToProcess.toLowerCase();
        const hasNotableExamples = lowerContent.includes('notable examples') || 
                                   lowerContent.includes('notable example');
        
        // Special handling for notable examples with 60px spacing
        if (hasNotableExamples) {
          return (
            <View key={lineIndex} style={{ 
              flexDirection: 'row', 
              marginBottom: 16,
              paddingLeft: isBulletPoint ? 12 : 0 
            }}>
              {isBulletPoint && (
                <Text style={{ 
                  fontSize: fontSize * scale,
                  fontFamily,
                  color,
                  lineHeight: lineHeight * scale,
                  marginRight: 10,
                  marginTop: 2
                }}>
                  •
                </Text>
              )}
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: fontSize * scale,
                  fontFamily,
                  color,
                  lineHeight: lineHeight * scale,
                  fontWeight: '600',
                  marginRight: 8
                }}>
                  Notable Examples:
                </Text>
                
                {/* Parse and render each scripture reference with 60px spacing */}
                {(() => {
                  // Extract all scripture references from the line
                  const scriptureRegex = /([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+(?::\d+(?:[–\-—]\d+)?)?)/gi;
                  const scriptures = [];
                  let match;
                  
                  while ((match = scriptureRegex.exec(contentToProcess)) !== null) {
                    scriptures.push({
                      fullText: match[0],
                      book: match[1],
                      reference: match[2]
                    });
                  }
                  
                  // Render scriptures with 60px spacing
                  return scriptures.map((scripture, idx) => {
                    const { book, chapter, verse } = parseScriptureReference(scripture.fullText);
                    
                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <View style={{ width: 60 }} />
                        )}
                        <Text
                          style={{
                            color: isDarkMode ? '#d0d0d0' : '#333',
                            fontWeight: "600",
                            textDecorationLine: "underline",
                            fontSize: fontSize * scale,
                            fontFamily,
                            lineHeight: lineHeight * scale
                          }}
                          onPress={() => {
                            if (book && chapter) {
                              onScripturePress(book, chapter, verse);
                            }
                          }}
                        >
                          {scripture.fullText}
                        </Text>
                      </React.Fragment>
                    );
                  });
                })()}
              </View>
            </View>
          );
        }
        
        // Regular processing for other lines
        const parts: any[] = [];
        let lastIndex = 0;
        let match;
        
        scripturePattern.lastIndex = 0;
        
        // Process the text to find scripture references
        while ((match = scripturePattern.exec(contentToProcess)) !== null) {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          
          // Add text before the scripture reference
          if (matchStart > lastIndex) {
            parts.push({ 
              type: 'text', 
              content: contentToProcess.substring(lastIndex, matchStart) 
            });
          }
          
          // Add the scripture reference
          parts.push({
            type: 'scripture',
            content: match[0],
            fullMatch: match[0],
          });
          
          lastIndex = matchEnd;
        }
        
        // Add remaining text
        if (lastIndex < contentToProcess.length) {
          parts.push({ 
            type: 'text', 
            content: contentToProcess.substring(lastIndex) 
          });
        }
        
        // Render the line
        return (
          <View key={lineIndex} style={{ 
            flexDirection: 'row', 
            marginBottom: 16,
            paddingLeft: isBulletPoint ? 12 : 0 
          }}>
            {isBulletPoint && (
              <Text style={{ 
                fontSize: fontSize * scale,
                fontFamily,
                color,
                lineHeight: lineHeight * scale,
                marginRight: 10,
                marginTop: 2
              }}>
                •
              </Text>
            )}
            <Text
              style={{
                fontSize: fontSize * scale,
                fontFamily,
                color,
                lineHeight: lineHeight * scale,
                flex: 1,
                flexWrap: 'wrap'
              }}
            >
              {parts.map((part, partIndex) => {
                if (part.type === 'scripture') {
                  const { book, chapter, verse } = parseScriptureReference(part.fullMatch);
                  
                  return (
                    <Text
                      key={partIndex}
                      style={{
                        color: isDarkMode ? '#d0d0d0' : '#333',
                        fontWeight: "600",
                        textDecorationLine: "underline",
                        fontSize: fontSize * scale,
                        fontFamily,
                        lineHeight: lineHeight * scale,
                        marginRight: 4
                      }}
                      onPress={() => {
                        if (book && chapter) {
                          onScripturePress(book, chapter, verse);
                        }
                      }}
                    >
                      {part.content}
                    </Text>
                  );
                } else {
                  return (
                    <Text key={partIndex} style={{ marginRight: 0 }}>
                      {part.content}
                    </Text>
                  );
                }
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ScriptureText component for other sections
const ScriptureText = ({ text, onScripturePress, isDarkMode, fontSize, fontFamily, color, lineHeight, scale }: any) => {
  if (!text) {
    return <Text style={{ fontSize: fontSize * scale, fontFamily, color, lineHeight: lineHeight * scale }}></Text>;
  }

  const parts: any[] = [];
  
  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
    '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  // Sort books by length (longest first) for better matching
  const sortedBooks = [...books].sort((a, b) => b.length - a.length);
  
  // Create regex pattern that properly handles books with numbers and spacing
  const bookPattern = sortedBooks
    .map(book => {
      const escapedBook = book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapedBook.replace(/\s+/g, '\\s*'); // Use \s* for optional spaces
    })
    .join('|');
  
  const scripturePattern = new RegExp(`(${bookPattern})\\s*(\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?)?)`, 'gi');

  let lastIndex = 0;
  let match;
  
  while ((match = scripturePattern.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    
    if (matchStart > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, matchStart) });
    }
    
    // Use the parseScriptureReference helper
    const { book, chapter, verse } = parseScriptureReference(match[0]);
    
    if (book && chapter) {
      parts.push({
        type: 'scripture',
        content: match[0],
        book: book,
        chapter: chapter,
        verse: verse,
      });
    } else {
      parts.push({ type: 'text', content: match[0] });
    }
    
    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  
  if (parts.length === 0) {
    return <Text style={{ fontSize: fontSize * scale, fontFamily, color, lineHeight: lineHeight * scale, flexWrap: 'wrap' }}>{text}</Text>;
  }
  
  // Create an array of React elements
  const elements = parts.map((part, index) => {
    if (part.type === 'scripture' && part.book && part.chapter) {
      return (
        <Text
          key={index}
          style={{ 
            color: isDarkMode ? '#d0d0d0' : '#333', 
            fontWeight: "600", 
            textDecorationLine: "underline",
            fontSize: fontSize * scale,
            fontFamily,
            lineHeight: lineHeight * scale,
            marginRight: 2
          }}
          onPress={() => {
            onScripturePress(part.book, part.chapter, part.verse);
          }}
        >
          {part.content}
        </Text>
      );
    } else {
      return (
        <Text 
          key={index}
          style={{ 
            fontSize: fontSize * scale, 
            fontFamily, 
            color, 
            lineHeight: lineHeight * scale,
            marginRight: 0
          }}
        >
          {part.content}
        </Text>
      );
    }
  });
  
  return <>{elements}</>;
};

const BibleModal = ({ visible, scriptureReference, onClose, isDarkMode }: any) => {
  const { width, height } = useWindowDimensions();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("NKJV");

  const isTablet = width >= 768;
  const isSmallScreen = width < 375;
  const popupWidth = isTablet ? width * 0.7 : width * 0.9;
  const popupHeight = isTablet ? height * 0.8 : height * 0.75;

  useEffect(() => {
    if (visible && scriptureReference?.book && scriptureReference?.chapter) {
      fetchScripture();
    }
  }, [visible, scriptureReference, selectedVersion]);

const fetchScripture = async () => {
  setLoading(true);
  setError(null);
  setVerses([]);

  try {
    let bookName = scriptureReference.book?.trim() || '';
    let chap = scriptureReference.chapter?.toString().trim() || '';
    let verseNum = scriptureReference.verse?.trim();

    console.log("DEBUG - Fetching scripture:", { bookName, chap, verseNum });

    if (!bookName || !chap) {
      throw new Error("Invalid scripture reference");
    }

    // Clean up the book name
    bookName = bookName.replace(/\s*\(.*\)$/, '').trim();
    console.log("DEBUG - Cleaned book name:", bookName);
    
    // Normalize the book name - remove spaces and lowercase
    let normalizedBookName = bookName
      .toLowerCase()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/^(\d)(st|nd|rd|th)/, '$1'); // Remove ordinal suffixes but keep the number
    
    console.log("DEBUG - Normalized book name (1):", normalizedBookName);
    
    // Try direct match first
    let bookNum = BOOK_MAP[normalizedBookName];
    
    // If not found, try alternative mappings for numbered books
    if (!bookNum) {
      console.log("DEBUG - Direct match not found, trying alternatives...");
      
      // For "1 Peter" - try different formats
      if (bookName.toLowerCase().includes('peter')) {
        if (bookName.toLowerCase().startsWith('1')) {
          // Try "1peter" format
          bookNum = BOOK_MAP["1peter"];
          console.log("DEBUG - Trying 1peter, found:", bookNum);
          
          if (!bookNum) {
            // Try "1pet" format
            bookNum = BOOK_MAP["1pet"];
            console.log("DEBUG - Trying 1pet, found:", bookNum);
          }
          
          if (!bookNum) {
            // Try "1pe" format
            bookNum = BOOK_MAP["1pe"];
            console.log("DEBUG - Trying 1pe, found:", bookNum);
          }
        }
      }
      
      if (!bookNum && bookName.toLowerCase().includes('hebrews')) {
        bookNum = BOOK_MAP["hebrews"];
        console.log("DEBUG - Trying hebrews, found:", bookNum);
        
        if (!bookNum) {
          bookNum = BOOK_MAP["heb"];
          console.log("DEBUG - Trying heb, found:", bookNum);
        }
        
        if (!bookNum) {
          bookNum = BOOK_MAP["he"];
          console.log("DEBUG - Trying he, found:", bookNum);
        }
      }
      
      // Try without any normalization (just lowercase, no space removal)
      if (!bookNum) {
        const simpleNormalized = bookName.toLowerCase().replace(/\s+/g, '');
        bookNum = BOOK_MAP[simpleNormalized];
        console.log("DEBUG - Trying simple normalized:", simpleNormalized, "found:", bookNum);
      }
    }

    if (!bookNum) {
      console.log("DEBUG - Book not found. Available BOOK_MAP entries:");
      Object.keys(BOOK_MAP).forEach(key => {
        if (key.includes('peter') || key.includes('heb') || key.includes('he.') || 
            (key.includes('1') && key.includes('peter')) || 
            (key.includes('1') && key.includes('pet')) ||
            (key.includes('1') && key.includes('pe')) ||
            (key.includes('1') && key.includes('p'))) {
          console.log(`  ${key}: ${BOOK_MAP[key]}`);
        }
      });
      throw new Error(`Book not found: ${bookName} (normalized: ${normalizedBookName})`);
    }

    console.log("DEBUG - Found book number:", bookNum);

    const chapter = parseInt(chap);
    if (isNaN(chapter)) {
      throw new Error("Invalid chapter number");
    }

    const url = `https://bolls.life/get-chapter/${selectedVersion}/${bookNum}/${chapter}/`;
    console.log("DEBUG - Fetching URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("DEBUG - Response data type:", typeof data);

    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error("No verses found");
    }

    const versesArray = Array.isArray(data) ? data : data.verses || [];
    console.log("DEBUG - Verses array length:", versesArray.length);
    
    const cleanText = (text: string) => {
      let cleaned = text
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&lt;\/sup&gt;/g, '')
        .replace(/&lt;sup&gt;/g, '')
        .replace(/<sup>[^<]*<\/sup>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return cleaned;
    };

    let versesData: Verse[] = versesArray.map((v: any) => ({
      verse: v.verse,
      text: cleanText(v.text),
    }));

    console.log("DEBUG - Verses data created, length:", versesData.length);

    if (verseNum) {
      console.log("DEBUG - Filtering by verse:", verseNum);
      // Fix: Handle different types of dashes and ranges properly
      const dashRegex = /[–\-—]/g;
      if (dashRegex.test(verseNum)) {
        // Handle verse range (like "11–16", "11-16", "11—16")
        const [startStr, endStr] = verseNum.split(dashRegex).map(v => v.trim());
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        
        console.log("DEBUG - Parsed range:", { start, end });
        
        if (!isNaN(start) && !isNaN(end)) {
          versesData = versesData.filter(v => v.verse >= start && v.verse <= end);
          console.log("DEBUG - After range filtering, verses:", versesData.length);
          
          // Sort by verse number to ensure proper order
          versesData.sort((a, b) => a.verse - b.verse);
        } else {
          console.log("DEBUG - Invalid range, showing all verses");
        }
      } else {
        // Handle single verse
        const singleVerse = parseInt(verseNum);
        if (!isNaN(singleVerse)) {
          versesData = versesData.filter(v => v.verse === singleVerse);
          console.log("DEBUG - After single verse filtering, verses:", versesData.length);
        }
      }
    }

    if (versesData.length === 0) {
      throw new Error("No verses found");
    }

    console.log("DEBUG - Final verses to display:", versesData.map(v => v.verse));
    setVerses(versesData);
  } catch (err: any) {
    console.error("DEBUG - Error fetching scripture:", err);
    setError(`Unable to load scripture: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const renderVerseItem = ({ item }: { item: Verse }) => (
    <View style={[styles.verseContainer, { marginBottom: isTablet ? 14 : 10 }]}>
      <Text style={[styles.verseNumber, { fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14 }]}>
        {item.verse}
      </Text>
      <Text style={[styles.verseText, { color: isDarkMode ? '#d0d0d0' : '#333', fontSize: isTablet ? 16 : 14, lineHeight: isTablet ? 26 : 22 }]}>
        {item.text}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <BlurView intensity={90} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      
      <View style={[styles.popupContainer, { 
        width: popupWidth, 
        height: popupHeight,
        backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff"
      }]}>
        <View style={[styles.popupHeader, { borderBottomColor: isDarkMode ? "#333333" : "#e0e0e0" }]}>
          <Text style={[styles.popupTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
            {scriptureReference?.book}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.popupCloseBtn}>
            <MaterialIcons name="close" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.versionSelector, { backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9", borderBottomColor: isDarkMode ? "#333333" : "#e0e0e0" }]}>
          <Text style={{ fontSize: isTablet ? 13 : 12, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#999999" : "#666666", marginBottom: 8 }}>
            SELECT VERSION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isTablet ? 10 : 8 }}>
            {BIBLE_VERSIONS.map((version) => (
              <TouchableOpacity
                key={version.id}
                onPress={() => setSelectedVersion(version.id)}
                style={[styles.versionBtn, {
                  backgroundColor: selectedVersion === version.id ? "#9d00d4" : isDarkMode ? "#2a2a2a" : "#e8e8e8",
                  paddingHorizontal: isTablet ? 16 : 12,
                  paddingVertical: isTablet ? 10 : 8,
                }]}
              >
                <Text style={{
                  fontSize: isTablet ? 12 : 11,
                  fontFamily: "Manrope_600SemiBold",
                  color: selectedVersion === version.id ? "#FFFFFF" : isDarkMode ? "#b0b0b0" : "#333333",
                }}>
                  {version.abbr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9d00d4" />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#ccc' : '#666' }]}>
              Loading...
            </Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#2a1a1a' : '#ffebee', marginHorizontal: 16, marginTop: 12 }]}>
            <MaterialIcons name="error-outline" size={18} color={isDarkMode ? '#ff8a80' : '#d32f2f'} />
            <Text style={[styles.errorText, { color: isDarkMode ? '#ff8a80' : '#d32f2f', marginLeft: 10, fontSize: 12 }]}>
              {error}
            </Text>
          </View>
        )}

        {verses.length > 0 && !loading && (
          <FlatList
            data={verses}
            renderItem={renderVerseItem}
            keyExtractor={(item) => item.verse.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>
    </View>
  );
};

export default function January4ManualDetail() {
  const { isDarkMode } = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { manual } = useLocalSearchParams();
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [selectedScripture, setSelectedScripture] = useState<ScriptureReference | null>(null);
  const [scale, setScale] = useState(1);
  
  const lastDistanceRef = useRef(0);
  const panResponderRef = useRef<any>(null);

  const isTablet = width >= 768;
  const bannerHeight = isTablet ? "100%" : 200;

  let manualData: ManualData | null = null;
  try {
    manualData = manual ? JSON.parse(Array.isArray(manual) ? manual[0] : manual as string) : null;
  } catch (error) {
    manualData = null;
  }

  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (lastDistanceRef.current > 0) {
            const scaleDelta = distance / lastDistanceRef.current;
            const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * scaleDelta));
            setScale(newScale);
          }
          lastDistanceRef.current = distance;
        }
      },
      onPanResponderRelease: () => {
        lastDistanceRef.current = 0;
      },
    });
  }, [scale]);

  const handleScripturePress = (book: string, chapter: string, verse?: string) => {
    console.log("DEBUG - Scripture pressed:", { book, chapter, verse });
    setSelectedScripture({ book, chapter, verse });
    setShowBibleModal(true);
  };

  if (!manualData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" }}>
        <Text style={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}>Manual not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#0a0a0a" : "#FFFFFF" }]}>
        <View style={[styles.header, { backgroundColor: isDarkMode ? "#0a0a0a" : "#FFFFFF", borderBottomColor: isDarkMode ? "#2a2a2a" : "#e0e0e0" }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? "#FFFFFF" : "#000000", fontSize: 14 }]}>OUTLINE</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} {...panResponderRef.current?.panHandlers}>
          {manualData.imageUrl && (
            <View style={[styles.heroContainer, { height: isTablet ? "100%" : bannerHeight }]}>
              <Image source={{ uri: manualData.imageUrl }} style={[styles.heroImage, { height: "100%" }]} />
            </View>
          )}

          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            {/* Show theme if available */}
            {manualData.theme && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#999999" : "#000000", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Theme: {manualData.theme}
                </Text>
              </View>
            )}

            {manualData.title && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20 * scale, fontFamily: "Manrope_700Bold", color: isDarkMode ? "#FFFFFF" : "#000000", lineHeight: 32 * scale }}>
                  {manualData.title}
                </Text>
              </View>
            )}

            {manualData.text && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ marginLeft: -10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: "flex-start", marginBottom: 12 }}>
                  <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5 }}>SCRIPTURE TEXT</Text>
                </View>
                <ScriptureText text={manualData.text} onScripturePress={handleScripturePress} isDarkMode={isDarkMode} fontSize={14} fontFamily="Manrope_400Regular" color={isDarkMode ? "#FFFFFF" : "#000000"} lineHeight={24} scale={scale} />
              </View>
            )}

            {manualData.memoryVerse && (
              <View style={{ marginBottom: 24, backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase" }}>Memory Verse</Text>
                </View>
                <ScriptureText text={manualData.memoryVerse} onScripturePress={handleScripturePress} isDarkMode={isDarkMode} fontSize={14} fontFamily="Manrope_400Regular" color={isDarkMode ? "#d0d0d0" : "#333333"} lineHeight={24} scale={scale} />
              </View>
            )}

            {manualData.introduction && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ 
                  fontSize: 12 * scale, 
                  fontFamily: "Manrope_600SemiBold", 
                  color: isDarkMode ? "#FFFFFF" : "#000000", 
                  textTransform: "uppercase", 
                  letterSpacing: 0.5, 
                  marginBottom: 12 
                }}>
                  Introduction
                </Text>
                <IntroductionFormatter 
                  text={manualData.introduction} 
                  onScripturePress={handleScripturePress} 
                  isDarkMode={isDarkMode} 
                  fontSize={14} 
                  fontFamily="Manrope_400Regular" 
                  color={isDarkMode ? "#b0b0b0" : "#666666"} 
                  lineHeight={22} 
                  scale={scale} 
                />
              </View>
            )}

            {manualData.mainPoints && manualData.mainPoints.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 12 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Main Points</Text>
                {manualData.subTopic && (
                  <Text style={{ fontSize: 15 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", marginBottom: 16 }}>
                    {manualData.subTopic}
                  </Text>
                )}
                {manualData.mainPoints.map((point, index) => (
                  <View key={index} style={{ marginBottom: 28, paddingBottom: 16, borderBottomWidth: index < manualData.mainPoints.length - 1 ? 1 : 0, borderBottomColor: isDarkMode ? "#2a2a2a" : "#e8e8e8" }}>
                    <Text style={{ fontSize: 15 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", marginBottom: 10 }}>
                      {index + 1}. {point.title}
                    </Text>
                    <Text style={{ fontSize: 14 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#b0b0b0" : "#666666", lineHeight: 22 * scale, marginBottom: 12 }}>
                      {point.description}
                    </Text>
                    {point.references && point.references.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#888888" : "#888888" }}>
                          References:{" "}
                          {point.references.map((ref, idx) => (
                            <React.Fragment key={idx}>
                              <ScriptureText 
                                text={ref} 
                                onScripturePress={handleScripturePress} 
                                isDarkMode={isDarkMode} 
                                fontSize={13} 
                                fontFamily="Manrope_400Regular" 
                                color={isDarkMode ? "#888888" : "#888888"} 
                                lineHeight={20} 
                                scale={scale} 
                              />
                              {idx < point.references.length - 1 && ", "}
                            </React.Fragment>
                          ))}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {manualData.classDiscussion && (
              <View style={{ marginBottom: 28, backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>Class Discussion</Text>
                <Text style={{ fontSize: 14 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#d0d0d0" : "#333333", lineHeight: 22 * scale, fontStyle: "italic" }}>
                  {manualData.classDiscussion}
                </Text>
              </View>
            )}

            {manualData.conclusion && (
              <View style={{ marginBottom: 28 }}>
                <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>Conclusion</Text>
                <Text style={{ fontSize: 14 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#d0d0d0" : "#333333", lineHeight: 22 * scale }}>
                  {manualData.conclusion}
                </Text>
              </View>
            )}

            {/* Show declaration section (replacing January 4th blessings) */}
            {manualData.declaration && (
              <View style={{ marginBottom: 32, backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 20, borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>Declaration</Text>
                <Text style={{ fontSize: 15 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#d0d0d0" : "#333333", lineHeight: 26 * scale, fontStyle: "italic" }}>
                  {manualData.declaration}
                </Text>
              </View>
            )}

              {/* DGC E-Library Section with 60px spacing */}
            <View style={{ marginBottom: 40 }}>
              <View style={{ backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 20, alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <View style={{ width: 60, height: 60, backgroundColor: isDarkMode ? "#2a1a3a" : "#e8d5f2", borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 18 }}>
                  <MaterialIcons name="menu-book" size={32} color="#9d00d4" />
                </View>
                <Text style={{ fontSize: 16 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textAlign: "center", marginBottom: 10 }}>
                  DGC E-Library
                </Text>
                <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#b0b0b0" : "#666666", textAlign: "center", marginBottom: 18, lineHeight: 20 }}>
                  Access the recommended books and other life-changing reads in the DGC E-library
                </Text>
                <TouchableOpacity 
                  onPress={() => Linking.openURL("https://bit.ly/DGCE-LIBRARY")} 
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_600SemiBold", color: "#9d00d4" }}>
                    Visit DGC E-library
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#9d00d4" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Feedback Link - consistent with other manuals */}
            {manualData.feedbackLink && (
              <View style={{ marginBottom: 40, paddingBottom: 32 }}>
                <View style={{ backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 20, alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                  <View style={{ width: 60, height: 60, backgroundColor: isDarkMode ? "#2a1a3a" : "#e8d5f2", borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 18 }}>
                    <MaterialIcons name="chat" size={32} color="#9d00d4" />
                  </View>
                  <Text style={{ fontSize: 16 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textAlign: "center", marginBottom: 10 }}>
                    Have Feedback?
                  </Text>
                  <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#b0b0b0" : "#666666", textAlign: "center", marginBottom: 18, lineHeight: 20 }}>
                    Share your questions, testimonies, or feedback with us
                  </Text>
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`https://${manualData.feedbackLink}`)} 
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_600SemiBold", color: "#9d00d4" }}>
                      Share Feedback
                    </Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#9d00d4" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          
            
            {/* Show recommended books if available */}
            {manualData.recommendedBooks && manualData.recommendedBooks.length > 0 && (
              <View style={{ marginBottom: 40 }}>
                <View style={{ backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 16 }}>
                  <Text style={{ fontSize: 12 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                    Recommended Books
                  </Text>
                  {manualData.recommendedBooks.map((book, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                      <MaterialIcons name="book" size={16} color="#9d00d4" style={{ marginTop: 2, marginRight: 10 }} />
                      <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#d0d0d0" : "#333333", flex: 1, lineHeight: 20 }}>
                        {book}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {selectedScripture && (
        <BibleModal visible={showBibleModal} scriptureReference={selectedScripture} onClose={() => setShowBibleModal(false)} isDarkMode={isDarkMode} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  headerTitle: { 
    fontWeight: "600", 
    fontFamily: "Manrope_600SemiBold", 
    letterSpacing: 1 
  },
  heroContainer: { 
    position: "relative", 
    borderRadius: 0, 
    overflow: "hidden", 
    width: "100%" 
  },
  heroImage: { 
    width: "115%", 
    resizeMode: "cover" 
  },
  modalContainer: { flex: 1 },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  modalTitle: { 
    fontSize: 14, 
    fontFamily: "Manrope_600SemiBold", 
    flex: 1, 
    textAlign: "center" 
  },
  closeButtonContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  translationContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    fontFamily: "Manrope_400Regular" 
  },
  errorContainer: { 
    padding: 14, 
    borderRadius: 10, 
    borderLeftWidth: 4, 
    borderLeftColor: "#d32f2f", 
    flexDirection: "row", 
    alignItems: "center" 
  },
  errorText: { 
    fontFamily: "Manrope_400Regular", 
    flex: 1 
  },
  scriptureContent: { 
    flexGrow: 1 
  },
  verseContainer: { 
    flexDirection: "row", 
    gap: 12 
  },
  verseNumber: { 
    fontWeight: "700", 
    color: "#9d00d4", 
    marginTop: 2, 
    fontFamily: "Manrope_700Bold" 
  },
  verseText: { 
    flex: 1, 
    fontFamily: "Manrope_400Regular" 
  },
  popupContainer: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "column",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1001,
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  popupTitle: {
    fontSize: 18,
    fontFamily: "Manrope_600SemiBold",
    flex: 1,
  },
  popupCloseBtn: {
    padding: 8,
  },
  versionSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  versionBtn: {
    borderRadius: 6,
  },
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  bookIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});