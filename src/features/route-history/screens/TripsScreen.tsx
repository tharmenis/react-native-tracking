import { useEffect, useState } from 'react';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { fetchVehicles } from '../../fleet/api/vehicles';
import { getTripHistory } from '../services/tripHistory.service';
import { ApiError } from '../../../shared/api/request';
import { Vehicle, Trip } from '../../../shared/types/models';

import { VehicleSelector } from '../components/VehicleSelector';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { TripCard } from '../components/TripCard';
import { AppHeader } from '../../../shared/components/AppHeader';
import { colors, spacing } from '../../../shared/theme/theme';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';

type DateRangeMode = '6h' | '12h' | '1day' | 'custom';

// TripsScreen is registered directly as the Drawer's "Trips" screen, and
// TripDetail lives on the root Stack (sibling of Main) — matching the
// actual AppNavigator, not the nested-stack proposal from earlier.
type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Trips'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TripsScreen = ({ navigation }: Props) => {
  // Vehicle selection state
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [vehiclesNotice, setVehiclesNotice] = useState<string | null>(null);

  // Date range state
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('6h');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Trip results state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Clearing the input away from the selected vehicle's name deselects it,
  // so a stale vehicle can't stay "selected" underneath edited text.
  const handleSearchChange = (text: string) => {
    setVehicleSearch(text);
    if (selectedVehicle && text !== selectedVehicle.name) {
      setSelectedVehicle(null);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleDateRangeChange = (
    mode: DateRangeMode,
    customRange?: { start: Date; end: Date }
  ) => {
    setDateRangeMode(mode);

    if (mode === 'custom') {
      if (customRange) {
        setDateRange(customRange);
      }
      // Custom selected but not confirmed yet — leave dateRange as-is.
      // The trip fetch effect only runs once both selectedVehicle and
      // dateRange are set.
      return;
    }

    const now = new Date();
    let start: Date;

    switch (mode) {
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '1day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    }

    setDateRange({ start, end: now });
  };

  // Load vehicles from the real fleet API (falls back to mock/error internally).
  useEffect(() => {
    const controller = new AbortController();

    fetchVehicles({ signal: controller.signal }).then((result) => {
  
      setAllVehicles(result.vehicles);

      if (result.source === 'error') {
        setVehiclesNotice(result.message ?? 'Failed to load vehicles.');
      } else if (result.source === 'mock') {
        setVehiclesNotice(result.message ?? 'Showing sample vehicles.');
      } else {
        setVehiclesNotice(null);
      }
    });

    return () => controller.abort();
  }, []);

  // Fetch trip history from the real endpoint once both a vehicle and a
  // date range are selected. Cancels the in-flight request on range/vehicle
  // change so the latest selection always wins.
  useEffect(() => {
    if (!selectedVehicle || !dateRange) {
      setTrips([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setUnavailable(false);

    getTripHistory(selectedVehicle.imei, dateRangeMode, dateRange, controller.signal)
      .then((fetchedTrips) => {
        setTrips(fetchedTrips);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return; // superseded by a newer request

        if (err instanceof ApiError) {
          if (err.status === 401) {
            // request.ts already cleared auth; an app-level listener is
            // expected to redirect to Login. Nothing to show here.
            return;
          }
          if (err.status === 502 || err.status === 503) {
            setUnavailable(true);
            return;
          }
          // 400 (validation, e.g. range too wide) / 403
          setError(err.message);
          return;
        }

        setError('Something went wrong loading trips.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [selectedVehicle, dateRangeMode, dateRange]);

  const renderTripCard = ({ item }: { item: Trip }) => (
    <TripCard
      trip={item}
      onPress={() => navigation.navigate('TripDetail', { trip: item })}
    />
  );

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={navigation.openDrawer}
        rightAction={{ icon: 'swap-vertical-outline' }}
        title="Route History"
      />

      {vehiclesNotice ? <Text style={styles.noticeText}>{vehiclesNotice}</Text> : null}

      {/* Vehicle Selector Section */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <VehicleSelector
          vehicles={allVehicles}
          selectedVehicle={selectedVehicle}
          vehicleSearch={vehicleSearch}
          onVehicleSelect={handleVehicleSelect}
          onSearchChange={handleSearchChange}
        />
      </View>

      {/* Date Range Section */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <DateRangeSelector
          selectedMode={dateRangeMode}
          onModeChange={handleDateRangeChange}
          maxRangeDays={7}
        />
      </View>

      {/* Trip Results Section */}
      <View style={[styles.content, styles.resultsSection]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue600} />
            <Text>Loading trips...</Text>
          </View>
        ) : unavailable ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Trip history service is temporarily unavailable. Please try again shortly.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No routes found for this period.</Text>
          </View>
        ) : (
          <View style={styles.resultsInner}>
            <Text style={styles.sectionTitle}>Trip Results</Text>
            <FlatList
              data={trips}
              renderItem={renderTripCard}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsListContent}
              showsVerticalScrollIndicator={true}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultsSection: {
    flex: 1,
  },
  resultsInner: {
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
    paddingBottom: spacing.lg,
  },
  noticeText: {
    color: '#b8860b',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 4,
  },
});

export { TripsScreen };