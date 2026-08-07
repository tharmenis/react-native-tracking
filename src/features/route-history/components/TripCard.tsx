import React from 'react';
import { DrawerScreenProps } from '@react-navigation/drawer';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Trip } from '../../../shared/types/models';
import { DrawerParamList } from '../../../app/navigation/types';


type Props = DrawerScreenProps<DrawerParamList, 'TripDetail'>;



interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

export const TripCard = ({ trip, onPress }: TripCardProps) => {
  // Format date for display
  const startDate = new Date(trip.startTime);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{formattedDate}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Text style={styles.duration}>Duration: {trip.durationMin} min</Text>
          <Text style={styles.points}>Points: {trip.path.length}</Text>
        </View>
        
        <Text style={styles.avgSpeed}>Avg Speed: {trip.avgSpeedKmh} km/h</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#333',
  },
  points: {
    fontSize: 14,
    color: '#333',
  },
  avgSpeed: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});