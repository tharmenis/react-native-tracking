import { useState, useEffect, useCallback } from "react";
import * as Keychain from "react-native-keychain";
import { buildApiUrl } from "../shared/api/config";
import {
  REALM_RESOLVE_PATH,
  REDIRECT_SCHEME,
  DEFAULT_OIDC_SCOPES,
  RealmInfo,
  TOKEN_STORAGE_SERVICE,
} from "./authConfig";

type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number; // epoch ms
  realm?: RealmInfo;
  orgSlug?: string; // last successfully resolved org slug
};

type IdTokenClaims = {
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
};

/** Minimal base64url decoder (works on Hermes where atob is unavailable). */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < padded.length; i += 4) {
    const a = chars.indexOf(padded[i]);
    const b = chars.indexOf(padded[i + 1]);
    const c = chars.indexOf(padded[i + 2]);
    const d = chars.indexOf(padded[i + 3]);
    if (a === -1 || b === -1) break;
    const bytes = [(a << 2) | (b >> 4), ((b & 15) << 4) | (c >> 2), ((c & 3) << 6) | d];
    result += String.fromCharCode(bytes[0]);
    if (c !== -1) result += String.fromCharCode(bytes[1]);
    if (d !== -1) result += String.fromCharCode(bytes[2]);
  }
  return result;
}

/** Decode the payload of a JWT id_token into its OIDC claims. */
function decodeIdToken(idToken?: string): IdTokenClaims | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    return JSON.parse(base64UrlDecode(payload)) as IdTokenClaims;
  } catch {
    return null;
  }
}

function nowMs() {
  return Date.now();
}

async function saveTokens(tokens: Partial<StoredTokens>) {
  await Keychain.setGenericPassword("pcp", JSON.stringify(tokens), {
    service: TOKEN_STORAGE_SERVICE,
  });
}

