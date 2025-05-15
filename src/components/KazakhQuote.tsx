import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { COLORS } from "../constants/colors";
import { QUOTES } from "../data/quotes";

const KazakhQuote = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const random = Math.floor(Math.random() * QUOTES.length);
    setQuoteIndex(random);
  }, []);

  const quote = QUOTES[quoteIndex];

  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteKazakh}>«{quote.text}»</Text>
      <Text style={styles.quoteTranslation}>{quote.translation}</Text>
      <Text style={styles.quoteAuthor}>— {quote.author}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  quoteCard: {
    width: "100%",
    backgroundColor: "#FAFAFA",
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(20),
    paddingHorizontal: scaleSize(16),
    justifyContent: "center",
    alignItems: "center",
  },
  quoteKazakh: {
    fontSize: scaleFont(18),
    fontStyle: "italic",
    color: COLORS.text,
    textAlign: "center",
  },
  quoteTranslation: {
    marginTop: scaleSize(6),
    fontSize: scaleFont(13),
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  quoteAuthor: {
    marginTop: scaleSize(4),
    fontSize: scaleFont(12),
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default KazakhQuote;
