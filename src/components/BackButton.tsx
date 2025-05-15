import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { scaleSize } from "../constants/dimensions";
import { useTypedNavigation } from "../hooks/useTypedNavigation";
import { RootStackParamList } from "../navigation/Navigation";

type BackButtonProps = {
  destination?: keyof RootStackParamList;
};

const BackButton: React.FC<BackButtonProps> = ({ destination = "Welcome" }) => {
  const navigation = useTypedNavigation();

  const handlePress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(destination);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: scaleSize(16), bottom: scaleSize(16), left: scaleSize(16), right: scaleSize(16) }}
      accessibilityLabel="Назад"
      accessibilityRole="button"
    >
      <Image
        style={styles.backbutton}
        resizeMode="contain"
        source={require("../../assets/backbutton.png")}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

  backbutton: {
    width: scaleSize(28),
    height: scaleSize(28),
  },
});

export default BackButton;
