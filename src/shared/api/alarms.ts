import { apiConfig, buildApiUrl, hasApiBaseUrl } from './config';
import { alarms as fallbackAlarms } from '../data/mockData';
import { formatTimestamp } from '../helpers/formatters';
import { Alarm, AlarmSeverity, AlarmStatus } from '../types/models';

type FetchAlarmsResult = {
  alarms: Alarm[];
  source: 'remote' | 'mock';
  message?: string;
};

type RequestOptions = {
  signal?: AbortSignal;
};

type AlarmRecord = Record<string, unknown>;

function asRecord(value: unknown): AlarmRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as AlarmRecord;
}

function asString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return '';
}

function normalizeSeverity(value: unknown): AlarmSeverity {
  const normalized = asString(value).toLowerCase();

  if (normalized === 'high' || normalized === 'critical') {
    return 'high';
  }

  if (normalized === 'medium' || normalized === 'warning') {
    return 'medium';
  }

  return 'low';
}

function normalizeStatus(value: unknown): AlarmStatus {
  const normalized = asString(value).toLowerCase();

  if (normalized === 'acknowledged' || normalized === 'ack') {
    return 'acknowledged';
  }

  if (normalized === 'resolved' || normalized === 'closed' || normalized === 'done') {
    return 'resolved';
  }

  return 'open';
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  const nestedCollection = record.items ?? record.data ?? record.alarms ?? record.results;

  return Array.isArray(nestedCollection) ? nestedCollection : [];
}

function getRawValue(record: AlarmRecord, rawKey: string) {
  const raw = asRecord(record.raw);

  return raw?.[rawKey];
}

function getRawRecord(record: AlarmRecord, rawKey: string) {
  const rawValue = getRawValue(record, rawKey);

  if (Array.isArray(rawValue)) {
    return asRecord(rawValue[0]);
  }

  return asRecord(rawValue);
}

function getRelatedVehicleInfo(record: AlarmRecord, rawKey: string = 'asset') {
  const firstAsset = getRawRecord(record, rawKey);
  const vehicleRecord = asRecord(record['vehicle']);

  const vehicleName = asString(firstAsset?.['name'] ?? record['vehicleName'] ?? record['assetName'] ?? vehicleRecord?.['name']) || 'Unknown vehicle';
  const vehicleId = asString(record['vehicleId'] ?? record['assetId'] ?? record['deviceId'] ?? firstAsset?.['id'] ?? record['asset']) || vehicleName;

  return { vehicleId, vehicleName };
}

function mapRemoteAlarm(item: unknown, index: number): Alarm | null {
  const record = asRecord(item);

  if (!record) {
    return null;
  }

  const id = asString(record.id ?? record.alarmId ?? record.uuid) || `alarm-${index}`;
  const title = asString(record.title ?? record.name ?? record.label ?? record.message) || `Alarm ${index + 1}`;
  const description = asString(getRawValue(record, 'content') ?? record.content ?? record.details ?? record.message) || 'No additional details provided.';
  const { vehicleId, vehicleName } = getRelatedVehicleInfo(record);
  const createdAt = formatTimestamp(getRawValue(record, 'createdOn'),new Date().toISOString() );
  const updatedAt = formatTimestamp(getRawValue(record, 'lastModified') ,new Date().toISOString());
 

  return {
    id,
    title,
    description,
    severity: normalizeSeverity(record.severity ?? record.priority ?? record.level),
    status: normalizeStatus(record.status ?? record.state),
    vehicleId,
    vehicleName,
    createdAt,
    updatedAt,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load alarms from the remote instance.';
}

async function requestJson(path: string, init?: RequestInit) {
  if (!hasApiBaseUrl()) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL.');
  }

  const response = await fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

export async function fetchAlarms(options?: RequestOptions): Promise<FetchAlarmsResult> {
  if (!hasApiBaseUrl()) {
    return {
      alarms: fallbackAlarms,
      source: 'mock',
      message: 'Using demo alarms because no backend base URL is configured.',
    };
  }

  try {
    const payload = await requestJson(apiConfig.alarmsPath, { method: 'GET', signal: options?.signal });
    const records = extractCollection(payload);
    const mapped = records.map(mapRemoteAlarm).filter((item): item is Alarm => item !== null);

    return {
      alarms: mapped.length > 0 ? mapped : fallbackAlarms,
      source: mapped.length > 0 ? 'remote' : 'mock',
      message: mapped.length > 0 ? undefined : 'No remote alarms returned, using demo data.',
    };
  } catch (error) {
    return {
      alarms: fallbackAlarms,
      source: 'mock',
      message: toErrorMessage(error),
    };
  }
}

export async function acknowledgeAlarm(alarmId: string) {
  if (!hasApiBaseUrl()) {
    return;
  }

  await requestJson(`${apiConfig.alarmsPath}/${alarmId}/acknowledge`, { method: 'PUT' });
}

export async function resolveAlarm(alarmId: string) {
  if (!hasApiBaseUrl()) {
    return;
  }

  await requestJson(`${apiConfig.alarmsPath}/${alarmId}/resolve`, { method: 'PUT' });
}

export async function registerPushToken(pushToken: string) {
  if (!hasApiBaseUrl()) {
    return;
  }

  await requestJson(apiConfig.pushTokenPath, {
    method: 'POST',
    body: JSON.stringify({ pushToken }),
  });
}