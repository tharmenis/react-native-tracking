# Vehicle Tracking App — PoC Project Brief

## Project Overview

Native mobile application (iOS & Android) for real-time vehicle tracking. The app is a client interface for a **self-hosted OpenRemote instance**. No custom backend — OpenRemote handles all asset data, real-time events, and identity via its bundled Keycloak instance.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native (cross-platform iOS & Android) |
| Backend / Asset Platform | OpenRemote (self-hosted) |
| Authentication | Keycloak (bundled with OpenRemote) via OAuth2/OIDC |
| Maps | Google Maps via `react-native-maps` (Google Maps provider) |
| State Management | Zustand |
| Token Storage | `react-native-keychain` (Keychain/Keystore — never AsyncStorage) |
| Vehicle Detail UI | `@gorhom/bottom-sheet` |

### Key packages
```
react-native-app-auth
react-native-maps
react-native-keychain
@gorhom/bottom-sheet
zustand
react-native-maps-clustering
```

---

## Authentication

Authentication is handled **entirely by Keycloak**. No extra auth layer exists in the app.

**Flow:**
1. App launches → check Keychain for a stored access token
2. No valid token → trigger `authorize()` via `react-native-app-auth` (opens Keycloak in secure browser session)
3. On success → store `accessToken` + `refreshToken` in Keychain
4. All API and WebSocket calls include `Authorization: Bearer <token>`
5. On 401 → attempt token refresh, or re-trigger login

**Config required:**
- Keycloak realm name
- Public OIDC client ID (registered in Keycloak)
- Discovery URL: `https://<your-domain>/auth/realms/<realm>/.well-known/openid-configuration`

**Key files:**
- `src/auth/authConfig.ts` — OIDC config constants
- `src/auth/useAuth.ts` — login / logout / token refresh hook

---

## Vehicle Map Screen

The primary screen of the PoC. Data comes from two channels:

### A. Initial Load — REST API
On mount, fetch all vehicle assets and their current attribute snapshot:
```
GET /api/{realm}/asset?type=Vehicle
Authorization: Bearer <token>
```

### B. Live Updates — WebSocket
After initial load, open a WebSocket connection and subscribe to OpenRemote attribute events for all vehicle assets. This drives real-time marker movement without polling.

Example subscribe payload:
```json
{
    "subscribed": false,
    "type": "SUBSCRIBE",
    "body": {
        "eventType": "attribute",
        "filter": {
            "filterType": "asset-type",
            "assetType": "Vehicle"
        }
    }
}
```

**Key files:**
- `src/api/openremote.ts` — REST calls (fetch assets, attributes)
- `src/api/websocket.ts` — WebSocket subscription manager

### Map Marker Behaviour
- One marker per vehicle, positioned from `location` attribute (GeoJSON lat/lng point)
- Marker icon style reflects status: **moving** / **idle** / **offline**
- Status derivation rule:
    - `moving` = `ignitionOn === true` and `speed > 0`
    - `idle` = `ignitionOn === true` and `speed === 0`
    - `offline` = `connected === false` OR (`now - lastSeen`) > 300 seconds
- Marker arrow rotates based on `heading`
- Clusters when zoomed out (`react-native-maps-clustering`)
- Tap marker → bottom sheet with vehicle detail

---

## OpenRemote Data Model

| OpenRemote Attribute | Type | UI Usage |
|---|---|---|
| `location` | GeoJSON point | Map marker position |
| `speed` | Number | Bottom sheet + marker label |
| `heading` | Number (degrees) | Marker arrow rotation |
| `ignitionOn` | Boolean | Status badge |
| `fuelLevel` | Number (%) | Fuel indicator in detail sheet |
| `lastSeen` | Timestamp | Mark offline when now minus `lastSeen` > 5 minutes |
| `connected` | Boolean | Directly drives online/offline marker style |

---

## Project Structure

```
src/
├── auth/
│   ├── authConfig.ts           # Keycloak OIDC config constants
│   └── useAuth.ts              # login / logout / token refresh hook
├── api/
│   ├── openremote.ts           # REST calls (fetch assets, attributes)
│   └── websocket.ts            # WebSocket subscription manager
├── screens/
│   ├── LoginScreen.tsx
│   └── MapScreen.tsx
├── components/
│   ├── VehicleMarker.tsx
│   └── VehicleBottomSheet.tsx
└── store/
    └── vehicleStore.ts         # Zustand store for vehicle asset state
```

---

## PoC Milestones

| # | Milestone | Deliverable |
|---|---|---|
| 1 | Authentication | Login/logout via Keycloak; token stored and attached to all requests |
| 2 | Asset List Loads | Vehicles fetched from OpenRemote REST and renderable as a list |
| 3 | Map with Static Markers | Vehicles plotted on Google Maps from initial REST fetch |
| 4 | Live Marker Updates | WebSocket subscription moves markers in real time |
| 5 | Vehicle Detail Sheet | Tap a marker → speed, fuel, ignition, heading displayed in bottom sheet |

---

## Implementation Notes

- **Google Maps API key** must be configured for both platforms: `AppDelegate` (iOS) and `AndroidManifest.xml` (Android)
- **Token storage** — always use `react-native-keychain`. Never use `AsyncStorage` for tokens
- **Vehicle assets** in OpenRemote must be of type `Vehicle` with the attribute schema above
- **WebSocket subscription payload** — use the SUBSCRIBE JSON example above in `src/api/websocket.ts`
- **WebSocket reconnection** — on close/error, retry with exponential backoff (1s, 2s, 4s, ... capped at 30s), maximum 5 attempts; after reconnect, re-send the subscribe payload; after final failure, surface an in-app error banner
- **Keycloak client** must be a public OIDC client (no client secret) to support the mobile PKCE flow