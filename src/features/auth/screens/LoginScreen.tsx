import { AppIcon } from '../../../shared/components/AppIcon';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../../app/navigation/types';
import { usePushNotifications } from '../../../shared/notifications/PushNotificationsProvider';
import useAuth from '../../../auth/useAuth';
import { DEFAULT_OIDC_SCOPES, REDIRECT_SCHEME } from '../../../auth/authConfig';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgSlug, setOrgSlug] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const auth = useAuth();
  const discovery = useAutoDiscovery(
    auth.realm ? `${auth.realm.keycloakBaseUrl}/realms/${auth.realm.realmName}` : ''
  );

  const redirectUri = makeRedirectUri({ native: `${REDIRECT_SCHEME}://redirect` });
 
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: auth.realm?.clientId ?? 'pcp-tracking-app',
      redirectUri,
      usePKCE: true,
      scopes: DEFAULT_OIDC_SCOPES,
    },
    discovery as any,
  );
  const { registerDevicePushToken } = usePushNotifications();

  useEffect(() => {
    if (!pendingPrompt || !request) return;

    let mounted = true;

    (async () => {
      try {
       
        const result = await promptAsync();
        

        if (!mounted) return;

        if (result.type === 'success' && result.params?.code) {
          await auth.exchangeCodeForTokens({
            code: result.params.code,
            codeVerifier: (request as any).codeVerifier,
            redirectUri,
          });

          try {
            await registerDevicePushToken();
          } catch {
            // non-blocking
          }

          navigation.replace('Main');
        }
      } catch (e) {
        console.log('[auth] promptAsync error', e);
      } finally {
       
        setIsSubmitting(false);
        setPendingPrompt(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pendingPrompt, request]);

  async function handleSignIn() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await auth.resolveRealm(orgSlug.trim());
      // wait for request to be created via discovery/useAuthRequest
      setPendingPrompt(true);
    } catch (e: any) {
      setIsSubmitting(false);
      if (e?.message === 'unknown_organization' || e?.message?.includes('unknown_organization')) {
        setErrorMessage("We couldn't find that organization — check the identifier and try again.");
      } else if (e?.message === 'rate_limited') {
        setErrorMessage('Too many attempts — please wait a moment and try again.');
      } else {
        setErrorMessage('Unable to resolve organization. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoTile}>
          <AppIcon color={colors.white} name="place" size={30} />
        </View>
        <Text style={styles.title}>FleetTrack</Text>
        <Text style={styles.subtitle}>Sign in to manage your fleet</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Organization</Text>
          <TextInput
            value={orgSlug}
            onChangeText={setOrgSlug}
            placeholder="Enter organization slug"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Pressable disabled={isSubmitting || !orgSlug} onPress={handleSignIn} style={[styles.button, (isSubmitting || !orgSlug) && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
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
  error: {
    color: colors.alert,
    marginTop: spacing.sm,
    fontSize: typography.caption,
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