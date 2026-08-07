import { Ionicons } from '@expo/vector-icons';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getVehicles, getTrips } from '../mocks/routeHistoryMocks';
import { Vehicle, Trip } from '../../../shared/types/models';

// Import the components we'll create
import { VehicleSelector } from '../components/VehicleSelector';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { TripCard } from '../components/TripCard';
import { AppHeader } from '../../../shared/components/AppHeader';
import { colors, spacing } from '../../../shared/theme/theme';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';


type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Vehicles'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TripsScreen = ({ navigation }: Props) => {
  // State management
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dateRangeMode, setDateRangeMode] = useState<'6h' | '12h' | '1day' | 'custom'>('6h');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);

  // Load vehicles on component mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
        setAllVehicles(vehiclesData);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error('Error loading vehicles:', err);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: Vehicle) => {
 
    setSelectedVehicle(vehicle);
   
  };

  // Handle date range change
  const handleDateRangeChange = (mode: '6h' | '12h' | '1day' | 'custom', customRange?: { start: Date; end: Date }) => {
    setDateRangeMode(mode);
    
    if (mode === 'custom' && customRange) {
      setDateRange(customRange);
    } else if (mode !== 'custom') {
      // Calculate preset ranges
      const now = new Date();
      let start, end;
      
      switch (mode) {
        case '6h':
          start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          end = now;
          break;
        case '12h':
          start = new Date(now.getTime() - 12 * 60 * 60 * 1000);
          end = now;
          break;
        case '1day':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          end = now;
          break;
        default:
          start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          end = now;
      }
      
      setDateRange({ start, end });
    }
  };

  // Fetch trips when both vehicle and date range are selected
  useEffect(() => {
    const fetchTrips = async () => {
        console.log('Fetching trips for vehicle:', selectedVehicle, 'and date range:', dateRange);
      if (selectedVehicle && dateRange) {
        setLoading(true);
        setError(null);
        
        try {
          const fetchedTrips = await getTrips(
            selectedVehicle.id,
            dateRange.start,
            dateRange.end
          );
          setTrips(fetchedTrips);
        } catch (err) {
          setError('Failed to load trips');
          console.error('Error loading trips:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTrips();
  }, [selectedVehicle, dateRange]);

  // Render trip cards
  const renderTripCard = ({ item }: { item: Trip }) => (
    <TripCard 
      trip={item} 
      onPress={() => navigation.navigate('TripDetail', { trip: item })}
    />
  );

  return (
    <View style={styles.container}>
       <AppHeader onMenuPress={navigation.openDrawer} rightAction={{ icon: 'swap-vertical-outline' }} title="Route History" />
           {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {/* Vehicle Selector Section */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Vehicle</Text>
        <VehicleSelector
          vehicles={allVehicles} // This will be populated by the mock data
          selectedVehicle={selectedVehicle}
          vehicleSearch={vehicleSearch}
          onVehicleSelect={handleVehicleSelect}
          onSearchChange={setVehicleSearch}
        />
      </View>

      {/* Date Range Section */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <DateRangeSelector
          selectedMode={dateRangeMode}
          onModeChange={handleDateRangeChange}
        />
      </View>

      {/* Trip Results Section */}
      <View style={[styles.content, styles.resultsSection]}>
       
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue600} />
            <Text>Loading trips...</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
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
  resultsInner:{
    flex: 1,
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
      paddingBottom: spacing.lg,
  }
});

export { TripsScreen };