import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkHours, WorkEntry } from '../context/WorkHoursContext';
import { formatTimeString } from '../utils/timeUtils';

export default function DashboardScreen() {
  const {
    entries,
    dashboardStats,
    settings,
    isLoading,
    refreshData,
    deleteEntry,
    exportData,
    clearAllData,
  } = useWorkHours();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setRefreshing(false);
  }, [refreshData]);

  const handleExport = async () => {
    try {
      const csvData = exportData();
      
      if (Platform.OS === 'web') {
        // For web, create a downloadable CSV file with timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-MM-SS
        const filename = `work_hours_${timestamp}.csv`;
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', `CSV file downloaded as ${filename}`);
      } else {
        // For mobile, we'll share the data with timestamp
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        
        await Share.share({
          message: csvData,
          title: `Work Hours Export - ${dateStr} ${timeStr}`,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearAll = async () => {
    console.log('HandleClearAll called');
    
    if (Platform.OS === 'web') {
      // For web, use confirm dialog
      const confirmed = window.confirm('Are you sure you want to delete all work entries? This action cannot be undone.');
      if (confirmed) {
        try {
          console.log('User confirmed clear all, calling clearAllData...');
          await clearAllData();
          console.log('Clear all completed successfully');
          window.alert('Success: All data cleared successfully');
        } catch (error) {
          console.error('Clear all failed:', error);
          window.alert('Error: Failed to clear data');
        }
      }
    } else {
      // For mobile, use Alert
      Alert.alert(
        'Clear All Data',
        'Are you sure you want to delete all work entries? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearAllData();
                Alert.alert('Success', 'All data cleared successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to clear data');
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteEntry = async (entry: WorkEntry) => {
    console.log('HandleDeleteEntry called for:', entry.job_client_name, entry.id);
    
    if (Platform.OS === 'web') {
      // For web, use confirm dialog
      const confirmed = window.confirm(`Delete work entry for ${entry.job_client_name} on ${entry.date}?`);
      if (confirmed) {
        try {
          console.log('User confirmed delete, calling deleteEntry...');
          await deleteEntry(entry.id);
          console.log('Delete completed successfully');
        } catch (error) {
          console.error('Delete failed:', error);
          window.alert('Error: Failed to delete entry');
        }
      }
    } else {
      // For mobile, use Alert
      Alert.alert(
        'Delete Entry',
        `Delete work entry for ${entry.job_client_name} on ${entry.date}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteEntry(entry.id);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete entry');
              }
            },
          },
        ]
      );
    }
  };

  const renderEntry = ({ item }: { item: WorkEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View>
          <Text style={styles.entryClient}>{item.job_client_name}</Text>
          <Text style={styles.entryDate}>{item.date}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEntry(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.entryDetails}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Time:</Text>
          <Text style={styles.timeValue}>
            {formatTimeString(item.start_time, '12h')} - {formatTimeString(item.end_time, '12h')}
          </Text>
        </View>
        
        <View style={styles.hoursContainer}>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Hours Worked:</Text>
            <Text style={styles.hoursValue}>{item.hours_worked.toFixed(1)}h</Text>
          </View>
          
          {item.driving_required && (
            <View style={styles.hoursRow}>
              <Text style={styles.bonusLabel}>Driving Bonus:</Text>
              <Text style={styles.bonusValue}>+{item.driving_bonus_hours.toFixed(1)}h</Text>
            </View>
          )}
          
          <View style={[styles.hoursRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{item.total_hours.toFixed(1)}h</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Local Storage - Always Offline */}

      {/* Stats Cards */}
      {dashboardStats && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{dashboardStats.total_entries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {dashboardStats.total_hours_worked.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {dashboardStats.total_hours_with_bonus.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>Total + Bonus</Text>
          </View>
          
          <View style={[styles.statCard, styles.todayCard]}>
            <Text style={styles.statNumber}>
              {dashboardStats.hours_today.toFixed(1)}h
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </ScrollView>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons name="share-outline" size={20} color="#007AFF" />
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Work Entries ({entries.length})
        </Text>
        
        {entries.length > 0 ? (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first work hours entry!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statsContent: {
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  todayCard: {
    backgroundColor: '#34C759',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exportButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  entryDetails: {
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Courier',
  },
  hoursContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  hoursLabel: {
    fontSize: 14,
    color: '#666',
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  bonusLabel: {
    fontSize: 14,
    color: '#34C759',
  },
  bonusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 4,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
