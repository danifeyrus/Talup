import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BaseSafeArea from "../components/BaseSafeArea";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import { getAvatarUrl } from "../utils/avatar";
import { Dimensions } from "react-native";

const STATUSBAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : scaleSize(44);
const HEADER_HEIGHT = scaleSize(80);
const HEADER_FULL = STATUSBAR_HEIGHT + HEADER_HEIGHT;
const HEADER_SHIFT = scaleSize(140);
const PODIUM_HEIGHT = scaleSize(320);
const IMAGE_HEIGHT = HEADER_FULL + PODIUM_HEIGHT;
const CONTENT_OFFSET = scaleSize(130);

interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string;
  treeXp: number;
  position: number;
  isCurrent: boolean;
}

const LeaderboardScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLeaderboard = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUsers(data.slice(0, 50));
        const current = data.find((u: LeaderboardUser) => u.isCurrent);
        if (current && current.position > 50) setCurrentUser(current);
      } catch (err) {
        console.error("Ошибка загрузки таблицы лидеров:", err);
      }
    };

    fetchLeaderboard();
    interval = setInterval(fetchLeaderboard, 30000);

    return () => clearInterval(interval);
  }, []);

  const imageTranslate = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT],
    outputRange: [0, -IMAGE_HEIGHT / 9],
    extrapolate: "clamp",
  });

  const topThree = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Таблица лидеров</Text>
      </View>

      <BaseSafeArea>
        <Animated.View
          style={[styles.topSection, { transform: [{ translateY: imageTranslate }] }]}
        >
          <View style={styles.podiumRow}>
            {topThree[1] && (
              <View key={topThree[1].id} style={styles.podiumItem}>
                <Image source={getAvatarUrl(topThree[1].avatar)} style={styles.podiumAvatar} />
                <Text style={styles.podiumName}>{topThree[1].name}</Text>
                <Text style={styles.podiumScore}>{topThree[1].treeXp} баллов</Text>
                <View style={[styles.podiumBase, styles.secondPlace]}>
                  <Text style={styles.podiumNumber}>2</Text>
                </View>
              </View>
            )}
            {topThree[0] && (
              <View key={topThree[0].id} style={styles.podiumItem}>
                <Image source={getAvatarUrl(topThree[0].avatar)} style={styles.podiumAvatar} />
                <Text style={styles.podiumName}>{topThree[0].name}</Text>
                <Text style={styles.podiumScore}>{topThree[0].treeXp} баллов</Text>
                <View style={[styles.podiumBase, styles.firstPlace]}>
                  <Text style={styles.podiumNumber}>1</Text>
                </View>
              </View>
            )}
            {topThree[2] && (
              <View key={topThree[2].id} style={styles.podiumItem}>
                <Image source={getAvatarUrl(topThree[2].avatar)} style={styles.podiumAvatar} />
                <Text style={styles.podiumName}>{topThree[2].name}</Text>
                <Text style={styles.podiumScore}>{topThree[2].treeXp} баллов</Text>
                <View style={[styles.podiumBase, styles.thirdPlace]}>
                  <Text style={styles.podiumNumber}>3</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        <ScrollView
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: IMAGE_HEIGHT - CONTENT_OFFSET }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={styles.contentArea}>
            {rest.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.userCard,
                  {
                    backgroundColor: user.isCurrent
                      ? COLORS.currentUserHighlight
                      : COLORS.white,
                  },
                ]}
              >
                <Text style={styles.userPosition}>
                  {user.position < 10 ? `0${user.position}` : user.position}
                </Text>
                <Image source={getAvatarUrl(user.avatar)} style={styles.cardAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userStats}>{user.treeXp} баллов</Text>
                </View>
              </View>
            ))}

            {currentUser && (
              <>
                <Text style={styles.currentUserNote}>
                  Вы на {currentUser.position}-м месте
                </Text>
                <View style={[styles.userCard, { backgroundColor: COLORS.currentUserHighlight }]}>
                  <Text style={styles.userPosition}>
                    {currentUser.position < 10
                      ? `0${currentUser.position}`
                      : currentUser.position}
                  </Text>
                  <Image source={getAvatarUrl(currentUser.avatar)} style={styles.cardAvatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{currentUser.name}</Text>
                    <Text style={styles.userStats}>{currentUser.treeXp} баллов</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </BaseSafeArea>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: STATUSBAR_HEIGHT,
    height: HEADER_FULL,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    color: COLORS.white,
  },
  topSection: {
    position: "absolute",
    top: HEADER_FULL - HEADER_SHIFT,
    height: "100%",
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    zIndex: 0,
    paddingHorizontal: scaleSize(16),
  },
  podiumRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginTop: scaleSize(24),
    height: PODIUM_HEIGHT,
  },
  podiumItem: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: scaleSize(80),
    gap: scaleSize(2),
  },
  podiumBase: {
    backgroundColor: "#6AD479",
    width: scaleSize(100),
    borderRadius: scaleSize(12),
    marginTop: scaleSize(6),
    alignItems: "center",
    justifyContent: "center",
  },
  podiumNumber: {
    color: COLORS.white,
    fontSize: scaleFont(20),
    fontWeight: "bold",
  },
  firstPlace: {
    height: scaleSize(210),
  },
  secondPlace: {
    height: scaleSize(170),
  },
  thirdPlace: {
    height: scaleSize(150),
  },
  podiumAvatar: {
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(6),
  },
  podiumName: {
    fontWeight: "bold",
    color: COLORS.white,
    fontSize: scaleFont(14),
    textAlign: "center",
  },
  podiumScore: {
    color: COLORS.white,
    fontSize: scaleFont(12),
    textAlign: "center",
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(24),
    paddingBottom: scaleSize(24),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    minHeight: Dimensions.get("window").height - IMAGE_HEIGHT + CONTENT_OFFSET,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scaleSize(12),
    gap: scaleSize(16),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(12),
    marginBottom: scaleSize(10),
    borderBottomWidth: 1,
    borderBottomColor: "#F6F6F6",
  },
  userPosition: {
    fontSize: scaleFont(16),
    fontWeight: "500",
    color: "#6A6A72",
    width: scaleSize(28),
    textAlign: "center",
  },
  cardAvatar: {
    width: scaleSize(48),
    height: scaleSize(48),
    borderRadius: scaleSize(12),
  },
  userInfo: {
    flex: 1,
    gap: scaleSize(4),
  },
  userName: {
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  userStats: {
    fontSize: scaleFont(14),
    color: COLORS.primary,
  },
  currentUserNote: {
    textAlign: "center",
    marginBottom: scaleSize(8),
    fontSize: scaleFont(14),
    color: COLORS.subtitle,
  },
});

export default LeaderboardScreen;
