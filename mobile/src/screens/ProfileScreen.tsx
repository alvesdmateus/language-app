import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DivisionBadge, DivisionCard } from '../components/DivisionBadge';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {user?.divisionInfo && (
        <DivisionCard
          division={user.division}
          divisionInfo={user.divisionInfo}
          eloRating={user.eloRating}
        />
      )}

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user?.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistics</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Division</Text>
          {user?.division && (
            <DivisionBadge division={user.division} divisionInfo={user.divisionInfo} size="small" />
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ELO Rating</Text>
          <Text style={styles.value}>{user?.eloRating}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Points</Text>
          <Text style={styles.value}>{user?.totalPoints}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Streak</Text>
          <Text style={styles.value}>{user?.currentStreak} days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Longest Streak</Text>
          <Text style={styles.value}>{user?.longestStreak} days</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
