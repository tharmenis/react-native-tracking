import React, { useState, useEffect, useRef } from 'react';
import { AppIcon } from '../../../shared/components/AppIcon';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Trip } from '../../../shared/types/models';
import { AppHeader } from '../../../shared/components/AppHeader';
import { VehicleMarker } from '../../../shared/components/VehicleMarker';
import { colors } from '../../../shared/theme/theme';
import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { getTripDurationMin } from '../utils/tripDuration';


interface TripDetailsScreenProps {
  route: {
    params: {
      trip: Trip;
    };
  };
  navigation: any;
}

const THUMB_DIAMETER = 16;

const TripDetailsScreen = ({ route, navigation }: TripDetailsScreenProps) => {
  const { trip } = route.params;
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [controlsHeight, setControlsHeight] = useState(0);

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

  // Maps a tap/drag position (as a ratio of the track width) to the nearest
  // path point. Clamped so out-of-track touches can't seek out of range.
  const seekToRatio = (ratio: number) => {
    if (trip.path.length < 2) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    handleScrub(Math.round(clamped * (trip.path.length - 1)));
  };

  // Refs keep the PanResponder callbacks from capturing stale values — the
  // responder is created once, but always reads the latest width/handler.
  const trackWidthRef = useRef(0);
  const seekToRatioRef = useRef(seekToRatio);
  seekToRatioRef.current = seekToRatio;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (trackWidthRef.current === 0) return;
        seekToRatioRef.current(evt.nativeEvent.locationX / trackWidthRef.current);
      },
      onPanResponderMove: (evt) => {
        if (trackWidthRef.current === 0) return;
        seekToRatioRef.current(evt.nativeEvent.locationX / trackWidthRef.current);
      },
    })
  ).current;

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    trackWidthRef.current = width;
  };

  const handleControlsLayout = (e: LayoutChangeEvent) => {
    setControlsHeight(e.nativeEvent.layout.height);
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
       
       <AppHeader onBackPress={navigation.goBack} rightAction={{ icon: 'edit' }} title="Trip Detail" />

     
        <View style={isMapFullScreen ? styles.mapFullscreenContainer : styles.mapContainer}>
         {/* Map view */}
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
            strokeColor={colors.gray200}
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
            <VehicleMarker
              coordinate={{ latitude: currentPoint.lat, longitude: currentPoint.lng }}
              title="Current Position"
            />
          )}
        </MapView>
          <TouchableOpacity
          style={[
            styles.fullscreenButton,
            isMapFullScreen && { bottom: controlsHeight + 16 },
          ]}
          onPress={toggleMapFullScreen}
        >
          <AppIcon name={isMapFullScreen ? 'fullscreen-exit' : 'fullscreen'} size={24} color="#fff" />
        </TouchableOpacity>
        {/* End of Map view */}
      </View> 

       
      <View
        style={isMapFullScreen ? styles.controlsContainerFullscreen : styles.controlsContainer}
        onLayout={handleControlsLayout}
      >
        {/* Playback Controls */}
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={handlePlayPause}
        >
          <View style={{ minWidth: 25 }}>
          <AppIcon name={isPlaying ? 'pause' : 'play-arrow'} size={20} color="#fff" />
          </View>
          <Text style={styles.playButtonText}>
            {isPlaying ? ' PAUSE' : ' PLAY'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.scrubberContainer}>
          <View
            style={styles.scrubberTrack}
            onLayout={handleTrackLayout}
            {...panResponder.panHandlers}
          >
            <View
              style={[
                styles.scrubberFill,
                {
                  width:
                    trip.path.length < 2
                      ? 0
                      : (playbackIndex / (trip.path.length - 1)) *
                        (trackWidth || 0),
                },
              ]}
            />
            {trip.path.length > 1 && (
              <View
                style={[
                  styles.scrubberThumb,
                  {
                    left:
                      (playbackIndex / (trip.path.length - 1)) *
                      ((trackWidth || 0) - THUMB_DIAMETER),
                  },
                ]}
              />
            )}
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

     
      <View style={styles.statsContainer}>
        {/* Stats Panel */}
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
          <Text style={styles.statValue}>{getTripDurationMin(trip)} minutes</Text>
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
    zIndex: 998,
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
  controlsContainerFullscreen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    zIndex: 999,
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
    paddingVertical: 8,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
  },
  scrubberFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: colors.blue600,
  },
  scrubberThumb: {
    position: 'absolute',
    width: THUMB_DIAMETER,
    height: THUMB_DIAMETER,
    borderRadius: THUMB_DIAMETER / 2,
    backgroundColor: colors.blue600,
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