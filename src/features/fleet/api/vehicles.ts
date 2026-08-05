import {
  apiConfig,
  buildApiUrl,
  hasApiBaseUrl,
} from "../../../shared/api/config";
import { ApiError } from "../../../shared/api/request";
import { vehicles as fallbackVehicles } from "../../../shared/data/mockData";
import { Vehicle, VehicleStatus } from "../../../shared/types/models";

type FetchVehiclesResult = {
  vehicles: Vehicle[];
  source: "remote" | "mock" | "error";
  message?: string;
};

type FetchVehiclesOptions = {
  signal?: AbortSignal;
};

type RemoteVehicleRecord = Record<string, unknown>;

function asRecord(value: unknown): RemoteVehicleRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as RemoteVehicleRecord;
}

function asString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

function parseCoordinatePair(value: string) {
  const parts = value.split(",").map((part) => Number(part.trim()));

  if (
    parts.length !== 2 ||
    !Number.isFinite(parts[0]) ||
    !Number.isFinite(parts[1])
  ) {
    return null;
  }

  return {
    latitude: parts[0],
    longitude: parts[1],
  };
}

function extractCoordinates(record: RemoteVehicleRecord) {
  const directLatitude = asNumber(record.latitude ?? record.lat);
  const directLongitude = asNumber(
    record.longitude ?? record.lng ?? record.lon,
  );

  if (directLatitude !== null && directLongitude !== null) {
    return {
      latitude: directLatitude,
      longitude: directLongitude,
    };
  }

  const locationValue =
    record.location ?? record.position ?? record.coordinates ?? record.geo;

  if (typeof locationValue === "string") {
    return parseCoordinatePair(locationValue);
  }

  const nested = asRecord(locationValue);

  if (!nested) {
    return null;
  }

  const nestedLatitude = asNumber(nested.latitude ?? nested.lat);
  const nestedLongitude = asNumber(
    nested.longitude ?? nested.lng ?? nested.lon,
  );

  if (nestedLatitude !== null && nestedLongitude !== null) {
    return {
      latitude: nestedLatitude,
      longitude: nestedLongitude,
    };
  }

  const coordinatesArray = Array.isArray(nested.coordinates)
    ? nested.coordinates
    : null;

  if (coordinatesArray && coordinatesArray.length >= 2) {
    const longitude = asNumber(coordinatesArray[0]);
    const latitude = asNumber(coordinatesArray[1]);

    if (latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
      };
    }
  }

  return null;
}

function toVehicleStatus(value: string): VehicleStatus {
  switch (value.toLowerCase()) {
    case "active":
    case "moving":
    case "online":
      return "active";
    case "idle":
    case "parked":
    case "stopped":
      return "idle";
    case "alert":
    case "overspeed":
    case "speeding":
    case "alarm":
      return "alert";
    case "offline":
    case "off":
    case "inactive":
      return "off";
    default:
      return "active";
  }
}

function formatMeta(record: RemoteVehicleRecord) {
  const speed = asNumber(
    record.speed ?? record.currentSpeed ?? record.velocity,
  );

  if (speed !== null && speed > 0) {
    return `${Math.round(speed)} km/h`;
  }

  const eventText = asString(
    record.event ?? record.lastEvent ?? record.alert ?? record.state,
  );

  if (eventText) {
    return eventText;
  }

  const location = asString(
    record.location ?? record.lastLocation ?? record.address,
  );

  if (location) {
    return location;
  }

  return "No telemetry available";
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  const nestedCollection =
    record.items ?? record.data ?? record.vehicles ?? record.results;

  return Array.isArray(nestedCollection) ? nestedCollection : [];
}

function mapRemoteVehicle(item: unknown, index: number): Vehicle | null {
  const record = asRecord(item);

  if (!record) {
    return null;
  }

  const id =
    asString(record.id ?? record.deviceId ?? record.vehicleId ?? record.uuid) ||
    `vehicle-${index}`;
  const name =
    asString(record.name ?? record.label ?? record.vehicleName) ||
    `Vehicle ${index + 1}`;
  const plate =
    asString(
      record.plate ?? record.licensePlate ?? record.registrationNumber,
    ) || "Unknown plate";
  const driver =
    asString(record.driver ?? record.driverName ?? record.assignedDriver) ||
    "Unassigned";
  const statusValue = asString(
    record.status ?? record.state ?? record.connectionStatus,
  );
  const coordinates = extractCoordinates(record);
  const heading = asNumber(record.heading ?? record.bearing ?? record.course);
  const speed = asNumber(
    record.speed ?? record.currentSpeed ?? record.velocity,
  );
  const connected = asBoolean(
    record.connected ?? record.online ?? record.isConnected,
  );
  const lastSeen = asString(
    record.lastSeen ?? record.updatedAt ?? record.timestamp,
  );

  return {
    id,
    name,
    plate,
    driver,
    meta: formatMeta(record),
    status: toVehicleStatus(statusValue),
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    heading: heading ?? undefined,
    speed: speed ?? undefined,
    connected: connected ?? undefined,
    lastSeen: lastSeen || undefined,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Vehicle service rejected the access token.";
    }

    if (error.status === 403) {
      return "Vehicle service could not resolve the user realm.";
    }

    if (error.status >= 500) {
      return "Vehicle service is temporarily unavailable.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load vehicles from the remote instance.";
}

export async function fetchVehicles(
  options?: FetchVehiclesOptions,
): Promise<FetchVehiclesResult> {
  const signal = options?.signal;

  if (!hasApiBaseUrl()) {
    return {
      vehicles: fallbackVehicles,
      source: "mock",
      message: "Set EXPO_PUBLIC_API_BASE_URL to load live vehicles.",
    };
  }

  const fullUrl = buildApiUrl(apiConfig.vehiclesPath);

  if (__DEV__) {
    const requestDetails = {
      method: apiConfig.vehiclesMethod,
      url: fullUrl,
      headers: {
        Accept: "application/json",
      },
      body: null,
      signalAborted: signal?.aborted ?? false,
    };

    console.log("[api/vehicles] request", requestDetails);
  }

  try {
    const { requestJson } = await import("../../../shared/api/request");
    const payload = await requestJson(apiConfig.vehiclesPath, {
      method: apiConfig.vehiclesMethod,
      headers: { Accept: "application/json" },
      signal,
    });

    const remoteVehicles = extractCollection(payload)
      .map((item, index) => mapRemoteVehicle(item, index))
      .filter((item): item is Vehicle => item !== null);

    return {
      vehicles: remoteVehicles,
      source: "remote",
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        vehicles: [],
        source: "error",
        message: toErrorMessage(error),
      };
    }

    return {
      vehicles: fallbackVehicles,
      source: "mock",
      message: toErrorMessage(error),
    };
  }
}
