const defaultBaseUrl = 'https://trackingbackend-production-8b2e.up.railway.app';
const defaultVehiclesPath = '/api/vehicles';
const defaultAlarmsPath = '/alarms';
const defaultPushTokenPath = '/users/push-token';
const defaultVehiclesMethod = 'POST';

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
};

export function hasApiBaseUrl() {
  return apiConfig.baseUrl.length > 0;
}

export function buildApiUrl(path: string) {
  if (!hasApiBaseUrl()) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
  }

  return `${apiConfig.baseUrl}${normalizePath(path)}`;
}