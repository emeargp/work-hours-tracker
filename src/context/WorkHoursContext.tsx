import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkEntry {
  id: string;
  date: string;
  job_client_name: string;
  start_time: string;
  end_time: string;
  driving_required: boolean;
  driving_bonus_hours: number;
  hours_worked: number;
  total_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  bonus_question_text: string;
  bonus_hours: number;
  yes_button_text: string;
  no_button_text: string;
  time_format: string;
  updated_at: string;
}

export interface DashboardStats {
  total_entries: number;
  total_hours_worked: number;
  total_hours_with_bonus: number;
  entries_today: number;
  hours_today: number;
}

interface WorkHoursContextType {
  entries: WorkEntry[];
  settings: Settings | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  
  // Entry methods
  addEntry: (entry: Omit<WorkEntry, 'id' | 'created_at' | 'updated_at' | 'hours_worked' | 'total_hours' | 'driving_bonus_hours'>) => Promise<void>;
  updateEntry: (id: string, entry: Partial<WorkEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // Settings methods
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  
  // Data methods
  refreshData: () => Promise<void>;
  exportData: () => string;
  clearAllData: () => Promise<void>;
}

const WorkHoursContext = createContext<WorkHoursContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  ENTRIES: 'work_entries',
  SETTINGS: 'app_settings',
};

// Helper functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const totalMinutes = endMinutes - startMinutes;
  return Math.round((totalMinutes / 60) * 100) / 100;
};

const calculateDashboardStats = (entries: WorkEntry[]): DashboardStats => {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(entry => entry.date === today);
  
  return {
    total_entries: entries.length,
    total_hours_worked: entries.reduce((sum, entry) => sum + entry.hours_worked, 0),
    total_hours_with_bonus: entries.reduce((sum, entry) => sum + entry.total_hours, 0),
    entries_today: todayEntries.length,
    hours_today: todayEntries.reduce((sum, entry) => sum + entry.total_hours, 0),
  };
};

const getDefaultSettings = (): Settings => ({
  id: generateId(),
  bonus_question_text: "Driving Required?",
  bonus_hours: 2.0,
  yes_button_text: "Yes (+2h)",
  no_button_text: "No",
  time_format: "12h",
  updated_at: new Date().toISOString(),
});

export function WorkHoursProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from local storage
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load entries from AsyncStorage
      const cachedEntries = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      let entriesData: WorkEntry[] = [];
      
      if (cachedEntries) {
        entriesData = JSON.parse(cachedEntries);
        setEntries(entriesData);
      }

      // Load settings from AsyncStorage
      const cachedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      let settingsData: Settings;
      
      if (cachedSettings) {
        settingsData = JSON.parse(cachedSettings);
      } else {
        // Create default settings if none exist
        settingsData = getDefaultSettings();
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsData));
      }
      
      setSettings(settingsData);

      // Calculate dashboard stats
      const stats = calculateDashboardStats(entriesData);
      setDashboardStats(stats);

    } catch (error) {
      console.error('Failed to load data from storage:', error);
      // Set default values if loading fails
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
      setEntries([]);
      setDashboardStats(calculateDashboardStats([]));
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entryData: Omit<WorkEntry, 'id' | 'created_at' | 'updated_at' | 'hours_worked' | 'total_hours' | 'driving_bonus_hours'>) => {
    try {
      const currentSettings = settings || getDefaultSettings();
      
      // Calculate hours and bonuses
      const hoursWorked = calculateHours(entryData.start_time, entryData.end_time);
      const bonusHours = entryData.driving_required ? currentSettings.bonus_hours : 0;
      const totalHours = hoursWorked + bonusHours;
      
      // Create new entry
      const newEntry: WorkEntry = {
        ...entryData,
        id: generateId(),
        hours_worked: hoursWorked,
        driving_bonus_hours: bonusHours,
        total_hours: totalHours,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update state
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));
      
      // Update dashboard stats
      setDashboardStats(calculateDashboardStats(updatedEntries));
      
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, entryData: Partial<WorkEntry>) => {
    try {
      const currentSettings = settings || getDefaultSettings();
      
      setEntries(prev => {
        const updatedEntries = prev.map(entry => {
          if (entry.id === id) {
            const updated = { ...entry, ...entryData, updated_at: new Date().toISOString() };
            
            // Recalculate hours if time fields changed
            const startTime = entryData.start_time || entry.start_time;
            const endTime = entryData.end_time || entry.end_time;
            const drivingRequired = entryData.driving_required !== undefined ? entryData.driving_required : entry.driving_required;
            
            const hoursWorked = calculateHours(startTime, endTime);
            const bonusHours = drivingRequired ? currentSettings.bonus_hours : 0;
            const totalHours = hoursWorked + bonusHours;
            
            updated.hours_worked = hoursWorked;
            updated.driving_bonus_hours = bonusHours;
            updated.total_hours = totalHours;
            
            return updated;
          }
          return entry;
        });
        
        // Save to storage
        AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));
        
        // Update dashboard stats
        setDashboardStats(calculateDashboardStats(updatedEntries));
        
        return updatedEntries;
      });
      
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      console.log(`Deleting entry with id: ${id}`);
      
      setEntries(prev => {
        console.log(`Entries before delete: ${prev.length}`);
        const updatedEntries = prev.filter(entry => entry.id !== id);
        console.log(`Entries after delete: ${updatedEntries.length}`);
        
        // Save to storage
        AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));
        
        // Update dashboard stats
        setDashboardStats(calculateDashboardStats(updatedEntries));
        
        return updatedEntries;
      });
      
      console.log('Entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  };

  const updateSettings = async (settingsData: Partial<Settings>) => {
    try {
      const currentSettings = settings || getDefaultSettings();
      const updatedSettings = {
        ...currentSettings,
        ...settingsData,
        updated_at: new Date().toISOString(),
      };

      setSettings(updatedSettings);
      
      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
      
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const exportData = (): string => {
    try {
      // Generate CSV data locally
      let csvContent = 'Date,Job/Client,Start Time,End Time,Driving Required,Hours Worked,Bonus Hours,Total Hours\n';
      
      entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(entry => {
          const row = [
            entry.date,
            `"${entry.job_client_name.replace(/"/g, '""')}"`, // Escape quotes in CSV
            entry.start_time,
            entry.end_time,
            entry.driving_required ? 'Yes' : 'No',
            entry.hours_worked.toFixed(2),
            entry.driving_bonus_hours.toFixed(2),
            entry.total_hours.toFixed(2)
          ].join(',');
          csvContent += row + '\n';
        });
      
      console.log('CSV data generated successfully');
      return csvContent;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      console.log('Clearing all work entries');
      console.log(`Entries before clear: ${entries.length}`);
      
      setEntries([]);
      console.log('Entries cleared from state');
      
      // Clear from storage
      await AsyncStorage.removeItem(STORAGE_KEYS.ENTRIES);
      console.log('Entries cleared from storage');
      
      // Update dashboard stats
      setDashboardStats(calculateDashboardStats([]));
      console.log('Dashboard stats updated after clear');
      
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contextValue: WorkHoursContextType = {
    entries,
    settings,
    dashboardStats,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    refreshData,
    exportData,
    clearAllData,
  };

  return (
    <WorkHoursContext.Provider value={contextValue}>
      {children}
    </WorkHoursContext.Provider>
  );
}

export function useWorkHours() {
  const context = useContext(WorkHoursContext);
  if (context === undefined) {
    throw new Error('useWorkHours must be used within a WorkHoursProvider');
  }
  return context;
}
