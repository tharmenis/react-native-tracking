export const REDIRECT_SCHEME = 'pcp-tracking-app';

export const REALM_RESOLVE_PATH = '/auth/resolve-realm';

export type RealmInfo = {
  realmName: string;
  keycloakBaseUrl: string; // e.g. https://your-openremote-host/auth
  clientId: string;
};

export const DEFAULT_OIDC_SCOPES = ['openid', 'offline_access'];

export const TOKEN_STORAGE_SERVICE = 'pcp-tracking-auth';
