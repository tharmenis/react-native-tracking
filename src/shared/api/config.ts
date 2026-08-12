import { Platform } from 'react-native';

// Default production URL
const prodBaseUrl = 'https://trackingbackend-production-8b2e.up.railway.app';

// Development fallbacks:
// - Android emulator: 10.0.2.2 maps to host localhost
// - iOS simulator: localhost works
// - Physical device: set EXPO_PUBLIC_API_BASE_URL to your machine IP (e.g. http://192.168.1.10:3000)
function defaultDevBase() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

const defaultBaseUrl = __DEV__ ? defaultDevBase() : prodBaseUrl;
const defaultVehiclesPath = '/api/vehicles';
const defaultAlarmsPath = '/alarms';
const defaultPushTokenPath = '/users/push-token';
const defaultVehiclesMethod = 'POST';
const defaultTripHistoryPath = '/api/trip-history';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizePath(value: string) {
  if (!value) {
    return defaultVehiclesPath;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

export const apiConfig = {
  baseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? defaultBaseUrl),
  alarmsPath: normalizePath(process.env.EXPO_PUBLIC_API_ALARMS_PATH?.trim() ?? defaultAlarmsPath),
  vehiclesPath: normalizePath(process.env.EXPO_PUBLIC_API_VEHICLES_PATH?.trim() ?? defaultVehiclesPath),
  pushTokenPath: normalizePath(process.env.EXPO_PUBLIC_API_PUSH_TOKEN_PATH?.trim() ?? defaultPushTokenPath),
  vehiclesMethod: (process.env.EXPO_PUBLIC_API_VEHICLES_METHOD?.trim().toUpperCase() ?? defaultVehiclesMethod),
  tripHistoryPath: normalizePath(process.env.EXPO_PUBLIC_API_TRIP_HISTORY_PATH?.trim() ?? defaultTripHistoryPath),
};

export function hasApiBaseUrl() {
  return apiConfig.baseUrl.length > 0;
}

export function buildApiUrl(path: string) {
  if (!hasApiBaseUrl()) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
  }

  const full = `${apiConfig.baseUrl}${normalizePath(path)}`;

  return full;
}