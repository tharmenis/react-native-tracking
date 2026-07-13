## alerts functionality

Overview
Integrate Expo push notifications into the React Native app and build the Alarms feature. The backend (Node.js middleware) handles all push dispatch — the frontend only needs to register, receive, and react.

New Dependencies

expo-notifications — token generation, foreground/background message handling, and notification tap handling
expo-device — required by Expo Notifications to verify the app is running on a physical device before registering for push


New Work
Push Token Registration
On login, request push notification permissions using expo-notifications and generate the device's Expo push token. Send this token to the backend via POST /users/push-token. Handle token refresh by re-sending if Expo rotates it.
Note: push notifications only work on physical devices, not simulators. Use expo-device to gate the registration logic accordingly.
Message Handling
Handle push notifications in three app states:

Foreground — use expo-notifications notification listener to show an in-app alert banner for High severity alarms, requiring explicit user action to dismiss or navigate
Background — Expo handles OS-level display natively; tapping navigates via the notification response listener
Killed state — read the initial notification on app launch and route to the correct alarm screen

Alarms Screen
New screen that fetches from GET /alarms. Displays status, severity, title, and linked vehicle for each alarm. Allows the user to acknowledge or resolve an alarm in-line, calling the relevant backend endpoints.
Deep Linking
Tapping a push notification in any app state should navigate the user to the alarm detail screen for the relevant alarm, using the alarm ID included in the notification payload sent by the middleware.

Severity → UX Mapping
SeverityPush receivedIn-app behaviorHighYesIn-app banner requiring interaction + badge on Alarms tabLowNoEntry appears silently in Alarms list only

Open Items

Confirm which existing navigation structure the Alarms screen and deep link routing should hook into.
Confirm push notification permissions flow fits within the existing app onboarding (when and how the user is prompted).