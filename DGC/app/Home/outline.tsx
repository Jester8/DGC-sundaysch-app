import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import OutlineCard from "./card";
import BottomTabNavigation from "./BottomTabNavigation";
import { useNavigation } from "./_navigationContext";
import {
  januaryOutlines,
  februaryOutlines,
  marchOutlines,
  aprilOutlines,
  mayOutlines,
  juneOutlines,
  julyOutlines,
  augustOutlines,
  septemberOutlines,
  octoberOutlines,
  novemberOutlines,
  decemberOutlines,
} from "./outlineData";

const months = [
  { name: "January", data: januaryOutlines },
  { name: "February", data: februaryOutlines },
  { name: "March", data: marchOutlines },
  { name: "April", data: aprilOutlines },
  { name: "May", data: mayOutlines },
  { name: "June", data: juneOutlines },
  { name: "July", data: julyOutlines },
  { name: "August", data: augustOutlines },
  { name: "September", data: septemberOutlines },
  { name: "October", data: octoberOutlines },
  { name: "November", data: novemberOutlines },
  { name: "December", data: decemberOutlines },
];

export default function Outline() {
  const { isDarkMode } = useNavigation();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const toggleMonth = (monthName: string) => {
    setExpandedMonth(expandedMonth === monthName ? null : monthName);
  };

  const filteredMonths = months.map((month) => ({
    ...month,
    data: month.data.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#000000" : "#FFF" }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
       
        <Text style={[styles.subtitle, { color: isDarkMode ? "#FFF" : "#000" }]}>Outlines</Text>

        <View style={[styles.searchContainer, { borderColor: isDarkMode ? "#FFF" : "#000", backgroundColor: isDarkMode ? "#1a1a1a" : "#FFF" }]}>
         <Feather name="search" size={19} color={isDarkMode ? "#666" : "#999"} />

          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? "#FFF" : "#000" }]}
            placeholder="Search"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.monthsContainer}>
          {filteredMonths.map((month) => (
            <View key={month.name}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => toggleMonth(month.name)}
              >
                <Text style={styles.monthButtonText}>{month.name}</Text>
                <MaterialIcons
                  name={expandedMonth === month.name ? "expand-less" : "expand-more"}
                  size={32}
                  color="#FFF"
                  weight="900"
                />
              </TouchableOpacity>

              {expandedMonth === month.name && (
                <View style={styles.cardsContainer}>
                  {month.data.map((item) => (
                    <OutlineCard key={item.id} item={item} isDarkMode={isDarkMode} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

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
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 20,
    fontFamily: "Poppins_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 29,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  monthsContainer: {
    gap: 12,
    marginBottom: 80,
  },
  monthButton: {
    backgroundColor: "#B800E6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
  },
  cardsContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
});