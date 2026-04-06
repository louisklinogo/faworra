"use strict";
// metro.config.cjs is explicitly CommonJS — Metro loads this file directly
// and does not support ESM config files. The .cjs extension ensures this file is
// always treated as CommonJS regardless of the root package.json "type" field.
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const {
	wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const uniwindConfig = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
	cssEntryFile: "./global.css",
	dtsFile: "./uniwind-types.d.ts",
});

module.exports = uniwindConfig;
