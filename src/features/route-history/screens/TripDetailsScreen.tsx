import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Trip } from '../../../shared/types/models';
import { AppHeader } from '../../../shared/components/AppHeader';
import { colors } from '../../../shared/theme/theme';
import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';



interface TripDetailsScreenProps {
  route: {
    params: {
      trip: Trip;
    };
  };
  navigation: any;
}

const TripDetailsScreen = ({ route, navigation }: TripDetailsScreenProps) => {
  const { trip } = route.params;
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

  const toggleMapFullScreen = () => {
    setIsMapFullScreen((prev) => !prev);
  }

  // Auto-play when component mounts
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= trip.path.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackSpeed, trip.path.length]);

  // Reset playback when trip changes
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [trip]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (index: number) => {
    setPlaybackIndex(index);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  // Get current marker position
  const currentPoint = trip.path[playbackIndex] || trip.path[0];
  
  // Format date for display
  const startDate = new Date(trip.startTime);
  const endDate = new Date(trip.endTime);
  const formattedStartDate = startDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedEndDate = endDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
       
       <AppHeader onBackPress={navigation.goBack} rightAction={{ icon: 'create-outline' }} title="Trip Detail" />

      {/* Map View */}
        <View style={isMapFullScreen ? styles.mapFullscreenContainer : styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentPoint?.lat || 37.7749,
            longitude: currentPoint?.lng || -122.4194,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Route polyline */}
          <Polyline
            coordinates={trip.path.map(point => ({
              latitude: point.lat,
              longitude: point.lng,
            }))}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
          
          {/* Start marker */}
          {trip.path.length > 0 && (
            <Marker
              coordinate={{
                latitude: trip.path[0].lat,
                longitude: trip.path[0].lng,
              }}
              title="Start"
            />
          )}
          
          {/* End marker */}
          {trip.path.length > 0 && (
            <Marker
              coordinate={{
                latitude: trip.path[trip.path.length - 1].lat,
                longitude: trip.path[trip.path.length - 1].lng,
              }}
              title="End"
            />
          )}
          
          {/* Current position marker */}
          {currentPoint && (
            <Marker
              coordinate={{
                latitude: currentPoint.lat,
                longitude: currentPoint.lng,
              }}
              title="Current Position"
            />
          )}
        </MapView>
          <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={toggleMapFullScreen}
        >
          <Ionicons name={isMapFullScreen ? 'contract' : 'expand'} size={24} color="#fff" />
        </TouchableOpacity>
      </View> {/* End of map fullscreen container */}

       {/* Playback Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={handlePlayPause}
        >
          <View style={{ minWidth: 25 }}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
          </View>
          <Text style={styles.playButtonText}>
            {isPlaying ? ' PAUSE' : ' PLAY'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.scrubberContainer}>
         
          <View style={styles.scrubber}>
            {trip.path.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.scrubberDot,
                  index <= playbackIndex && styles.scrubberDotActive,
                ]}
                onPress={() => handleScrub(index)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.speedContainer}>
          <Text style={styles.speedLabel}>Speed:</Text>
          {[1, 2, 4].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(speed)}
            >
              <Text style={[
                styles.speedButtonText,
                playbackSpeed === speed && styles.speedButtonTextActive,
              ]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Panel */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Trip Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Start Time:</Text>
          <Text style={styles.statValue}>{formattedStartDate}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>End Time:</Text>
          <Text style={styles.statValue}>{formattedEndDate}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Duration:</Text>
          <Text style={styles.statValue}>{trip.durationMin} minutes</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Points:</Text>
          <Text style={styles.statValue}>{trip.path.length}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Average Speed:</Text>
          <Text style={styles.statValue}>{trip.avgSpeedKmh} km/h</Text>
        </View>
      </View>

     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.blue600,
    fontWeight: '500',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.4,
  },
  mapFullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  fullscreenButton: {
      position: 'absolute',
  right: 16,
  bottom: 16,
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: colors.blue600,
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  playButton: {
    backgroundColor: colors.blue600,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scrubberContainer: {
    marginBottom: 16,
  },
  scrubberLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  scrubber: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrubberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  scrubberDotActive: {
    backgroundColor: '#007AFF',
  },
  speedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'center',
  },
  speedButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  speedButtonActive: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  speedButtonTextActive: {
    color: '#fff',
  },
});

// Export as named export
export { TripDetailsScreen };