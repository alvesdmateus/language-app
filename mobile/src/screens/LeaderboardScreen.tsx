import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { userService } from '../services/api';
import { DivisionBadge } from '../components/DivisionBadge';

const LeaderboardScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await userService.getLeaderboard();
      setUsers(response.data.users);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: any) => (
    <View style={styles.item}>
      <Text style={styles.rank}>#{item.rank || index + 1}</Text>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.displayName}</Text>
        <View style={styles.divisionRow}>
          {item.division && (
            <DivisionBadge
              division={item.division}
              divisionInfo={item.divisionInfo}
              size="small"
            />
          )}
          <Text style={styles.points}>{item.eloRating} ELO</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 50,
    color: '#007AFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  divisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  points: {
    fontSize: 14,
    color: '#666',
  },
  elo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
});

export default LeaderboardScreen;
