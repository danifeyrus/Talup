import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export const SCREEN = {
    width,
    height,
    isSmall: width < 360,
    isTablet: width >= 768,
    isLarge: width >= 1024,
};

export const DIMENSIONS = {
    compactWidth: width * 0.85,
    imageHeight25: height * 0.25,
    imageHeight35: height * 0.35,
    headerHeight: 80,
    statusBar: Platform.OS === "android" ? 24 : 0,
};

export const scaleFont = (size: number) => {
    const scale = width / 375;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const scaleSize = (size: number) => {
    const scale = width / 375;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
