import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Welcome from "../screens/WelcomeScreen";
import Login from "../screens/Login";
import Registration from "../screens/Registration";
import RegistrationFirst from "../screens/RegistrationFirst";
import RegistrationSecond from "../screens/RegistrationSecond";
import RegistrationThird from "../screens/RegistrationThird";
import SettingsScreen from "../screens/SettingsScreen";
import TabNavigator from "./TabNavigator";
import LearningScreen from "../screens/Learning";
import PreLearningScreen from "../screens/PreLearning";
import WordListScreen from "../screens/WordListScreen";
import ShopScreen from "../screens/ShopScreen";

export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Registration: undefined;
    RegistrationFirst: undefined;
    RegistrationSecond: undefined;
    RegistrationThird: undefined;
    MainScreen: undefined;
    Settings: undefined;
    LearningScreen: undefined;
    PreLearning: undefined;
    WordListScreen: undefined;
    Shop: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Welcome" component={Welcome} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Registration" component={Registration} />
                <Stack.Screen name="RegistrationFirst" component={RegistrationFirst} />
                <Stack.Screen name="RegistrationSecond" component={RegistrationSecond} />
                <Stack.Screen name="RegistrationThird" component={RegistrationThird} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="LearningScreen" component={LearningScreen} />
                <Stack.Screen name="PreLearning" component={PreLearningScreen} />
                <Stack.Screen name="MainScreen" component={TabNavigator} />
                <Stack.Screen name="WordListScreen" component={WordListScreen} />
                <Stack.Screen name="Shop" component={ShopScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
