import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { colors } from '../../../shared/theme/theme';

type DateRangeMode = '6h' | '12h' | '1day' | 'custom';

interface DateRangeSelectorProps {
  selectedMode: DateRangeMode;
  onModeChange: (mode: DateRangeMode, customRange?: { start: Date; end: Date }) => void;
  maxRangeDays?: number; // defaults to 7 
}

const PRESETS: { mode: DateRangeMode; label: string }[] = [
  { mode: '6h', label: 'Last 6h' },
  { mode: '12h', label: 'Last 12h' },
  { mode: '1day', label: '1 Day' },
  { mode: 'custom', label: 'Custom' },
];

const formatDateTime = (date: Date) =>
  date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const DateRangeSelector = ({
  selectedMode,
  onModeChange,
  maxRangeDays = 7,
 }: DateRangeSelectorProps) => {
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [rangeExceededWarning, setRangeExceededWarning] = useState(false);

  const maxRangeMs = maxRangeDays * 24 * 60 * 60 * 1000;

  const handlePresetPress = (mode: DateRangeMode) => {
    if (mode === 'custom') {
      // Just switch into custom mode/UI; range isn't applied until both
      // start and end are picked (see handleConfirm below).
      onModeChange('custom');
      return;
    }
    onModeChange(mode);
  };

  const handleBackToPresets = () => {
    setCustomStart(null);
    setCustomEnd(null);
    onModeChange('6h');
  };

  const handleConfirm = (date: Date) => {
  if (activePicker === 'start') {
    setCustomStart(date);
    if (customEnd) {
      const withinRange = customEnd.getTime() - date.getTime() <= maxRangeMs;
      if (date > customEnd || !withinRange) {
        setCustomEnd(null);
        setRangeExceededWarning(!withinRange);
      } else {
        setRangeExceededWarning(false);
        onModeChange('custom', { start: date, end: customEnd });
      }
    }
  } else if (activePicker === 'end') {
    setCustomEnd(date);
    if (customStart) {
      setRangeExceededWarning(false);
      onModeChange('custom', { start: customStart, end: date });
    }
  }
  setActivePicker(null);
};

  if (selectedMode === 'custom') {
    return (
      <View style={styles.customContainer}>
        <View style={styles.customHeader}>
          <Text style={styles.customTitle}>Custom range</Text>
          <TouchableOpacity onPress={handleBackToPresets}>
            <Text style={styles.backToPresets}>Presets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldsRow}>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setActivePicker('start')}
          >
            <Text style={styles.dateFieldLabel}>From</Text>
            <Text style={styles.dateFieldValue}>
              {customStart ? formatDateTime(customStart) : 'Select start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setActivePicker('end')}
          >
            <Text style={styles.dateFieldLabel}>To</Text>
            <Text style={styles.dateFieldValue}>
              {customEnd ? formatDateTime(customEnd) : 'Select end'}
            </Text>
          </TouchableOpacity>
        </View>

        {rangeExceededWarning && (
  <Text style={styles.warningText}>
    Range can't exceed {maxRangeDays} day{maxRangeDays === 1 ? '' : 's'}. End date was cleared.
  </Text>
)}

        <DateTimePickerModal
          isVisible={activePicker !== null}
          mode="datetime"
          date={
            (activePicker === 'start' ? customStart : customEnd) ?? new Date()
          }
          minimumDate={activePicker === 'end' ? customStart ?? undefined : undefined}
          maximumDate={activePicker === 'start' ? customEnd ?? undefined : undefined}
          onConfirm={handleConfirm}
          onCancel={() => setActivePicker(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.pillsRow}>
      {PRESETS.map(({ mode, label }) => (
        <TouchableOpacity
          key={mode}
          style={[styles.pill, selectedMode === mode && styles.pillActive]}
          onPress={() => handlePresetPress(mode)}
        >
          <Text style={[styles.pillText, selectedMode === mode && styles.pillTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  pillActive: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
   
  },
  pillText: {
    fontSize: 14,
    color: '#333',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customContainer: {
    gap: 12,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  backToPresets: {
    fontSize: 14,
    color: colors.blue600,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateFieldLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateFieldValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  warningText: {
  fontSize: 12,
  color: '#FF3B30',
},
});