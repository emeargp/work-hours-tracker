import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useWorkHours } from '../context/WorkHoursContext';

export default function SettingsScreen() {
  const { settings, updateSettings, isLoading } = useWorkHours();
  
  const [bonusQuestionText, setBonusQuestionText] = useState('');
  const [bonusHours, setBonusHours] = useState('2');
  const [yesButtonText, setYesButtonText] = useState('');
  const [noButtonText, setNoButtonText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setBonusQuestionText(settings.bonus_question_text);
      setBonusHours(settings.bonus_hours.toString());
      setYesButtonText(settings.yes_button_text);
      setNoButtonText(settings.no_button_text);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        bonus_question_text: bonusQuestionText.trim(),
        bonus_hours: parseFloat(bonusHours) || 2,
        yes_button_text: yesButtonText.trim(),
        no_button_text: noButtonText.trim(),
      });
      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
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
          <Text style={styles.title}>🎛️ Bonus Question Settings</Text>
          
          {/* Question Text */}
          <View style={styles.section}>
            <Text style={styles.label}>Question Text</Text>
            <TextInput
              style={styles.textInput}
              value={bonusQuestionText}
              onChangeText={setBonusQuestionText}
              placeholder="e.g., Driving Required?"
              placeholderTextColor="#999"
            />
          </View>

          {/* Bonus Hours */}
          <View style={styles.section}>
            <Text style={styles.label}>Bonus Hours</Text>
            <TextInput
              style={styles.textInput}
              value={bonusHours}
              onChangeText={setBonusHours}
              placeholder="e.g., 2"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Enter a number (can be negative, e.g., -1, 0, 2.5)
            </Text>
          </View>

          {/* Yes Button Text */}
          <View style={styles.section}>
            <Text style={styles.label}>Yes Button Text</Text>
            <TextInput
              style={styles.textInput}
              value={yesButtonText}
              onChangeText={setYesButtonText}
              placeholder="e.g., Yes (+2h)"
              placeholderTextColor="#999"
            />
          </View>

          {/* No Button Text */}
          <View style={styles.section}>
            <Text style={styles.label}>No Button Text</Text>
            <TextInput
              style={styles.textInput}
              value={noButtonText}
              onChangeText={setNoButtonText}
              placeholder="e.g., No"
              placeholderTextColor="#999"
            />
          </View>

          {/* Time Format - Fixed to 12-hour format */}
          <View style={styles.section}>
            <Text style={styles.label}>⏰ Time Format</Text>
            <Text style={styles.helperText}>
              App uses 12-hour format (e.g., 2:30 PM, 9:00 AM)
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (isSaving || isLoading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving || isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : '💾 Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📊 App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0 (Mobile)</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage:</Text>
            <Text style={styles.infoValue}>Local Device Storage</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Features:</Text>
            <Text style={styles.infoValue}>
              Offline Support, Export, Unlimited Entries
            </Text>
          </View>
        </View>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
