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
  declaration?: string;
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

interface CachedScripture {
  verses: Verse[];
  timestamp: number;
  version: string;
  bookNum: number;
  chapter: number;
  verseRange?: string;
}

const MANUAL_STORAGE_PREFIX = "manual_detail_";
const BIBLE_STORAGE_PREFIX = "bible_cache_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
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
  "1samuel": 9, "1stsamuel": 9, "1st samuel": 9, "i samuel": 9,
  "2samuel": 10, "2ndsamuel": 10, "2nd samuel": 10, "ii samuel": 10,
  "1kings": 11, "1stkings": 11, "1st kings": 11, "i kings": 11,
  "2kings": 12, "2ndkings": 12, "2nd kings": 12, "ii kings": 12,
  "1chronicles": 13, "1stchronicles": 13, "1st chronicles": 13, "i chronicles": 13,
  "2chronicles": 14, "2ndchronicles": 14, "2nd chronicles": 14, "ii chronicles": 14,
  ezra: 15, nehemiah: 16, esther: 17, job: 18, psalm: 19, psalms: 19, proverbs: 20,
  ecclesiastes: 21, "song of solomon": 22, "songofsolomon": 22, isaiah: 23, jeremiah: 24,
  lamentations: 25, ezekiel: 26, daniel: 27, hosea: 28, joel: 29, amos: 30,
  obadiah: 31, jonah: 32, micah: 33, nahum: 34, habakkuk: 35, zephaniah: 36,
  haggai: 37, zechariah: 38, malachi: 39, 
  matthew: 40, matt: 40, mt: 40,
  mark: 41, mr: 41, mk: 41,
  luke: 42, lk: 42,
  john: 43, jn: 43,
  acts: 44, ac: 44,
  romans: 45, ro: 45, rm: 45,
  "1corinthians": 46, "1stcorinthians": 46, "1st corinthians": 46, "i corinthians": 46, "1cor": 46, "1co": 46,
  "2corinthians": 47, "2ndcorinthians": 47, "2nd corinthians": 47, "ii corinthians": 47, "2cor": 47, "2co": 47,
  galatians: 48, ga: 48, gal: 48,
  ephesians: 49, ep: 49, eph: 49,
  philippians: 50, php: 50, ph: 50,
  colossians: 51, col: 51, co: 51,
  "1thessalonians": 52, "1stthessalonians": 52, "1st thessalonians": 52, "i thessalonians": 52, "1thess": 52, "1th": 52,
  "2thessalonians": 53, "2ndthessalonians": 53, "2nd thessalonians": 53, "ii thessalonians": 53, "2thess": 53, "2th": 53,
  "1timothy": 54, "1sttimothy": 54, "1st timothy": 54, "i timothy": 54, "1tim": 54, "1ti": 54,
  "2timothy": 55, "2ndtimothy": 55, "2nd timothy": 55, "ii timothy": 55, "2tim": 55, "2ti": 55,
  titus: 56, ti: 56, tit: 56,
  philemon: 57, phm: 57,
  hebrews: 58, he: 58, heb: 58,
  james: 59, jas: 59, jm: 59,
  "1peter": 60, "1stpeter": 60, "1st peter": 60, "i peter": 60, "1pet": 60, "1pe": 60, "1p": 60,
  "2peter": 61, "2ndpeter": 61, "2nd peter": 61, "ii peter": 61, "2pet": 61, "2pe": 61, "2p": 61,
  "1john": 62, "1stjohn": 62, "1st john": 62, "i john": 62, "1jn": 62, "1j": 62,
  "2john": 63, "2ndjohn": 63, "2nd john": 63, "ii john": 63, "2jn": 63, "2j": 63,
  "3john": 64, "3rdjohn": 64, "3rd john": 64, "iii john": 64, "3jn": 64, "3j": 64,
  jude: 65, ju: 65, jud: 65,
  revelation: 66, rev: 66, re: 66,
};

// ========== CACHE FUNCTIONS ==========

const normalizeScriptureReference = (scriptureReference: ScriptureReference) => {
  let bookName = scriptureReference.book?.trim() || '';
  let chap = scriptureReference.chapter?.toString().trim() || '';
  let verseNum = scriptureReference.verse?.trim();

  bookName = bookName.replace(/\s*\(.*\)$/, '').trim();
  
  const normalizedBookName = bookName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^(\d)(st|nd|rd|th)/, '$1');
  
  let bookNum = BOOK_MAP[normalizedBookName];
  
  if (!bookNum && normalizedBookName.startsWith('1')) {
    const withoutOne = normalizedBookName.substring(1);
    bookNum = BOOK_MAP[withoutOne];
  }

  const chapter = parseInt(chap);
  
  return { bookNum, chapter, verseNum, bookName };
};

