import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useWorkHours } from '../context/WorkHoursContext';
import { formatTime } from '../utils/timeUtils';

export default function EntryScreen() {
  const { addEntry, settings, isLoading } = useWorkHours();
  
  const [date, setDate] = useState(new Date());
  const [jobClientName, setJobClientName] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [drivingRequired, setDrivingRequired] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Simplified to always use 12-hour format
  const calculateHours = () => {
    const start = startTime.getHours() * 60 + startTime.getMinutes();
    const end = endTime.getHours() * 60 + endTime.getMinutes();
    const diff = end >= start ? end - start : (24 * 60) + end - start;
    return Math.round((diff / 60) * 100) / 100;
  };

  const getTotalHours = () => {
    const hoursWorked = calculateHours();
    const bonus = drivingRequired ? (settings?.bonus_hours || 2) : 0;
    return hoursWorked + bonus;
  };

  const handleSave = async () => {
    if (!jobClientName.trim()) {
      Alert.alert('Error', 'Please enter a job/client name');
      return;
    }

    try {
      setIsSaving(true);
      await addEntry({
        date: formatDate(date),
        job_client_name: jobClientName.trim(),
        start_time: startTime.toTimeString().slice(0, 5),
        end_time: endTime.toTimeString().slice(0, 5),
        driving_required: drivingRequired,
      });

      // Reset form
      setJobClientName('');
      setDrivingRequired(false);
      
      Alert.alert('Success', 'Work hours entry saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
    }
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
    }
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >
        <View style={styles.form}>
          {/* Date Section */}
          <View style={styles.section}>
            <Text style={styles.label}>📅 Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Job/Client Name Section */}
          <View style={styles.section}>
            <Text style={styles.label}>💼 Job/Client Name</Text>
            <TextInput
              style={styles.textInput}
              value={jobClientName}
              onChangeText={setJobClientName}
              placeholder="Enter job or client name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Start Time Section */}
          <View style={styles.section}>
            <Text style={styles.label}>🕐 Start Time</Text>
            {Platform.OS === 'web' ? (
              <TouchableOpacity style={styles.timeButton} onPress={() => {
                // Focus the hidden time input to open the native time picker
                const timeInput = document.getElementById('start-time-input');
                if (timeInput) timeInput.click();
              }}>
                <input
                  id="start-time-input"
                  type="time"
                  value={startTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(startTime);
                    newTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                    setStartTime(newTime);
                  }}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: '1px',
                    height: '1px'
                  }}
                />
                <Text style={styles.timeButtonText}>
                  {formatTime(startTime, '12h')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(startTime, '12h')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* End Time Section */}
          <View style={styles.section}>
            <Text style={styles.label}>🕐 End Time</Text>
            {Platform.OS === 'web' ? (
              <TouchableOpacity style={styles.timeButton} onPress={() => {
                // Focus the hidden time input to open the native time picker
                const timeInput = document.getElementById('end-time-input');
                if (timeInput) timeInput.click();
              }}>
                <input
                  id="end-time-input"
                  type="time"
                  value={endTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newTime = new Date(endTime);
                    newTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                    setEndTime(newTime);
                  }}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: '1px',
                    height: '1px'
                  }}
                />
                <Text style={styles.timeButtonText}>
                  {formatTime(endTime, '12h')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(endTime, '12h')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Driving Required Section */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {settings?.bonus_question_text || '🎯 Driving Required?'}
            </Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {drivingRequired 
                  ? (settings?.yes_button_text || `Yes (+${settings?.bonus_hours || 2}h)`)
                  : (settings?.no_button_text || 'No')
                }
              </Text>
              <Switch
                value={drivingRequired}
                onValueChange={setDrivingRequired}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor={drivingRequired ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>

          {/* Hours Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hours Worked:</Text>
              <Text style={styles.summaryValue}>
                {calculateHours().toFixed(1)}h
              </Text>
            </View>
            {drivingRequired && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bonus Hours:</Text>
                <Text style={styles.summaryValue}>
                  +{(settings?.bonus_hours || 2).toFixed(1)}h
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Hours:</Text>
              <Text style={styles.totalValue}>
                {getTotalHours().toFixed(1)}h
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (isSaving || isLoading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : '💾 Save Work Hours'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Start Time Picker */}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={onStartTimeChange}
          />
        )}

        {/* End Time Picker */}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display="default"
            onChange={onEndTimeChange}
          />
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#333',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
