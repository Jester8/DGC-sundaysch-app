import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

interface OutlineItem {
  id: string;
  title: string;
  passages: string;
  category: string;
  date: string;
}

interface OutlineCardProps {
  item: OutlineItem;
  isDarkMode?: boolean;
}

export default function OutlineCard({ item, isDarkMode = false }: OutlineCardProps) {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: isDarkMode ? "#1a1a1a" : "#FFF", borderColor: isDarkMode ? "#333" : "#E0E0E0" }]} activeOpacity={0.8}>
      <Image
        source={require("@/assets/images/king.png")}
        style={styles.cardImage}
      />

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFF" : "#000" }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.cardPassages, { color: isDarkMode ? "#AAA" : "#666" }]} numberOfLines={1}>
          {item.passages}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={[styles.cardDate, { color: isDarkMode ? "#666" : "#999" }]}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "Poppins_600SemiBold",
  },
  cardPassages: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "Poppins_400Regular",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#B800E6",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
  },
  cardDate: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },
});