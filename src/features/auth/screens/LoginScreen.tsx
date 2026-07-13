import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../../app/navigation/types';
import { usePushNotifications } from '../../../shared/notifications/PushNotificationsProvider';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerDevicePushToken } = usePushNotifications();

  async function handleSignIn() {
    setIsSubmitting(true);

    try {
      await registerDevicePushToken();
    } catch {
      // Push registration is non-blocking; proceed to main regardless.
    } finally {
      setIsSubmitting(false);
    }

    navigation.replace('Main');
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoTile}>
          <Ionicons color={colors.white} name="location-outline" size={30} />
        </View>
        <Text style={styles.title}>FleetTrack</Text>
        <Text style={styles.subtitle}>Sign in to manage your fleet</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput editable={false} style={styles.input} value="Use secure browser sign-in" />

          <Text style={styles.label}>Password</Text>
          <TextInput editable={false} secureTextEntry style={styles.input} value="Managed by Keycloak" />

          <Text style={styles.forgot}>Forgot password?</Text>

          <Pressable disabled={isSubmitting} onPress={handleSignIn} style={[styles.button, isSubmitting && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Preparing device...' : 'Sign In'}</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Don't have an account? Contact admin</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  footer: {
    color: colors.gray500,
    fontSize: typography.body,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
  forgot: {
    color: colors.blue600,
    fontSize: typography.caption,
    marginTop: -spacing.sm,
    textAlign: 'right',
  },
  form: {
    marginTop: spacing.xxxl,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.gray900,
    fontSize: typography.body,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  label: {
    color: colors.gray700,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  logoTile: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.blue600,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 64,
  },
  safeArea: {
    backgroundColor: colors.white,
    flex: 1,
  },
  subtitle: {
    color: colors.gray500,
    fontSize: typography.body,
    textAlign: 'center',
  },
  title: {
    color: colors.blue900,
    fontSize: typography.title,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});