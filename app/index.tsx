import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WorkHoursApp from '../src/WorkHoursApp';

export default function Index() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <WorkHoursApp />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
