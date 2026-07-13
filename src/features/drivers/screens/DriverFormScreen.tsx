import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RootStackParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { drivers, vehicles } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverForm'>;

export function DriverFormScreen({ navigation, route }: Props) {
  const driver = route.params.mode === 'edit'
    ? drivers.find((item) => item.id === route.params.driverId)
    : undefined;

  return (
    <View style={styles.container}>
      <AppHeader onBackPress={navigation.goBack} title={route.params.mode === 'edit' ? 'Edit Driver' : 'Add Driver'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, driver && styles.avatarFilled]}>
            <Text style={styles.avatarText}>{driver?.initials ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.photoLabel}>{driver ? driver.name : 'Photo'}</Text>
            <Text style={styles.photoAction}>{driver ? 'Change photo' : 'Upload photo'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>First name</Text>
            <TextInput editable={false} style={styles.input} value={driver?.name.split(' ')[0] ?? ''} placeholder="e.g. James" />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Last name</Text>
            <TextInput editable={false} style={styles.input} value={driver?.name.split(' ')[1] ?? ''} placeholder="e.g. Mwangi" />
          </View>
        </View>

        <Text style={styles.label}>Phone number</Text>
        <TextInput editable={false} style={styles.input} value={driver?.phone ?? ''} placeholder="+254 7XX XXX XXX" />

        <Text style={styles.label}>License number</Text>
        <TextInput editable={false} style={styles.input} value={driver?.licenseNumber ?? ''} placeholder="e.g. DL-2024-08123" />

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>License class</Text>
            <TextInput editable={false} style={styles.input} value={driver?.licenseClass ?? 'BCE'} />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Expiry date</Text>
            <TextInput editable={false} style={styles.input} value={driver?.expiryDate ?? ''} placeholder="DD/MM/YYYY" />
          </View>
        </View>

        <Text style={styles.label}>Assigned vehicle</Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={driver ? `${driver.vehicle}` : ''}
          placeholder={`${vehicles[0].name} — ${vehicles[0].plate}`}
        />

        <Text style={styles.label}>Route</Text>
        <TextInput editable={false} style={styles.input} value={driver?.route ?? ''} placeholder="e.g. Nairobi-Mombasa" />

        <View style={styles.submitButton}>
          <Text style={styles.submitText}>{route.params.mode === 'edit' ? 'Update Driver' : 'Save Driver'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarFilled: {
    backgroundColor: colors.blue800,
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.section,
    fontWeight: '700',
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  fieldHalf: {
    flex: 1,
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
  photoAction: {
    color: colors.blue600,
    fontSize: typography.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  photoLabel: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  submitText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
});