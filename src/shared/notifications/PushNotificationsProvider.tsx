import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../../app/navigation/types';
import { registerPushToken as sendPushToken } from '../api/alarms';
import { colors, radius, shadows, spacing, typography } from '../theme/theme';
import { AlarmSeverity } from '../types/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowAlert: false,
    shouldShowList: false,
  }),
});

type AlarmPayload = {
  alarmId: string;
  title: string;
  body: string;
  severity: AlarmSeverity;
};

type RegistrationResult = {
  status: 'registered' | 'permission-denied' | 'unsupported-device' | 'missing-project-id';
  token?: string;
  message?: string;
};

type PushNotificationsContextValue = {
  alarmBadgeCount: number;
  clearAlarmBadgeCount: () => void;
  registerDevicePushToken: () => Promise<RegistrationResult>;
};

const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

function readProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

function getString(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return '';
}

function parseAlarmPayload(data: unknown): AlarmPayload | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const alarmId = getString(record.alarmId ?? record.alarm_id ?? record.id);

  if (!alarmId) {
    return null;
  }

  const severityValue = getString(record.severity).toLowerCase();

  return {
    alarmId,
    title: getString(record.title ?? record.name) || 'Alarm received',
    body: getString(record.body ?? record.message ?? record.description) || 'Tap to review the alarm details.',
    severity: severityValue === 'high' || severityValue === 'critical' ? 'high' : severityValue === 'medium' || severityValue === 'warning' ? 'medium' : 'low',
  };
}

type PushNotificationsProviderProps = {
  children: ReactNode;
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
  navigationReady: boolean;
};

