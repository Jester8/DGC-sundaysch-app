import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@/app/Home/_navigationContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const BIBLE_API_URL = 'https://bible-api.com';
const CACHE_PREFIX = 'bible_';

interface BibleBook {
  id: string;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
}

interface Verse {
  verse: number;
  text: string;
}

interface Chapter {
  chapter: number;
  verses: Verse[];
}

interface ScriptureReference {
  book: string;
  chapter: string;
  verse?: string;
}

interface BibleViewerProps {
  onBack?: () => void;
  scriptureReferences?: ScriptureReference[];
}

type ViewState = 'testament' | 'books' | 'chapters' | 'scripture';

const BIBLE_BOOKS: BibleBook[] = [
  { id: 'GEN', name: 'Genesis', testament: 'old', chapters: 50 },
  { id: 'EXO', name: 'Exodus', testament: 'old', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', testament: 'old', chapters: 27 },
  { id: 'NUM', name: 'Numbers', testament: 'old', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', testament: 'old', chapters: 34 },
  { id: 'JOS', name: 'Joshua', testament: 'old', chapters: 24 },
  { id: 'JDG', name: 'Judges', testament: 'old', chapters: 21 },
  { id: 'RUT', name: 'Ruth', testament: 'old', chapters: 4 },
  { id: '1SA', name: '1 Samuel', testament: 'old', chapters: 31 },
  { id: '2SA', name: '2 Samuel', testament: 'old', chapters: 24 },
  { id: '1KI', name: '1 Kings', testament: 'old', chapters: 22 },
  { id: '2KI', name: '2 Kings', testament: 'old', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', testament: 'old', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', testament: 'old', chapters: 36 },
  { id: 'EZR', name: 'Ezra', testament: 'old', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', testament: 'old', chapters: 13 },
  { id: 'EST', name: 'Esther', testament: 'old', chapters: 10 },
  { id: 'JOB', name: 'Job', testament: 'old', chapters: 42 },
  { id: 'PSA', name: 'Psalm', testament: 'old', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', testament: 'old', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'old', chapters: 12 },
  { id: 'SOS', name: 'Song of Solomon', testament: 'old', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', testament: 'old', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', testament: 'old', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', testament: 'old', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', testament: 'old', chapters: 48 },
  { id: 'DAN', name: 'Daniel', testament: 'old', chapters: 12 },
  { id: 'HOS', name: 'Hosea', testament: 'old', chapters: 14 },
  { id: 'JOE', name: 'Joel', testament: 'old', chapters: 3 },
  { id: 'AMO', name: 'Amos', testament: 'old', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', testament: 'old', chapters: 1 },
  { id: 'JON', name: 'Jonah', testament: 'old', chapters: 4 },
  { id: 'MIC', name: 'Micah', testament: 'old', chapters: 7 },
  { id: 'NAH', name: 'Nahum', testament: 'old', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', testament: 'old', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', testament: 'old', chapters: 3 },
  { id: 'HAG', name: 'Haggai', testament: 'old', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', testament: 'old', chapters: 14 },
  { id: 'MAL', name: 'Malachi', testament: 'old', chapters: 4 },
  { id: 'MAT', name: 'Matthew', testament: 'new', chapters: 28 },
  { id: 'MRK', name: 'Mark', testament: 'new', chapters: 16 },
  { id: 'LUK', name: 'Luke', testament: 'new', chapters: 24 },
  { id: 'JHN', name: 'John', testament: 'new', chapters: 21 },
  { id: 'ACT', name: 'Acts', testament: 'new', chapters: 28 },
  { id: 'ROM', name: 'Romans', testament: 'new', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', testament: 'new', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', testament: 'new', chapters: 13 },
  { id: 'GAL', name: 'Galatians', testament: 'new', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', testament: 'new', chapters: 6 },
  { id: 'PHP', name: 'Philippians', testament: 'new', chapters: 4 },
  { id: 'COL', name: 'Colossians', testament: 'new', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', testament: 'new', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', testament: 'new', chapters: 3 },
  { id: '1TI', name: '1 Timothy', testament: 'new', chapters: 6 },
  { id: '2TI', name: '2 Timothy', testament: 'new', chapters: 4 },
  { id: 'TIT', name: 'Titus', testament: 'new', chapters: 3 },
  { id: 'PHM', name: 'Philemon', testament: 'new', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', testament: 'new', chapters: 13 },
  { id: 'JAS', name: 'James', testament: 'new', chapters: 5 },
  { id: '1PE', name: '1 Peter', testament: 'new', chapters: 5 },
  { id: '2PE', name: '2 Peter', testament: 'new', chapters: 3 },
  { id: '1JN', name: '1 John', testament: 'new', chapters: 5 },
  { id: '2JN', name: '2 John', testament: 'new', chapters: 1 },
  { id: '3JN', name: '3 John', testament: 'new', chapters: 1 },
  { id: 'JUD', name: 'Jude', testament: 'new', chapters: 1 },
  { id: 'REV', name: 'Revelation', testament: 'new', chapters: 22 },
];

const TRANSLATIONS = [
  { id: 'kjv', name: 'King James Version', short: 'KJV' },
  { id: 'nkjv', name: 'New King James Version', short: 'NKJV' },
  { id: 'amp', name: 'Amplified Bible', short: 'AMP' },
  { id: 'asv', name: 'American Standard Version', short: 'ASV' },
  { id: 'rsv', name: 'Revised Standard Version', short: 'RSV' },
  { id: 'niv', name: 'New International Version', short: 'NIV' },
];

// Pre-cache for common translations
const PRE_CACHE_TRANSLATIONS = ['kjv', 'nkjv', 'niv'];

// Common scriptures to pre-load
const COMMON_SCRIPTURES = [
  { book: 'Genesis', chapter: 1 },
  { book: 'Psalm', chapter: 23 },
  { book: 'John', chapter: 3 },
  { book: 'Matthew', chapter: 5 },
  { book: 'Romans', chapter: 8 },
  { book: '1 Corinthians', chapter: 13 },
];

export default function BibleViewer({ onBack, scriptureReferences = [] }: BibleViewerProps) {
  const { isDarkMode } = useNavigation();
  const { width } = useWindowDimensions();

  const [viewState, setViewState] = useState<ViewState>('testament');
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new' | null>(null);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState('kjv');
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  // Load translation preference and pre-cache common scriptures
  useEffect(() => {
    const initialize = async () => {
      try {
        const saved = await AsyncStorage.getItem('bible_translation');
        if (saved) setSelectedTranslation(saved);
        
        // Pre-cache common scriptures in background
        preCacheCommonScriptures();
      } catch (err) {
        console.error('Error initializing:', err);
      } finally {
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, []);

  // Handle scripture references when they change
  useEffect(() => {
    if (scriptureReferences && scriptureReferences.length > 0 && isInitialized) {
      handleScriptureReference(scriptureReferences[0]);
    }
  }, [scriptureReferences, isInitialized]);

  const preCacheCommonScriptures = async () => {
    try {
      for (const translation of PRE_CACHE_TRANSLATIONS) {
        for (const scripture of COMMON_SCRIPTURES) {
          const book = BIBLE_BOOKS.find(b => 
            b.name.toLowerCase() === scripture.book.toLowerCase()
          );
          
          if (book) {
            const cacheKey = `${CACHE_PREFIX}${translation}_${book.id}_${scripture.chapter}`;
            const cached = await AsyncStorage.getItem(cacheKey);
            
            if (!cached) {
              // Start fetch in background but don't wait for it
              fetch(`${BIBLE_API_URL}/${scripture.book} ${scripture.chapter}?translation=${translation}`)
                .then(response => response.json())
                .then(data => {
                  if (data.verses && data.verses.length > 0) {
                    const verses: Verse[] = data.verses.map((v: any) => ({
                      verse: v.verse,
                      text: v.text,
                    }));
                    const chapterObj: Chapter = { chapter: scripture.chapter, verses };
                    AsyncStorage.setItem(cacheKey, JSON.stringify(chapterObj))
                      .catch(err => console.error('Error caching:', err));
                  }
                })
                .catch(err => console.error('Pre-cache fetch error:', err));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error pre-caching scriptures:', err);
    }
  };

  const loadTranslationPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('bible_translation');
      if (saved) setSelectedTranslation(saved);
    } catch (err) {
      console.error('Error loading translation:', err);
    }
  };

  const saveTranslationPreference = async (translation: string) => {
    try {
      await AsyncStorage.setItem('bible_translation', translation);
    } catch (err) {
      console.error('Error saving translation:', err);
    }
  };

  const fetchChapter = useCallback(async (book: BibleBook, chapter: number) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${CACHE_PREFIX}${selectedTranslation}_${book.id}_${chapter}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        setChapterData(JSON.parse(cached));
        setViewState('scripture');
        setLoading(false);
        return;
      }

      // Show loading state immediately
      setChapterData(null);
      
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const passage = `${book.name} ${chapter}`;
      const url = `${BIBLE_API_URL}/${passage}?translation=${selectedTranslation}`;
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch chapter');

      const data = await response.json();
      if (!data.verses || data.verses.length === 0) throw new Error('No verses found');

      const verses: Verse[] = data.verses.map((v: any) => ({
        verse: v.verse,
        text: v.text,
      }));

      const chapterObj: Chapter = { chapter, verses };
      
      // Cache in background without blocking UI
      AsyncStorage.setItem(cacheKey, JSON.stringify(chapterObj))
        .catch(err => console.error('Error caching:', err));
      
      setChapterData(chapterObj);
      setViewState('scripture');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load chapter');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTranslation]);

  const handleScriptureReference = useCallback((ref: ScriptureReference) => {
    try {
      let cleanBookName = ref.book;
      if (cleanBookName.includes(':')) {
        cleanBookName = cleanBookName.split(':')[0].trim();
      }

      const book = BIBLE_BOOKS.find(b => 
        b.name.toLowerCase() === cleanBookName.toLowerCase()
      );

      if (!book) {
        setError(`Book not found: ${cleanBookName}`);
        return;
      }

      const chapterNum = parseInt(ref.chapter);
      if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > book.chapters) {
        setError(`Invalid chapter: ${book.name} ${ref.chapter}`);
        return;
      }

      setSelectedBook(book);
      setSelectedTestament(book.testament);
      fetchChapter(book, chapterNum);
    } catch (err: any) {
      setError(err.message || 'Error loading scripture');
    }
  }, [fetchChapter]);

  const handleTranslationChange = async (translation: string) => {
    setSelectedTranslation(translation);
    await saveTranslationPreference(translation);
    
    if (selectedBook && chapterData) {
      fetchChapter(selectedBook, chapterData.chapter);
    }
  };

  const handleBack = () => {
    if (viewState === 'scripture') {
      setViewState('chapters');
    } else if (viewState === 'chapters') {
      setViewState('books');
    } else if (viewState === 'books') {
      setViewState('testament');
    } else if (onBack) {
      onBack();
    }
  };

  const booksToShow = BIBLE_BOOKS.filter(b => b.testament === selectedTestament);
  const chapters = selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : [];

  // Memoize translation buttons for better performance
  const translationButtons = useMemo(() => (
    TRANSLATIONS.map((t) => (
      <TouchableOpacity
        key={t.id}
        style={[
          styles.translationBtn,
          { 
            paddingHorizontal: isTablet ? 16 : isSmallScreen ? 12 : 14,
            paddingVertical: isTablet ? 10 : isSmallScreen ? 8 : 9,
            marginRight: isTablet ? 12 : isSmallScreen ? 8 : 10,
          },
          selectedTranslation === t.id
            ? { backgroundColor: '#9d00d4' }
            : { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
        ]}
        onPress={() => handleTranslationChange(t.id)}
      >
        <Text
          style={[
            styles.translationBtnText,
            selectedTranslation === t.id && { color: '#fff' },
            selectedTranslation !== t.id && { color: isDarkMode ? '#bbb' : '#666' },
            { fontSize: isTablet ? 14 : isSmallScreen ? 11 : 13 },
          ]}
        >
          {t.short}
        </Text>
      </TouchableOpacity>
    ))
  ), [selectedTranslation, isDarkMode, isTablet, isSmallScreen, handleTranslationChange]);

  // Memoize book list items
  const renderBookItem = useCallback(({ item }: { item: BibleBook }) => (
    <TouchableOpacity
      style={[styles.listItem, { 
        paddingVertical: isTablet ? 16 : isSmallScreen ? 10 : 14,
        paddingHorizontal: isTablet ? 16 : isSmallScreen ? 10 : 14,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#fff'
      }]}
      onPress={() => {
        setSelectedBook(item);
        setViewState('chapters');
      }}
    >
      <Text style={[styles.listItemText, { 
        fontSize: isTablet ? 15 : isSmallScreen ? 12 : 14, 
        color: isDarkMode ? '#fff' : '#333' 
      }]}>
        {item.name}
      </Text>
      <MaterialIcons name="chevron-right" size={isTablet ? 24 : isSmallScreen ? 18 : 20} color="#9d00d4" />
    </TouchableOpacity>
  ), [isDarkMode, isTablet, isSmallScreen]);

  // Memoize chapter buttons
  const renderChapterItem = useCallback(({ item }: { item: number }) => (
    <TouchableOpacity
      style={[styles.chapterBtn, { 
        paddingVertical: isTablet ? 16 : isSmallScreen ? 10 : 14,
        paddingHorizontal: isTablet ? 16 : isSmallScreen ? 10 : 14,
        minHeight: isTablet ? 56 : isSmallScreen ? 40 : 50,
      }]}
      onPress={() => fetchChapter(selectedBook!, item)}
    >
      <Text style={[styles.chapterBtnText, { 
        fontSize: isTablet ? 14 : isSmallScreen ? 11 : 13 
      }]}>
        Chapter {item}
      </Text>
    </TouchableOpacity>
  ), [selectedBook, fetchChapter, isTablet, isSmallScreen]);

  // Memoize verse items
  const renderVerseItem = useCallback((verse: Verse) => (
    <View key={verse.verse} style={[styles.verseContainer, { 
      marginBottom: isTablet ? 12 : isSmallScreen ? 8 : 10 
    }]}>
      <Text style={[styles.verseNumber, { 
        fontSize: isTablet ? 15 : isSmallScreen ? 11 : 13,
        minWidth: isTablet ? 28 : isSmallScreen ? 22 : 26
      }]}>
        {verse.verse}
      </Text>
      <Text
        style={[
          styles.verseText,
          { 
            color: isDarkMode ? '#d0d0d0' : '#333', 
            fontSize: isTablet ? 15 : isSmallScreen ? 12 : 14,
            lineHeight: isTablet ? 28 : isSmallScreen ? 20 : 24
          },
        ]}
      >
        {verse.text}
      </Text>
    </View>
  ), [isDarkMode, isTablet, isSmallScreen]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f8f8' }]}>
      <View style={[styles.header, { paddingVertical: isTablet ? 24 : isSmallScreen ? 12 : 16 }]}>
        <Text style={[styles.title, { fontSize: isTablet ? 36 : isSmallScreen ? 22 : 28 }]}>The Holy Bible</Text>
      </View>

       {(viewState !== 'testament' || onBack) && (
        <View style={[styles.backButtonContainer, { 
          paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16, 
          paddingVertical: isTablet ? 12 : isSmallScreen ? 8 : 10 
        }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={isTablet ? 24 : isSmallScreen ? 18 : 20} color={isDarkMode ? '#ffffff' : '#9d00d4'} />
            <Text style={[styles.backButtonText, { 
              fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
              color: isDarkMode ? '#ffffff' : '#9d00d4'
            }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.translationSection, { 
        backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', 
        paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16 
      }]}>
        <Text style={[styles.label, { 
          color: isDarkMode ? '#fff' : '#333', 
          fontSize: isTablet ? 15 : isSmallScreen ? 12 : 13 
        }]}>
          Translation
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginTop: isTablet ? 12 : isSmallScreen ? 8 : 12 }}
        >
          {translationButtons}
        </ScrollView>
      </View>

     

      {viewState === 'testament' && (
        <View style={[styles.contentContainer, { 
          paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16, 
          paddingVertical: isTablet ? 32 : isSmallScreen ? 16 : 24 
        }]}>
          <Text style={[styles.sectionTitle, { 
            fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18, 
            marginBottom: isTablet ? 24 : isSmallScreen ? 16 : 20 
          }]}>
            Choose Testament
          </Text>
          <View style={[styles.testamentGrid, { gap: isTablet ? 20 : isSmallScreen ? 12 : 16 }]}>
            <TouchableOpacity
              style={[styles.testamentCard, { 
                paddingVertical: isTablet ? 40 : isSmallScreen ? 24 : 32, 
                marginBottom: isTablet ? 0 : isSmallScreen ? 12 : 20 
              }]}
              onPress={() => {
                setSelectedTestament('old');
                setViewState('books');
              }}
            >
              <MaterialIcons name="menu-book" size={isTablet ? 48 : isSmallScreen ? 32 : 40} color="#fff" />
              <Text style={[styles.testamentCardText, { 
                fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16, 
                marginTop: isTablet ? 16 : isSmallScreen ? 8 : 12 
              }]}>
                Old Testament
              </Text>
              <Text style={[styles.testamentCardSubtext, { 
                fontSize: isTablet ? 13 : isSmallScreen ? 11 : 12 
              }]}>
                39 Books
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testamentCard, { 
                paddingVertical: isTablet ? 40 : isSmallScreen ? 24 : 32 
              }]}
              onPress={() => {
                setSelectedTestament('new');
                setViewState('books');
              }}
            >
              <MaterialIcons name="menu-book" size={isTablet ? 48 : isSmallScreen ? 32 : 40} color="#fff" />
              <Text style={[styles.testamentCardText, { 
                fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16, 
                marginTop: isTablet ? 16 : isSmallScreen ? 8 : 12 
              }]}>
                New Testament
              </Text>
              <Text style={[styles.testamentCardSubtext, { 
                fontSize: isTablet ? 13 : isSmallScreen ? 11 : 12 
              }]}>
                27 Books
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewState === 'books' && (
        <View style={[styles.listContainer, { 
          paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16 
        }]}>
          <Text style={[styles.sectionTitle, { 
            fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18, 
            marginBottom: isTablet ? 16 : isSmallScreen ? 10 : 12, 
            marginTop: isTablet ? 16 : isSmallScreen ? 10 : 12 
          }]}>
            {selectedTestament === 'old' ? 'Old Testament' : 'New Testament'}
          </Text>
          <FlatList
            data={booksToShow}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            numColumns={isTablet ? 2 : 1}
            columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
            contentContainerStyle={{ paddingBottom: 20 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
          />
        </View>
      )}

      {viewState === 'chapters' && selectedBook && (
        <View style={[styles.listContainer, { 
          paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16 
        }]}>
          <Text style={[styles.sectionTitle, { 
            fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18, 
            marginBottom: isTablet ? 16 : isSmallScreen ? 10 : 12, 
            marginTop: isTablet ? 16 : isSmallScreen ? 10 : 12 
          }]}>
            {selectedBook.name}
          </Text>
          <FlatList
            data={chapters}
            renderItem={renderChapterItem}
            keyExtractor={(item) => item.toString()}
            scrollEnabled={true}
            numColumns={isTablet ? 4 : (isSmallScreen ? 2 : 3)}
            columnWrapperStyle={{ 
              gap: isTablet ? 12 : (isSmallScreen ? 6 : 10), 
              marginBottom: isTablet ? 12 : (isSmallScreen ? 6 : 10) 
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            windowSize={5}
            initialNumToRender={20}
          />
        </View>
      )}

      {viewState === 'scripture' && (
        <>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9d00d4" />
              <Text style={[styles.loadingText, { 
                color: isDarkMode ? '#ccc' : '#666', 
                fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14, 
                marginTop: 12 
              }]}>
                Loading chapter...
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.errorContainer, { 
              marginHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16, 
              marginTop: isTablet ? 20 : isSmallScreen ? 12 : 16,
              backgroundColor: isDarkMode ? '#2a1a1a' : '#ffebee'
            }]}>
              <MaterialIcons name="error-outline" size={isSmallScreen ? 18 : 20} color={isDarkMode ? '#ff8a80' : '#d32f2f'} />
              <Text style={[styles.errorText, { 
                fontSize: isTablet ? 15 : isSmallScreen ? 11 : 13, 
                marginLeft: 10,
                color: isDarkMode ? '#ff8a80' : '#d32f2f'
              }]}>
                {error}
              </Text>
            </View>
          )}

          {chapterData && !loading && (
            <ScrollView
              style={[styles.scriptureContainer, { 
                paddingHorizontal: isTablet ? 24 : isSmallScreen ? 12 : 16, 
                paddingVertical: isTablet ? 20 : isSmallScreen ? 12 : 16 
              }]}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
            >
              <View style={[styles.scriptureCard, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
                <View style={[styles.scriptureHeader, { 
                  borderBottomColor: isDarkMode ? '#333' : '#f0f0f0'
                }]}>
                  <Text style={[styles.passageRef, { 
                    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 
                  }]}>
                    {selectedBook?.name} Chapter {chapterData.chapter}
                  </Text>
                  <View style={styles.translationTagContainer}>
                    <Text style={[styles.translationTag, { 
                      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
                      backgroundColor: isDarkMode ? '#2a1a2a' : '#f3e5f5'
                    }]}>
                      {TRANSLATIONS.find(t => t.id === selectedTranslation)?.short}
                    </Text>
                  </View>
                </View>

                {chapterData.verses.map(renderVerseItem)}
              </View>
              <View style={{ height: isSmallScreen ? 20 : 30 }} />
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#9d00d4',
    alignItems: 'center',
    shadowColor: '#9d00d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  translationSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  translationBtn: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  translationBtnText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  backButtonContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#9d00d4',
    fontFamily: 'Poppins_700Bold',
  },
  testamentGrid: {
    flexDirection: 'column',
  },
  testamentCard: {
    backgroundColor: '#9d00d4',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#9d00d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  testamentCardText: {
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  testamentCardSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemText: {
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  chapterBtn: {
    backgroundColor: '#9d00d4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9d00d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  scriptureContainer: {
    flex: 1,
  },
  scriptureCard: {
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#9d00d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scriptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  passageRef: {
    fontWeight: '700',
    color: '#9d00d4',
    fontFamily: 'Poppins_700Bold',
    flex: 1,
  },
  translationTagContainer: {
    marginLeft: 10,
  },
  translationTag: {
    color: '#9d00d4',
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  verseContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  verseNumber: {
    fontWeight: '700',
    color: '#9d00d4',
    marginTop: 2,
    fontFamily: 'Poppins_700Bold',
  },
  verseText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
});