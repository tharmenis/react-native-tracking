import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AppIcon } from '../../../shared/components/AppIcon';
import { Vehicle } from '../../../shared/types/models';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  vehicleSearch: string;
  onVehicleSelect: (vehicle: Vehicle) => void;
  onSearchChange: (search: string) => void;
}

export const VehicleSelector = ({
  vehicles,
  selectedVehicle,
  vehicleSearch,
  onVehicleSelect,
  onSearchChange,
}: VehicleSelectorProps) => {
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // True while the input is just displaying the already-selected vehicle's
  // name (i.e. user hasn't started editing it away). In that state we treat
  // the field like a closed select — filtering should show all options, not
  // just the one matching the current text.
  const isShowingSelectedValue =
    !!selectedVehicle && vehicleSearch === selectedVehicle.name;

  useEffect(() => {
    if (vehicleSearch.trim() === '' || isShowingSelectedValue) {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle =>
        vehicle.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(vehicleSearch.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [vehicleSearch, vehicles, isShowingSelectedValue]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onVehicleSelect(vehicle);
    onSearchChange(vehicle.name);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onSearchChange('');
    onVehicleSelect(null);
    setShowSuggestions(true);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    // Mimic a select field: tapping it always opens the full list of
    // options (filtering only kicks in once the user actually types).
    setShowSuggestions(true);
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => handleSelectVehicle(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.vehicleName}>{item.name}</Text>
      <Text style={styles.vehiclePlate}>{item.plate}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={[styles.input]}
          placeholder="Search vehicle..."
          value={vehicleSearch}
          onChangeText={onSearchChange}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {selectedVehicle && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
           <AppIcon name="cancel" size={20} color="#999" /> 
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {filteredVehicles.length > 0 ? (
            <FlatList
              data={filteredVehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={5}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No vehicles found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputSelected: {
    borderColor: '#34C759',
    paddingRight: 36, // room for the clear icon
  },
  clearButton: {
    position: 'absolute',
    right: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 100,
    elevation: 10,
    marginTop: 4,
  },
  vehicleItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
  },
  noResultsContainer: {
    padding: 12,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#999',
  },
});