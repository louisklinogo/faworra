import { expoClient } from "@better-auth/expo/client";
import { env } from "@faworra-new/env/native";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

const secureStorage = {
	deleteItemAsync,
	getItem: getItemAsync,
	setItem: setItemAsync,
};

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storagePrefix: Constants.expoConfig?.scheme as string,
			storage: secureStorage,
		}),
	],
});