async function loadTokens(): Promise<StoredTokens | null> {
  const creds = await Keychain.getGenericPassword({
    service: TOKEN_STORAGE_SERVICE,
  });
  if (!creds) return null;
  try {
    const parsed = JSON.parse(creds.password) as StoredTokens;
    console.log("[loadTokens] parsed", {
      hasAccessToken: !!parsed.accessToken,
      hasRealm: !!parsed.realm,
      orgSlug: parsed.orgSlug,
    });
    return parsed;
  } catch (e) {
    console.log("[loadTokens] parse error", e);
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
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasCachedRealm, setHasCachedRealm] = useState(false);

  // Derive the user's display identity from the ID token's OIDC claims.
  const idClaims = tokens ? decodeIdToken(tokens.idToken) : null;
  const firstName = idClaims?.given_name ?? "";
  const lastName = idClaims?.family_name ?? "";
  const user = {
    firstName,
    lastName,
    displayName: [firstName, lastName].filter(Boolean).join(" ") || "User",
    initials:
      (firstName[0] ?? "") + (lastName[0] ?? "") || (idClaims?.preferred_username?.[0] ?? "?"),
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTokens();
      if (!mounted) return;
      if (stored) {
        setTokens(stored);
        if (stored.realm) {
          setRealm(stored.realm);
          setHasCachedRealm(true);
        }

        if (stored.orgSlug) setOrgSlug(stored.orgSlug);
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgSlug }),
    });

    const text = await res.text().catch(() => "");

    if (res.status === 404) {
      let payload: { error?: string } = {};
      try {
        payload = JSON.parse(text || "{}");
      } catch {
        // ignore malformed body
      }
      throw new Error(payload?.error ?? "unknown_organization");
    }

    if (res.status === 429) {
      throw new Error("rate_limited");
    }

    if (!res.ok) {
      throw new Error(`Realm resolution failed: ${res.status} ${text}`);
    }

    const json = JSON.parse(text);
    const info: RealmInfo = {
      realmName: json.realmName,
      keycloakBaseUrl: json.keycloakBaseUrl,
      clientId: json.clientId ?? "pcp-tracking-app",
    };

    // Persist the realm itself (not just the slug) so it survives an app
    // close even if the user hasn't completed login yet, and so the next
    // launch can skip re-resolving over the network.
    const stored = await loadTokens();
    await saveTokens({ ...(stored ?? {}), orgSlug, realm: info });

    setRealm(info);
    setOrgSlug(orgSlug);
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
    if (!realm) throw new Error("No realm configured");

    const tokenUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/token`;

    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("client_id", realm.clientId);
    body.append("code", code);
    body.append("redirect_uri", redirectUri);
    body.append("code_verifier", codeVerifier);

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Token exchange failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const at = json.access_token as string;
    const rt = json.refresh_token as string | undefined;
    const idToken = json.id_token as string | undefined;
    const expiresIn = json.expires_in as number | undefined;

    console.log("[exchangeCodeForTokens] RESPONSE keys:", Object.keys(json));
    console.log(
      "[exchangeCodeForTokens] has id_token:",
      !!idToken,
      "has access:",
      !!at,
    );
    console.log("[exchangeCodeForTokens] orgSlug at exchange:", orgSlug);

    const stored: StoredTokens = {
      accessToken: at,
      refreshToken: rt,
      idToken,
      expiresAt: expiresIn ? nowMs() + expiresIn * 1000 : undefined,
      realm,
      // Persist the slug from in-memory state (set by resolveRealm), which is
      // reliable — re-reading from Keychain right after a write can race with
      // the async DataStore flush and return a stale entry without the slug.
      orgSlug: orgSlug ?? undefined,
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
    body.append("grant_type", "refresh_token");
    body.append("client_id", realm.clientId);
    body.append("refresh_token", tokens.refreshToken);

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    const idToken = json.id_token as string | undefined;
    const expiresIn = json.expires_in as number | undefined;

    const stored: StoredTokens = {
      accessToken: at,
      refreshToken: rt ?? tokens.refreshToken,
      idToken: idToken ?? tokens.idToken,
      expiresAt: expiresIn ? nowMs() + expiresIn * 1000 : undefined,
      realm,
      orgSlug: tokens.orgSlug,
    };

    await saveTokens(stored);
    setTokens(stored);
    return stored;
  }

  const getAccessToken = useCallback(async () => {
    const maybe = await refreshTokensIfNeeded();
    return maybe?.accessToken ?? null;
  }, [tokens, realm]);

  const logout = useCallback(
    async (callEndSession = false) => {
      // Optionally call Keycloak end-session endpoint
      if (callEndSession && tokens?.accessToken && realm) {
        try {
          const endUrl = `${realm.keycloakBaseUrl}/realms/${realm.realmName}/protocol/openid-connect/logout`;
          const body = new URLSearchParams();
          body.append("client_id", realm.clientId);
          // id_token_hint is required for Keycloak to actually revoke the
          // browser session — without it the cookie survives and the next
          // login silently reuses the session.
          if (tokens.idToken) body.append("id_token_hint", tokens.idToken);
          if (tokens.refreshToken)
            body.append("refresh_token", tokens.refreshToken);
          console.log("[logout] end_session url:", endUrl);
          console.log(
            "[logout] has id_token_hint:",
            !!tokens.idToken,
            "has refresh:",
            !!tokens.refreshToken,
          );
          const logoutRes = await fetch(endUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
          });
          console.log("[logout] end_session status:", logoutRes.status);
        } catch (e) {
          console.log("[logout] end_session error:", e);
        }
      } else {
        console.log("[logout] SKIPPED end_session", {
          callEndSession,
          hasTokens: !!tokens?.accessToken,
          hasRealm: !!realm,
        });
      }

      await clearTokens();
      setTokens(null);
      setRealm(null);
      setOrgSlug(null);
    },
    [tokens, realm],
  );

  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      const at = await getAccessToken();
      if (!at) throw new Error("Not authenticated");

      const headers = new Headers(init?.headers ?? {});
      headers.set("Authorization", `Bearer ${at}`);
      const merged: RequestInit = { ...(init ?? {}), headers };
      return fetch(input, merged);
    },
    [getAccessToken],
  );

  return {
    realm,
    tokens,
    orgSlug,
    user,
    loading,
    hasCachedRealm,
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