const getCachedScripture = async (
  bookNum: number, 
  chapter: number, 
  version: string, 
  verseRange?: string
): Promise<CachedScripture | null> => {
  try {
    const cacheKey = `${BIBLE_STORAGE_PREFIX}${version}_${bookNum}_${chapter}_${verseRange || 'full'}`;
    const cachedData = await AsyncStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsed: CachedScripture = JSON.parse(cachedData);
      const now = Date.now();
      if (now - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      } else {
        await AsyncStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error("Error reading cache:", error);
  }
  
  return null;
};

const saveScriptureToCache = async (
  bookNum: number, 
  chapter: number, 
  version: string, 
  verses: Verse[], 
  verseRange?: string
) => {
  try {
    const cacheKey = `${BIBLE_STORAGE_PREFIX}${version}_${bookNum}_${chapter}_${verseRange || 'full'}`;
    const cacheData: CachedScripture = {
      verses,
      timestamp: Date.now(),
      version,
      bookNum,
      chapter,
      verseRange
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
};

const extractScriptureReferences = (text: string): ScriptureReference[] => {
  const references: ScriptureReference[] = [];
  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 
    '1 Samuel', '2 Samuel', '1st Samuel', '2nd Samuel', 'I Samuel', 'II Samuel',
    '1 Kings', '2 Kings', '1st Kings', '2nd Kings', 'I Kings', 'II Kings',
    '1 Chronicles', '2 Chronicles', '1st Chronicles', '2nd Chronicles', 'I Chronicles', 'II Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John',
    'Acts',
    'Romans',
    '1 Corinthians', '2 Corinthians', '1st Corinthians', '2nd Corinthians', 'I Corinthians', 'II Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1st Thessalonians', '2nd Thessalonians', 'I Thessalonians', 'II Thessalonians',
    '1 Timothy', '2 Timothy', '1st Timothy', '2nd Timothy', 'I Timothy', 'II Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1st Peter', '2nd Peter', 'I Peter', 'II Peter',
    '1 John', '2 John', '3 John', '1st John', '2nd John', '3rd John', 'I John', 'II John', 'III John',
    'Jude', 'Revelation', 'Revelations'
  ];
  
  const sortedBooks = [...books].sort((a, b) => b.length - a.length);
  
  const bookPattern = sortedBooks
    .map(book => book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*'))
    .join('|');
  
  const scripturePattern = new RegExp(
    `\\b(${bookPattern})\\s*(\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?(?:\\s*[&,;]\\s*\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?)?)*)?)`,
    'gi'
  );
  
  let match;
  const normalizedText = text.replace(/[–—]/g, '-');
  
  while ((match = scripturePattern.exec(normalizedText)) !== null) {
    const bookName = match[1]?.trim() || '';
    const reference = match[2] || '';
    
    let chapter = '';
    let verse = '';
    
    if (reference.includes(':')) {
      const partsRef = reference.split(':');
      chapter = partsRef[0];
      verse = partsRef[1];
    } else {
      chapter = reference;
    }
    
    if (bookName && chapter) {
      references.push({
        book: bookName,
        chapter,
        verse: verse || undefined
      });
    }
  }
  
  return references;
};

const preFetchSingleReference = async (ref: ScriptureReference, version: string) => {
  try {
    const { bookNum, chapter } = normalizeScriptureReference(ref);
    
    if (!bookNum || !chapter) return;
    
    const cached = await getCachedScripture(bookNum, chapter, version, ref.verse);
    if (cached) return;
    
    const url = `https://bolls.life/get-chapter/${version}/${bookNum}/${chapter}/`;
    const response = await fetch(url);
    if (!response.ok) return;
    
    const data = await response.json();
    const versesArray = Array.isArray(data) ? data : data.verses || [];
    
    if (versesArray.length > 0) {
      const cleanText = (text: string) => {
        return text
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      let versesData: Verse[] = versesArray.map((v: any) => ({
        verse: v.verse,
        text: cleanText(v.text),
      }));
      
      if (ref.verse) {
        const verseNum = ref.verse;
        if (verseNum.includes('–') || verseNum.includes('-') || verseNum.includes('—')) {
          const dashChar = verseNum.includes('–') ? '–' : 
                          verseNum.includes('—') ? '—' : '-';
          
          const [startStr, endStr] = verseNum.split(dashChar).map(v => v.trim());
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            versesData = versesData.filter(v => v.verse >= start && v.verse <= end);
            versesData.sort((a, b) => a.verse - b.verse);
          }
        } else {
          const singleVerse = parseInt(verseNum);
          if (!isNaN(singleVerse)) {
            versesData = versesData.filter(v => v.verse === singleVerse);
          }
        }
      }
      
      await saveScriptureToCache(bookNum, chapter, version, versesData, ref.verse);
    }
  } catch (error) {
    // Silent fail for pre-fetching
  }
};

const preFetchScriptureReferences = async (manualData: ManualData) => {
  try {
    if (!manualData) return;
    
    const allReferences: ScriptureReference[] = [];
    
    if (manualData.memoryVerse) {
      const refs = extractScriptureReferences(manualData.memoryVerse);
      allReferences.push(...refs);
    }
    
    if (manualData.text) {
      const refs = extractScriptureReferences(manualData.text);
      allReferences.push(...refs);
    }
    
    if (manualData.introduction) {
      const refs = extractScriptureReferences(manualData.introduction);
      allReferences.push(...refs);
    }
    
    if (manualData.mainPoints) {
      manualData.mainPoints.forEach(point => {
        if (point.references) {
          point.references.forEach(ref => {
            const refs = extractScriptureReferences(ref);
            allReferences.push(...refs);
          });
        }
      });
    }
    
    const uniqueRefs = Array.from(
      new Set(allReferences.map(ref => 
        `${ref.book}|${ref.chapter}|${ref.verse || ''}`
      ))
    ).map(str => {
      const [book, chapter, verse] = str.split('|');
      return { book, chapter, verse: verse || undefined };
    });
    
    uniqueRefs.forEach(ref => {
      preFetchSingleReference(ref, "NKJV");
    });
    
  } catch (error) {
    console.error("Error pre-fetching:", error);
  }
};

// ========== COMPONENTS ==========

const IntroductionFormatter = ({ text, onScripturePress, isDarkMode, fontSize, fontFamily, color, lineHeight, scale }: any) => {
  if (!text) {
    return <Text style={{ fontSize: fontSize * scale, fontFamily, color, lineHeight: lineHeight * scale }}></Text>;
  }

  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 
    '1 Samuel', '2 Samuel', '1st Samuel', '2nd Samuel', 'I Samuel', 'II Samuel',
    '1 Kings', '2 Kings', '1st Kings', '2nd Kings', 'I Kings', 'II Kings',
    '1 Chronicles', '2 Chronicles', '1st Chronicles', '2nd Chronicles', 'I Chronicles', 'II Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John',
    'Acts',
    'Romans',
    '1 Corinthians', '2 Corinthians', '1st Corinthians', '2nd Corinthians', 'I Corinthians', 'II Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1st Thessalonians', '2nd Thessalonians', 'I Thessalonians', 'II Thessalonians',
    '1 Timothy', '2 Timothy', '1st Timothy', '2nd Timothy', 'I Timothy', 'II Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1st Peter', '2nd Peter', 'I Peter', 'II Peter',
    '1 John', '2 John', '3 John', '1st John', '2nd John', '3rd John', 'I John', 'II John', 'III John',
    'Jude', 'Revelation', 'Revelations'
  ];

  const sortedBooks = [...books].sort((a, b) => b.length - a.length);
  
  const bookPattern = sortedBooks
    .map(book => {
      const escapedBook = book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapedBook.replace(/\s+/g, '\\s+');
    })
    .join('|');
  
  const scripturePattern = new RegExp(
    `\\b(${bookPattern})\\s+(\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?(?:,\\s*\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?)?)*)?)`,
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
                marginBottom: 8,
                marginTop: lineIndex > 0 ? 12 : 0
              }}
            >
              {trimmedLine}
            </Text>
          );
        }
        
        const isBulletPoint = trimmedLine.startsWith('-') || trimmedLine.startsWith('•');
        const contentToProcess = isBulletPoint ? trimmedLine.substring(1).trim() : trimmedLine;
        
        const parts: any[] = [];
        let lastIndex = 0;
        let match;
        
        scripturePattern.lastIndex = 0;
        
        while ((match = scripturePattern.exec(contentToProcess)) !== null) {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          
          if (matchStart > lastIndex) {
            parts.push({ 
              type: 'text', 
              content: contentToProcess.substring(lastIndex, matchStart) 
            });
          }
          
          const fullMatch = match[0];
          const bookName = match[1];
          
          parts.push({
            type: 'scripture',
            content: fullMatch,
            book: bookName,
            chapter: '',
            verse: '',
          });
          
          lastIndex = matchEnd;
        }
        
        if (lastIndex < contentToProcess.length) {
          parts.push({ 
            type: 'text', 
            content: contentToProcess.substring(lastIndex) 
          });
        }
        
        if (parts.length === 0) {
          return (
            <View key={lineIndex} style={{ 
              flexDirection: 'row', 
              marginBottom: 8,
              paddingLeft: isBulletPoint ? 8 : 0 
            }}>
              {isBulletPoint && (
                <Text style={{ 
                  fontSize: fontSize * scale,
                  fontFamily,
                  color,
                  lineHeight: lineHeight * scale,
                  marginRight: 8
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
                {contentToProcess}
              </Text>
            </View>
          );
        }
        
        return (
          <View key={lineIndex} style={{ 
            flexDirection: 'row', 
            marginBottom: 8,
            paddingLeft: isBulletPoint ? 8 : 0 
          }}>
            {isBulletPoint && (
              <Text style={{ 
                fontSize: fontSize * scale,
                fontFamily,
                color,
                lineHeight: lineHeight * scale,
                marginRight: 8
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
                  const parseScripture = (scriptureText: string) => {
                    const scriptureMatch = scriptureText.match(/^(.+?)\s+(\d+(?::\d+(?:[–\-—]\d+)?)?)$/);
                    if (!scriptureMatch) return { book: '', chapter: '', verse: '' };
                    
                    const book = scriptureMatch[1].trim();
                    const numbers = scriptureMatch[2];
                    
                    if (numbers.includes(':')) {
                      const [chapter, verse] = numbers.split(':');
                      return { book, chapter, verse };
                    } else {
                      return { book, chapter: numbers, verse: '' };
                    }
                  };
                  
                  const { book, chapter, verse } = parseScripture(part.content);
                  
                  return (
                    <Text
                      key={partIndex}
                      style={{
                        color: isDarkMode ? '#d0d0d0' : '#333',
                        fontWeight: "600",
                        textDecorationLine: "underline",
                        textDecorationStyle: "solid",
                        textDecorationColor: isDarkMode ? '#d0d0d0' : '#333',
                        fontSize: fontSize * scale,
                        fontFamily,
                        lineHeight: lineHeight * scale,
                        paddingHorizontal: 2,
                        marginHorizontal: 1,
                        letterSpacing: 0.2,
                      }}
                      onPress={() => {
                        onScripturePress(book, chapter, verse);
                      }}
                    >
                      {part.content}
                    </Text>
                  );
                } else {
                  return (
                    <Text key={partIndex} style={{ letterSpacing: 0.2 }}>
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

const ScriptureText = ({ text, onScripturePress, isDarkMode, fontSize, fontFamily, color, lineHeight, scale }: any) => {
  if (!text) {
    return <Text style={{ fontSize: fontSize * scale, fontFamily, color, lineHeight: lineHeight * scale }}></Text>;
  }

  const parts: any[] = [];
  
  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', 
    '1 Samuel', '2 Samuel', '1st Samuel', '2nd Samuel', 'I Samuel', 'II Samuel',
    '1 Kings', '2 Kings', '1st Kings', '2nd Kings', 'I Kings', 'II Kings',
    '1 Chronicles', '2 Chronicles', '1st Chronicles', '2nd Chronicles', 'I Chronicles', 'II Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job',
    'Psalm', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Song of Songs',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John',
    'Acts',
    'Romans',
    '1 Corinthians', '2 Corinthians', '1st Corinthians', '2nd Corinthians', 'I Corinthians', 'II Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1st Thessalonians', '2nd Thessalonians', 'I Thessalonians', 'II Thessalonians',
    '1 Timothy', '2 Timothy', '1st Timothy', '2nd Timothy', 'I Timothy', 'II Timothy',
    'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1st Peter', '2nd Peter', 'I Peter', 'II Peter',
    '1 John', '2 John', '3 John', '1st John', '2nd John', '3rd John', 'I John', 'II John', 'III John',
    'Jude', 'Revelation', 'Revelations'
  ];

  const sortedBooks = [...books].sort((a, b) => b.length - a.length);
  
  const bookPattern = sortedBooks
    .map(book => {
      const escapedBook = book.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapedBook.replace(/\s+/g, '\\s*');
    })
    .join('|');
  
  const scripturePattern = new RegExp(
    `\\b(${bookPattern})\\s*(\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?(?:\\s*[&,;]\\s*\\d+(?::\\d+(?:[\\–\\-\\—]\\d+)?)?)*)?)`,
    'gi'
  );

  let lastIndex = 0;
  let match;
  
  const normalizedText = text.replace(/[–—]/g, '-');
  
  while ((match = scripturePattern.exec(normalizedText)) !== null) {    
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const originalMatch = text.substring(matchStart, matchEnd);
    
    if (matchStart > lastIndex) {
      parts.push({ 
        type: 'text', 
        content: text.substring(lastIndex, matchStart) 
      });
    }
    
    const bookName = match[1]?.trim() || '';
    const reference = match[2] || '';
    
    let chapter = '';
    let verse = '';
    
    let cleanBookName = bookName
      .replace(/1st\s+/gi, '1 ')
      .replace(/2nd\s+/gi, '2 ')
      .replace(/3rd\s+/gi, '3 ')
      .replace(/I\s+/gi, '1 ')
      .replace(/II\s+/gi, '2 ')
      .replace(/III\s+/gi, '3 ')
      .trim();
    
    if (reference.includes(':')) {
      const partsRef = reference.split(':');
      chapter = partsRef[0];
      verse = partsRef[1];
    } else {
      chapter = reference;
    }
    
    if (cleanBookName && chapter) {
      parts.push({
        type: 'scripture',
        content: originalMatch,
        book: cleanBookName,
        chapter: chapter,
        verse: verse || '',
      });
    } else {
      parts.push({ type: 'text', content: originalMatch });
    }
    
    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    parts.push({ 
      type: 'text', 
      content: text.substring(lastIndex) 
    });
  }
  
  if (parts.length === 0) {
    return (
      <Text style={{ 
        fontSize: fontSize * scale, 
        fontFamily, 
        color, 
        lineHeight: lineHeight * scale,
        flexWrap: 'wrap'
      }}>
        {text}
      </Text>
    );
  }
  
  return (
    <Text style={{ 
      fontSize: fontSize * scale, 
      fontFamily, 
      color, 
      lineHeight: lineHeight * scale,
      flexWrap: 'wrap'
    }}>
      {parts.map((part, index) => {
        if (part.type === 'scripture' && part.book && part.chapter) {
          return (
            <Text
              key={index}
              style={{ 
                color: isDarkMode ? '#d0d0d0' : '#333', 
                fontWeight: "600", 
                textDecorationLine: "underline",
                textDecorationStyle: "solid",
                textDecorationColor: isDarkMode ? '#d0d0d0' : '#333',
                fontSize: fontSize * scale,
                fontFamily,
                lineHeight: lineHeight * scale,
                paddingHorizontal: 2,
                marginHorizontal: 1,
                letterSpacing: 0.2,
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
                letterSpacing: 0.2,
              }}
            >
              {part.content}
            </Text>
          );
        }
      })}
    </Text>
  );
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

  const fetchScripture = async () => {
    setLoading(true);
    setError(null);
    setVerses([]);

    try {
      const { bookNum, chapter, verseNum } = normalizeScriptureReference(scriptureReference);
      
      if (!bookNum || !chapter) {
        throw new Error("Invalid scripture reference");
      }

      const cached = await getCachedScripture(bookNum, chapter, selectedVersion, verseNum);
      if (cached) {
        setVerses(cached.verses);
        setLoading(false);
        return;
      }

      const url = `https://bolls.life/get-chapter/${selectedVersion}/${bookNum}/${chapter}/`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("No verses found");
      }

      const versesArray = Array.isArray(data) ? data : data.verses || [];
      
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

      if (verseNum) {
        if (verseNum.includes('–') || verseNum.includes('-') || verseNum.includes('—')) {
          const dashChar = verseNum.includes('–') ? '–' : 
                          verseNum.includes('—') ? '—' : '-';
          
          const [startStr, endStr] = verseNum.split(dashChar).map(v => v.trim());
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            versesData = versesData.filter(v => v.verse >= start && v.verse <= end);
            versesData.sort((a, b) => a.verse - b.verse);
          }
        } else {
          const singleVerse = parseInt(verseNum);
          if (!isNaN(singleVerse)) {
            versesData = versesData.filter(v => v.verse === singleVerse);
          }
        }
      }

      if (versesData.length === 0) {
        throw new Error("No verses found");
      }

      await saveScriptureToCache(bookNum, chapter, selectedVersion, versesData, verseNum);
      
      setVerses(versesData);
    } catch (err: any) {
      console.error("Error fetching scripture:", err);
      setError(`Unable to load scripture: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && scriptureReference?.book && scriptureReference?.chapter) {
      fetchScripture();
    }
  }, [visible, scriptureReference, selectedVersion]);

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

export default function ManualDetail() {
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

  const isSpecialManual = manualData?.declaration !== undefined && manualData?.declaration !== null;
  const isJanuary11Manual = manualData?.date === "January 11";

  useEffect(() => {
    if (manualData) {
      preFetchScriptureReferences(manualData);
    }
  }, [manualData]);

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
            {!isSpecialManual && !isJanuary11Manual && manualData.theme && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#999999" : "#000000", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Theme: {manualData.theme}
                </Text>
              </View>
            )}

            {isJanuary11Manual && !manualData.theme && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: "#9d00d4", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "bold" }}>
                  🎉 UNLOCKED: JANUARY 11TH SPECIAL EDITION
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
                <ScriptureText 
                  text={manualData.text} 
                  onScripturePress={handleScripturePress} 
                  isDarkMode={isDarkMode} 
                  fontSize={14} 
                  fontFamily="Manrope_400Regular" 
                  color={isDarkMode ? "#FFFFFF" : "#000000"} 
                  lineHeight={24} 
                  scale={scale} 
                />
              </View>
            )}

            {manualData.memoryVerse && (
              <View style={{ marginBottom: 24, backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 16, borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase" }}>Memory Verse</Text>
                </View>
                <ScriptureText 
                  text={manualData.memoryVerse} 
                  onScripturePress={handleScripturePress} 
                  isDarkMode={isDarkMode} 
                  fontSize={14} 
                  fontFamily="Manrope_400Regular" 
                  color={isDarkMode ? "#d0d0d0" : "#333333"} 
                  lineHeight={24} 
                  scale={scale} 
                />
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

            {(isSpecialManual || isJanuary11Manual) && manualData.declaration && (
              <View style={{ marginBottom: 32, backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 20, borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                <Text style={{ fontSize: 11 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>Declaration</Text>
                <Text style={{ fontSize: 15 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#d0d0d0" : "#333333", lineHeight: 26 * scale, fontStyle: "italic" }}>
                  {manualData.declaration}
                </Text>
              </View>
            )}

            {!isSpecialManual && !isJanuary11Manual && manualData.recommendedBooks && manualData.recommendedBooks.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textTransform: "uppercase", letterSpacing: 0.5 }}>Recommended Books</Text>
                </View>
                {manualData.recommendedBooks.map((book, index) => (
                  <View key={index} style={[styles.bookCard, { backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9", borderColor: isDarkMode ? "#2a2a2a" : "#e8e8e8", marginBottom: 12 }]}>
                    <View style={[styles.bookIconContainer, { backgroundColor: isDarkMode ? "#2a1a3a" : "#e8d5f2" }]}>
                      <MaterialIcons name="book" size={28} color="#9d00d4" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 14 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", marginBottom: 4 }} numberOfLines={2}>
                        {book}
                      </Text>
                      <Text style={{ fontSize: 12 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#888888" : "#999999" }}>
                        Recommended Read
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#9d00d4" />
                  </View>
                ))}
              </View>
            )}

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

            {manualData.feedbackLink && (
              <View style={{ marginBottom: 32, paddingBottom: 24 }}>
                <View style={{ backgroundColor: isDarkMode ? "#1a0f2e" : "#f3e5f5", borderRadius: 8, padding: 20, alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#9d00d4" }}>
                  <View style={{ width: 60, height: 60, backgroundColor: isDarkMode ? "#2a1a3a" : "#e8d5f2", borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 18 }}>
                    <MaterialIcons name="chat" size={32} color="#9d00d4" />
                  </View>
                  <Text style={{ fontSize: 16 * scale, fontFamily: "Manrope_600SemiBold", color: isDarkMode ? "#FFFFFF" : "#000000", textAlign: "center", marginBottom: 10 }}>Have Feedback?</Text>
                  <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_400Regular", color: isDarkMode ? "#b0b0b0" : "#666666", textAlign: "center", marginBottom: 18, lineHeight: 20 }}>Share your questions, testimonies, or feedback with us</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`https://${manualData.feedbackLink}`)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Text style={{ fontSize: 13 * scale, fontFamily: "Manrope_600SemiBold", color: "#9d00d4" }}>Share Feedback</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#9d00d4" />
                  </TouchableOpacity>
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