export function PushNotificationsProvider({ children, navigationReady, navigationRef }: PushNotificationsProviderProps) {
  const [foregroundAlarm, setForegroundAlarm] = useState<AlarmPayload | null>(null);
  const [alarmBadgeCount, setAlarmBadgeCount] = useState(0);
  const pendingAlarmIdRef = useRef<string | null>(null);
  const registeredTokenRef = useRef<string | null>(null);
  const handledNotificationIdsRef = useRef(new Set<string>());

  const clearAlarmBadgeCount = useCallback(() => {
    setAlarmBadgeCount(0);
  }, []);

  const navigateToAlarmDetail = useCallback(
    (alarmId: string) => {
      if (!alarmId) {
        return;
      }

      if (!navigationReady || !navigationRef.isReady()) {
        pendingAlarmIdRef.current = alarmId;
        return;
      }

      pendingAlarmIdRef.current = null;
      navigationRef.navigate('AlarmDetail', { alarmId });
      setForegroundAlarm(null);
      clearAlarmBadgeCount();
    },
    [clearAlarmBadgeCount, navigationReady, navigationRef],
  );

  const handleIncomingNotification = useCallback((notification: Notifications.Notification) => {
    const alarm = parseAlarmPayload(notification.request.content.data);

    if (!alarm) {
      return;
    }

    if (alarm.severity === 'high') {
      setForegroundAlarm(alarm);
      setAlarmBadgeCount((count) => count + 1);
    }
  }, []);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const notificationId = response.notification.request.identifier;

      if (handledNotificationIdsRef.current.has(notificationId)) {
        return;
      }

      handledNotificationIdsRef.current.add(notificationId);

      const alarm = parseAlarmPayload(response.notification.request.content.data);

      if (alarm) {
        navigateToAlarmDetail(alarm.alarmId);
      }
    },
    [navigateToAlarmDetail],
  );

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(handleIncomingNotification);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    const pushTokenSubscription = Notifications.addPushTokenListener(async (token) => {
      if (token.data === registeredTokenRef.current) {
        return;
      }

      registeredTokenRef.current = token.data;
      await sendPushToken(token.data);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      pushTokenSubscription.remove();
    };
  }, [handleIncomingNotification, handleNotificationResponse]);

  useEffect(() => {
    if (!navigationReady || !pendingAlarmIdRef.current || !navigationRef.isReady()) {
      return;
    }

    const pendingAlarmId = pendingAlarmIdRef.current;
    pendingAlarmIdRef.current = null;
    navigationRef.navigate('AlarmDetail', { alarmId: pendingAlarmId });
    setForegroundAlarm(null);
    clearAlarmBadgeCount();
  }, [clearAlarmBadgeCount, navigationReady, navigationRef]);

  const registerDevicePushToken = useCallback(async (): Promise<RegistrationResult> => {
    if (!Device.isDevice) {
      return { status: 'unsupported-device', message: 'Push notifications are only available on physical devices.' };
    }

    const permissions = await Notifications.getPermissionsAsync();
    let granted = permissions.ios ? [IosAuthorizationStatus.AUTHORIZED, IosAuthorizationStatus.PROVISIONAL, IosAuthorizationStatus.EPHEMERAL].includes(permissions.ios.status) : true;

    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.ios ? [IosAuthorizationStatus.AUTHORIZED, IosAuthorizationStatus.PROVISIONAL, IosAuthorizationStatus.EPHEMERAL].includes(requested.ios.status) : true;
    }

    if (!granted) {
      return { status: 'permission-denied', message: 'Push notification permission was not granted.' };
    }

    const projectId = readProjectId();

    if (!projectId) {
      return { status: 'missing-project-id', message: 'Missing Expo project identifier for push token generation.' };
    }

    let pushToken: string;

    try {
      const pushTokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
      pushToken = pushTokenResult.data;
    } catch (error) {
      return {
        status: 'missing-project-id',
        message: error instanceof Error ? error.message : 'Failed to generate Expo push token.',
      };
    }

    if (registeredTokenRef.current !== pushToken) {
      try {
        await sendPushToken(pushToken);
      } catch {
        // Token registration is best-effort; a failed upload does not block the user.
      }

      registeredTokenRef.current = pushToken;
    }

    return { status: 'registered', token: pushToken };
  }, []);

  const value = useMemo<PushNotificationsContextValue>(
    () => ({
      alarmBadgeCount,
      clearAlarmBadgeCount,
      registerDevicePushToken,
    }),
    [alarmBadgeCount, clearAlarmBadgeCount, registerDevicePushToken],
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      <View style={styles.container}>
        {children}
        {foregroundAlarm ? (
          <View pointerEvents="box-none" style={styles.overlay}>
            <View style={styles.banner}>
              <View style={styles.bannerHeader}>
                <View style={styles.bannerIcon}>
                  <Text style={styles.bannerIconText}>!</Text>
                </View>
                <View style={styles.bannerTextGroup}>
                  <Text style={styles.bannerEyebrow}>High severity alarm</Text>
                  <Text style={styles.bannerTitle}>{foregroundAlarm.title}</Text>
                  <Text style={styles.bannerBody}>{foregroundAlarm.body}</Text>
                </View>
              </View>
              <View style={styles.bannerActions}>
                <Pressable
                  onPress={() => {
                    setForegroundAlarm(null);
                  }}
                  style={[styles.bannerButton, styles.bannerButtonSecondary]}
                >
                  <Text style={styles.bannerButtonSecondaryText}>Dismiss</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    navigateToAlarmDetail(foregroundAlarm.alarmId);
                  }}
                  style={styles.bannerButton}
                >
                  <Text style={styles.bannerButtonText}>Open alarm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationsProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  banner: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderLeftColor: colors.alert,
    borderLeftWidth: 4,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  bannerBody: {
    color: colors.gray700,
    fontSize: typography.caption,
    marginTop: 2,
  },
  bannerButton: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerButtonSecondary: {
    backgroundColor: colors.gray200,
  },
  bannerButtonSecondaryText: {
    color: colors.gray900,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  bannerButtonText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  bannerEyebrow: {
    color: colors.alert,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bannerHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bannerIcon: {
    alignItems: 'center',
    backgroundColor: colors.alertBg,
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  bannerIconText: {
    color: colors.alert,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  overlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 12,
    zIndex: 20,
  },
});