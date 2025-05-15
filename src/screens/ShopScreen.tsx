import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    Alert,
    TouchableOpacity,
    useWindowDimensions,
    SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { scaleFont, scaleSize } from "../constants/dimensions";
import BackButton from "../components/BackButton";

const ShopScreen = () => {
    const navigation = useNavigation();
    const [coins, setCoins] = useState(0);
    const { width } = useWindowDimensions();

    const loadCoins = async () => {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setCoins(data.coins);
    };

    useEffect(() => {
        loadCoins();
    }, []);

    const handleBuyLife = async () => {
        const token = await AsyncStorage.getItem("userToken");
        const res = await fetch(`${API_URL}/api/shop/buy-life`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
            Alert.alert("Ошибка", data.error || "Не удалось купить жизнь");
        } else {
            Alert.alert("Успех", "Жизнь куплена!");
            setCoins(data.coins);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.inner, { width: width * 0.9 }]}>
                <View style={styles.headerRowFull}>
                    <BackButton />
                    <Text style={styles.title}>Магазин</Text>
                    <View style={styles.coinsRow}>
                        <Text style={styles.coin}>{coins}</Text>
                        <Image source={require("../../assets/star.png")} style={styles.icon} />
                    </View>
                </View>

                <View style={styles.grid}>
                    <TouchableOpacity style={styles.item} onPress={handleBuyLife}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={require("../../assets/GreenHeart.png")}
                                style={styles.itemIcon}
                            />
                        </View>

                        <Text style={styles.itemTitle}>Жизнь</Text>
                        <Text style={styles.itemPrice}>5 монет</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: "center",
        paddingTop: scaleSize(20)
    },
    inner: {
        flex: 1,
        paddingTop: scaleSize(20),
    },
    headerRowFull: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: scaleSize(16),
    },
    title: {
        fontSize: scaleFont(24),
        fontWeight: "bold",
        color: COLORS.text,
    },
    coinsRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    coin: {
        fontSize: scaleFont(18),
        fontWeight: "bold",
        color: COLORS.text,
        marginRight: scaleSize(8),
    },
    icon: {
        width: scaleSize(26),
        height: scaleSize(26),
        resizeMode: "contain",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: scaleSize(20),
        marginTop: scaleSize(16)
    },
    item: {
        width: "48%",
        backgroundColor: COLORS.white,
        borderRadius: scaleSize(16),
        padding: scaleSize(16),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E6E6E6",
    },
    imageContainer: {
        width: scaleSize(60),
        height: scaleSize(60),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: scaleSize(8),
      },      
      itemIcon: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
      },      
    itemTitle: {
        fontSize: scaleFont(16),
        fontWeight: "bold",
        color: COLORS.text,
    },
    itemPrice: {
        fontSize: scaleFont(14),
        color: COLORS.textSecondary,
        marginTop: scaleSize(4),
    },
});

export default ShopScreen;
