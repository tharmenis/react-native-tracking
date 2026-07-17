import { useState, useEffect, useCallback } from 'react';
import * as Keychain from 'react-native-keychain';
import { buildApiUrl } from '../shared/api/config';
import {
  REALM_RESOLVE_PATH,
  REDIRECT_SCHEME,
  DEFAULT_OIDC_SCOPES,
  RealmInfo,
  TOKEN_STORAGE_SERVICE,
} from './authConfig';

type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // epoch ms
  realm?: RealmInfo;
};

function nowMs() {
  return Date.now();
}

async function saveTokens(tokens: StoredTokens) {
  await Keychain.setGenericPassword('pcp', JSON.stringify(tokens), {
    service: TOKEN_STORAGE_SERVICE,
  });
}

async function loadTokens(): Promise<StoredTokens | null> {
  const creds = await Keychain.getGenericPassword({ service: TOKEN_STORAGE_SERVICE });
  if (!creds) return null;
  try {
    return JSON.parse(creds.password) as StoredTokens;
  } catch (e) {
    return null;
  }
}

async function clearTokens() {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_STORAGE_SERVICE });
  } catch (e) {
    // ignore
  }
}

export function useAuth() {
  const [realm, setRealm] = useState<RealmInfo | null>(null);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTokens();
      if (!mounted) return;
      if (stored) {
        setTokens(stored);
        if (stored.realm) setRealm(stored.realm);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resolveRealm = useCallback(async (orgSlug: string) => {
    const url = buildApiUrl(REALM_RESOLVE_PATH);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgSlug }),
    });
   
    if (!res.ok) {
      const text = await res.text().catch(() => '');
     
    }

    if (res.status === 404) {
      const payload = JSON.parse((await res.text().catch(() => '{}')) || '{}');
      throw new Error(payload?.error ?? 'unknown_organization');
    }

    if (res.status === 429) {
      throw new Error('rate_limited');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Realm resolution failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const info: RealmInfo = {
      realmName: json.realmName,
      keycloakBaseUrl: json.keycloakBaseUrl,
      clientId: json.clientId ?? 'pcp-tracking-app',
    };
    setRealm(info);
    return info;
  }, []);

  async function exchangeCodeForTokens({
    code,
    codeVerifier,
    redirectUri,
  }: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) {
    if (!realm) throw new Error('No realm configured');

    const tokenUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/token`;

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('client_id', realm.clientId);
    body.append('code', code);
    body.append('redirect_uri', redirectUri);
    body.append('code_verifier', codeVerifier);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Token exchange failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const at = json.access_token as string;
    const rt = json.refresh_token as string | undefined;
    const expiresIn = json.expires_in as number | undefined;

    const stored: StoredTokens = {
      accessToken: at,
      refreshToken: rt,
      expiresAt: expiresIn ? nowMs() + expiresIn * 1000 : undefined,
      realm,
    };

    await saveTokens(stored);
    setTokens(stored);
    return stored;
  }

  async function refreshTokensIfNeeded() {
    if (!tokens || !realm) return tokens;

    const expiresAt = tokens.expiresAt ?? 0;
    // Refresh if token expires within next 60 seconds
    if (expiresAt - nowMs() > 60_000) return tokens;

    if (!tokens.refreshToken) {
      // cannot refresh
      await clearTokens();
      setTokens(null);
      return null;
    }

    const tokenUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/token`;
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('client_id', realm.clientId);
    body.append('refresh_token', tokens.refreshToken);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      await clearTokens();
      setTokens(null);
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
      realm,
    };

    await saveTokens(stored);
    setTokens(stored);
    return stored;
  }

  const getAccessToken = useCallback(async () => {
    const maybe = await refreshTokensIfNeeded();
    return maybe?.accessToken ?? null;
  }, [tokens, realm]);

  const logout = useCallback(async (callEndSession = false) => {
    // Optionally call Keycloak end-session endpoint
    if (callEndSession && tokens?.accessToken && realm) {
      try {
        const endUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/logout`;
        const body = new URLSearchParams();
        body.append('client_id', realm.clientId);
        if (tokens.refreshToken) body.append('refresh_token', tokens.refreshToken);
        await fetch(endUrl, { method: 'POST', body: body.toString() });
      } catch (e) {
        // ignore
      }
    }

    await clearTokens();
    setTokens(null);
    setRealm(null);
  }, [tokens, realm]);

  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const at = await getAccessToken();
      if (!at) throw new Error('Not authenticated');

      const headers = new Headers(init?.headers ?? {});
      headers.set('Authorization', `Bearer ${at}`);
      const merged: RequestInit = { ...(init ?? {}), headers };
      return fetch(input, merged);
    },
    [getAccessToken]
  );

  return {
    realm,
    tokens,
    loading,
    resolveRealm,
    exchangeCodeForTokens,
    getAccessToken,
    logout,
    authFetch,
    REDIRECT_SCHEME,
    DEFAULT_OIDC_SCOPES,
  } as const;
}

export default useAuth;
