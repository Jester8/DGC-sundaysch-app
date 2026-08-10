import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchAllManualsFromHygraph,
  toCompatManual,
  computeNextUpcomingISO,
  isManualUnlocked,
  type CompatManual,
} from "../../lib/hygraph";

const ACCENT = "#9d00d4";
const OUTLINE_STORAGE_KEY = "outline_all_manuals_hygraph";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type OutlineItem = CompatManual;

interface MonthData {
  name: string;
  data: OutlineItem[];
}

interface SearchResult extends OutlineItem {
  monthName: string;
}

const getResponsiveSize = (size: number): number => size;

// A manual's `date` field is a free-text string like "4th January, 2026" —
// this pulls the trailing 4-digit year out of it for the year filter.
const extractYear = (dateString: string): number | null => {
  const match = /(\d{4})/.exec(dateString || "");
  return match ? parseInt(match[1], 10) : null;
};

export default function Outline() {
  const { isDarkMode } = useNavigation();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchText, setSearchText] = useState("");
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    loadOutlineData();
  }, []);

  const saveToStorage = async (data: MonthData[]) => {
    try {
      await AsyncStorage.setItem(OUTLINE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving outline data to storage:", error);
    }
  };

  const loadFromStorage = async () => {
    try {
      const jsonData = await AsyncStorage.getItem(OUTLINE_STORAGE_KEY);
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error("Error loading outline data from storage:", error);
      return null;
    }
  };

  // Cache is shown immediately (avoids a blank screen), then always
  // overwritten by a fresh Hygraph fetch — the API, not the cache, is the
  // source of truth for what's "latest"; cache only survives as the offline
  // fallback in the catch block below.
  const loadOutlineData = async () => {
    try {
      setLoading(true);

      const cachedData = await loadFromStorage();
      if (cachedData && cachedData.length > 0) {
        setMonthsData(cachedData);
      }

      const rawManuals = await fetchAllManualsFromHygraph();
      const compatManuals = rawManuals.map((raw, index) => toCompatManual(raw, index + 1));

      const formattedMonths: MonthData[] = months.map((month) => ({
        name: month,
        data: compatManuals.filter((item) => item.month === month),
      }));

      await saveToStorage(formattedMonths);
      setMonthsData(formattedMonths);
    } catch (error) {
      console.error("Error fetching manuals from Hygraph:", error);

      const cachedData = await loadFromStorage();
      if (!cachedData || cachedData.length === 0) {
        setMonthsData(months.map((month) => ({ name: month, data: [] })));
      }
    } finally {
      setLoading(false);
    }
  };

  const allManuals = useMemo(() => monthsData.flatMap((m) => m.data), [monthsData]);
  const nextUpcomingISO = useMemo(() => computeNextUpcomingISO(allManuals), [allManuals]);

  const handleCardPress = useCallback(
    (item: OutlineItem) => {
      const isUnlocked = isManualUnlocked(item, nextUpcomingISO);
      if (!isUnlocked) return;

      if (item.month === "January" && (item.date.includes("4") || item.date.includes("4th"))) {
        router.push({ pathname: "/Home/January4ManualDetail", params: { manual: JSON.stringify(item) } });
      } else {
        router.push({ pathname: "/Home/ManualDetail", params: { manual: JSON.stringify(item) } });
      }

      setShowSearchResults(false);
      setSearchText("");
    },
    [router, nextUpcomingISO]
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    monthsData.forEach((month) => month.data.forEach((item) => {
      const year = extractYear(item.date);
      if (year) years.add(year);
    }));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [monthsData]);

  // Keep selectedYear valid once real data (and its actual year(s)) loads in.
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  const yearFilteredMonths = useMemo(
    () =>
      monthsData.map((month) => ({
        ...month,
        data: month.data.filter((item) => {
          const year = extractYear(item.date);
          return year === null || year === selectedYear;
        }),
      })),
    [monthsData, selectedYear]
  );

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];
    const query = searchText.toLowerCase();
    const results: SearchResult[] = [];

    monthsData.forEach((month) => {
      month.data.forEach((item) => {
        const matches =
          item.title.toLowerCase().includes(query) ||
          item.theme.toLowerCase().includes(query) ||
          item.text.toLowerCase().includes(query) ||
          item.date.toLowerCase().includes(query) ||
          item.introduction.toLowerCase().includes(query) ||
          item.memoryVerse.toLowerCase().includes(query) ||
          item.classDiscussion.toLowerCase().includes(query);

        if (matches) results.push({ ...item, monthName: month.name });
      });
    });

    return results.sort((a, b) => {
      const aScore = (a.title.toLowerCase().includes(query) ? 2 : 0) + (a.theme.toLowerCase().includes(query) ? 1 : 0);
      const bScore = (b.title.toLowerCase().includes(query) ? 2 : 0) + (b.theme.toLowerCase().includes(query) ? 1 : 0);
      return bScore - aScore;
    });
  }, [monthsData, searchText]);

  const selectedMonthData = useMemo(
    () => yearFilteredMonths.find((m) => m.name === selectedMonth) ?? null,
    [yearFilteredMonths, selectedMonth]
  );

  const renderManualRow = (item: OutlineItem, keyPrefix: string, monthLabel?: string) => {
    const isUnlocked = isManualUnlocked(item, nextUpcomingISO);

    return (
      <TouchableOpacity
        key={keyPrefix}
        activeOpacity={isUnlocked ? 0.7 : 1}
        onPress={() => handleCardPress(item)}
        style={[
          styles.manualRow,
          {
            borderColor: isDarkMode ? "#333333" : "#e5e5e5",
            backgroundColor: isDarkMode ? "#141414" : "#ffffff",
          },
        ]}
      >
        <View
          style={[
            styles.manualIconCircle,
            { backgroundColor: isUnlocked ? "rgba(157,0,212,0.12)" : isDarkMode ? "#242424" : "#f0f0f0" },
          ]}
        >
          <MaterialIcons
            name={isUnlocked ? "menu-book" : "lock"}
            size={20}
            color={isUnlocked ? ACCENT : isDarkMode ? "#666" : "#aaa"}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={2}
            style={[styles.manualTitle, { color: isUnlocked ? (isDarkMode ? "#FFF" : "#111") : isDarkMode ? "#777" : "#aaa" }]}
          >
            {item.title}
          </Text>
          {!!item.text && (
            <Text
              numberOfLines={1}
              style={[styles.manualScripture, { color: isUnlocked ? (isDarkMode ? "#CCC" : "#555") : isDarkMode ? "#555" : "#bbb" }]}
            >
              {item.text}
            </Text>
          )}
          <View style={styles.manualMetaRow}>
            {!!item.theme && (
              <View style={[styles.themeBadge, { backgroundColor: isUnlocked ? "rgba(157,0,212,0.12)" : isDarkMode ? "#2a2a2a" : "#eeeeee" }]}>
                <Text numberOfLines={1} style={[styles.themeBadgeText, { color: isUnlocked ? ACCENT : isDarkMode ? "#888" : "#999" }]}>
                  {item.theme}
                </Text>
              </View>
            )}
            <Text style={[styles.manualDate, { color: isDarkMode ? "#888" : "#999" }]}>
              {monthLabel ? `${monthLabel} · ${item.date}` : item.date}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#000000" : "#FFF" }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#ffffff" : "#010002"} />
        </View>
        <BottomTabNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#000000" : "#FFF" }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={[styles.subtitle, { color: isDarkMode ? "#FFF" : "#000" }]}>Manuals</Text>

        <View style={[styles.searchContainer, { borderColor: isDarkMode ? "#333" : "#e5e5e5", backgroundColor: isDarkMode ? "#141414" : "#f7f7f7" }]}>
          <Feather name="search" size={19} color={isDarkMode ? "#666" : "#999"} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? "#FFF" : "#000" }]}
            placeholder="Search manuals, themes, verses..."
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              setShowSearchResults(text.trim().length > 0);
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(""); setShowSearchResults(false); }}>
              <MaterialIcons name="close" size={20} color={isDarkMode ? "#666" : "#999"} />
            </TouchableOpacity>
          )}
        </View>

        {showSearchResults && searchResults.length > 0 && (
          <View style={[styles.searchResultsContainer, { backgroundColor: isDarkMode ? "#141414" : "#f7f7f7" }]}>
            <Text style={[styles.searchResultsTitle, { color: isDarkMode ? "#CCC" : "#666" }]}>
              Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
              data={searchResults}
              renderItem={({ item }) => renderManualRow(item, `${item.monthName}-${item._id || item.id}`, item.monthName)}
              keyExtractor={(item) => `${item.monthName}-${item._id || item.id}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          </View>
        )}

        {showSearchResults && searchResults.length === 0 && searchText.trim().length > 0 && (
          <View style={[styles.noResultsContainer, { backgroundColor: isDarkMode ? "#141414" : "#f7f7f7" }]}>
            <MaterialIcons name="search-off" size={40} color={isDarkMode ? "#666" : "#999"} />
            <Text style={[styles.noResultsText, { color: isDarkMode ? "#888" : "#666" }]}>No manuals found</Text>
            <Text style={[styles.noResultsSubtext, { color: isDarkMode ? "#666" : "#999" }]}>Try searching with different keywords</Text>
          </View>
        )}

        {!showSearchResults && (
          <>
            {availableYears.length > 1 && (
              <View style={styles.yearRow}>
                {availableYears.map((year) => {
                  const isActive = year === selectedYear;
                  return (
                    <TouchableOpacity
                      key={year}
                      onPress={() => { setSelectedYear(year); setSelectedMonth(null); }}
                      style={[
                        styles.yearChip,
                        {
                          backgroundColor: isActive ? ACCENT : isDarkMode ? "#1a1a1a" : "#f0f0f0",
                        },
                      ]}
                    >
                      <Text style={[styles.yearChipText, { color: isActive ? "#FFF" : isDarkMode ? "#CCC" : "#555" }]}>{year}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!selectedMonth ? (
              <View style={styles.monthsGrid}>
                {yearFilteredMonths.map((month) => {
                  const count = month.data.length;
                  const isCurrentCalendarMonth = months[new Date().getMonth()] === month.name && selectedYear === new Date().getFullYear();

                  return (
                    <TouchableOpacity
                      key={month.name}
                      activeOpacity={0.8}
                      onPress={() => setSelectedMonth(month.name)}
                      style={[
                        styles.monthCard,
                        {
                          backgroundColor: isDarkMode ? "#141414" : "#ffffff",
                          borderColor: isCurrentCalendarMonth ? ACCENT : isDarkMode ? "#2a2a2a" : "#e5e5e5",
                        },
                      ]}
                    >
                      <View style={[styles.monthIconCircle, { backgroundColor: count > 0 ? "rgba(157,0,212,0.12)" : isDarkMode ? "#242424" : "#f0f0f0" }]}>
                        <Feather name="calendar" size={16} color={count > 0 ? ACCENT : isDarkMode ? "#666" : "#aaa"} />
                      </View>
                      <Text style={[styles.monthCardTitle, { color: isDarkMode ? "#FFF" : "#111" }]}>{month.name}</Text>
                      <Text style={[styles.monthCardCount, { color: count > 0 ? (isDarkMode ? "#999" : "#777") : isDarkMode ? "#555" : "#bbb" }]}>
                        {count > 0 ? `${count} manual${count !== 1 ? "s" : ""}` : "Not available"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View>
                <TouchableOpacity style={styles.backRow} onPress={() => setSelectedMonth(null)} activeOpacity={0.7}>
                  <Feather name="arrow-left" size={18} color={isDarkMode ? "#FFF" : "#111"} />
                  <Text style={[styles.backRowText, { color: isDarkMode ? "#FFF" : "#111" }]}>
                    {selectedMonth} {selectedYear}
                  </Text>
                </TouchableOpacity>

                {selectedMonthData && selectedMonthData.data.length > 0 ? (
                  <View style={styles.manualsList}>
                    {selectedMonthData.data.map((item, index) =>
                      renderManualRow(item, `${selectedMonth}-${item._id || item.id}-${index}`)
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="menu-book" size={32} color={isDarkMode ? "#444" : "#ccc"} />
                    <Text style={[styles.emptyText, { color: isDarkMode ? "#888" : "#777" }]}>No manuals available yet</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomTabNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  subtitle: { fontSize: 26, fontFamily: "Manrope_800ExtraBold", marginBottom: 16 },
  searchContainer: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Manrope_500Medium" },
  searchResultsContainer: { borderRadius: 16, padding: 16, marginBottom: 16 },
  searchResultsTitle: { fontSize: 13, fontFamily: "Manrope_600SemiBold", marginBottom: 12 },
  noResultsContainer: { borderRadius: 16, padding: 32, marginBottom: 16, alignItems: "center" },
  noResultsText: { fontSize: 15, fontFamily: "Manrope_600SemiBold", marginTop: 12 },
  noResultsSubtext: { fontSize: 13, fontFamily: "Manrope_400Regular", marginTop: 6 },

  yearRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  yearChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  yearChipText: { fontSize: 13, fontFamily: "Manrope_700Bold" },

  monthsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  monthCard: { width: "47.5%", borderRadius: 18, borderWidth: 1.5, padding: 16 },
  monthIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  monthCardTitle: { fontSize: 15, fontFamily: "Manrope_700Bold", marginBottom: 4 },
  monthCardCount: { fontSize: 12, fontFamily: "Manrope_500Medium" },

  backRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  backRowText: { fontSize: 17, fontFamily: "Manrope_700Bold" },
  manualsList: { gap: 12 },

  manualRow: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderRadius: 16, marginBottom: 12 },
  manualIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  manualTitle: { fontSize: 14.5, fontFamily: "Manrope_700Bold", marginBottom: 6 },
  manualScripture: { fontSize: 12.5, fontFamily: "Manrope_400Regular", marginBottom: 8 },
  manualMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  themeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, maxWidth: "60%" },
  themeBadgeText: { fontSize: 10.5, fontFamily: "Manrope_700Bold" },
  manualDate: { fontSize: 11, fontFamily: "Manrope_500Medium" },

  emptyContainer: { paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Manrope_500Medium" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
