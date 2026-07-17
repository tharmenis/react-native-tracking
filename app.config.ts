import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';
const androidPackage = process.env.EXPO_ANDROID_PACKAGE?.trim() ?? 'com.fleettrack.mobile';

const config: ExpoConfig = {
  name: 'FleetTrack',
  slug: 'react-native-tracking',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#F1EFE8',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    "bundleIdentifier": "com.fleettrack.mobile",
    supportsTablet: false,
    config: {
      googleMapsApiKey,
    },
  },
  android: {
    package: androidPackage,
    adaptiveIcon: {
      backgroundColor: '#185FA5',
    },
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-asset', 'expo-font', 'expo-notifications'],
  scheme: 'pcp-tracking-app',
  
};

export default config;
