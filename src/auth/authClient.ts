import * as Keychain from 'react-native-keychain';
import { TOKEN_STORAGE_SERVICE, RealmInfo } from './authConfig';

function nowMs() {
  return Date.now();
}

type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  realm?: RealmInfo;
};

async function loadTokens(): Promise<StoredTokens | null> {
  const creds = await Keychain.getGenericPassword({ service: TOKEN_STORAGE_SERVICE });
  if (!creds) return null;
  try {
    return JSON.parse(creds.password) as StoredTokens;
  } catch (e) {
    return null;
  }
}

async function saveTokens(tokens: StoredTokens) {
  await Keychain.setGenericPassword('pcp', JSON.stringify(tokens), { service: TOKEN_STORAGE_SERVICE });
}

async function clearTokens() {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_STORAGE_SERVICE });
  } catch (e) {
    // ignore
  }
}

async function refreshTokensIfNeeded(tokens: StoredTokens | null): Promise<StoredTokens | null> {
  if (!tokens || !tokens.realm) return tokens;

  const expiresAt = tokens.expiresAt ?? 0;
  if (expiresAt - nowMs() > 60_000) return tokens;

  if (!tokens.refreshToken) {
    await clearTokens();
    return null;
  }

  const realm = tokens.realm;
  const tokenUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/token`;
  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('client_id', realm.clientId);
  body.append('refresh_token', tokens.refreshToken);

  const res = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const json = await res.json();
  const at = json.access_token as string;
  const rt = json.refresh_token as string | undefined;
  const expiresIn = json.expires_in as number | undefined;

  const stored: StoredTokens = {
    accessToken: at,
    refreshToken: rt ?? tokens.refreshToken,
    expiresAt: expiresIn ? nowMs() + expiresIn * 1000 : undefined,
    realm: tokens.realm,
  };

  await saveTokens(stored);
  return stored;
}

export async function authFetch(input: RequestInfo, init?: RequestInit) {
  const tokens = await loadTokens();
  const usable = await refreshTokensIfNeeded(tokens);
  if (!usable) throw new Error('Not authenticated');

  const headers = new Headers(init?.headers ?? {});
  headers.set('Authorization', `Bearer ${usable.accessToken}`);
  const merged: RequestInit = { ...(init ?? {}), headers };

 

  return fetch(input, merged);
}

export async function clearAuth() {
  await clearTokens();
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  const usable = await refreshTokensIfNeeded(tokens);
  return usable?.accessToken ?? null;
}
