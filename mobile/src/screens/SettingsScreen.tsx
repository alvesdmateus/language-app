import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoMatch, setAutoMatch] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: any) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && <Text style={styles.arrow}>›</Text>)}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Account Section */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingRow
          icon="👤"
          title="Profile"
          subtitle={`@${user?.username}`}
          onPress={() => navigation.navigate('Profile' as never)}
        />
        <SettingRow
          icon="📧"
          title="Email"
          subtitle={user?.email}
          showArrow={false}
        />
      </View>

      {/* Preferences Section */}
      <SectionHeader title="Preferences" />
      <View style={styles.section}>
        <SettingRow
          icon="🔔"
          title="Push Notifications"
          subtitle="Get notified about matches and challenges"
          showArrow={false}
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#ccc', true: '#4A90E2' }}
            />
          }
        />
        <SettingRow
          icon="🔊"
          title="Sound Effects"
          subtitle="Play sounds during gameplay"
          showArrow={false}
          rightComponent={
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#ccc', true: '#4A90E2' }}
            />
          }
        />
        <SettingRow
          icon="⚡"
          title="Auto-match"
          subtitle="Automatically find matches"
          showArrow={false}
          rightComponent={
            <Switch
              value={autoMatch}
              onValueChange={setAutoMatch}
              trackColor={{ false: '#ccc', true: '#4A90E2' }}
            />
          }
        />
      </View>

      {/* Game Settings */}
      <SectionHeader title="Game" />
      <View style={styles.section}>
        <SettingRow
          icon="🌍"
          title="Language Stats"
          subtitle="View stats for all languages"
          onPress={() => navigation.navigate('LanguageStats' as never)}
        />
        <SettingRow
          icon="🏆"
          title="Achievements"
          subtitle="View your badges and milestones"
          onPress={() => navigation.navigate('Achievements' as never)}
        />
        <SettingRow
          icon="📊"
          title="Match History"
          subtitle="View past battles and scores"
          onPress={() => navigation.navigate('Profile' as never)}
        />
      </View>

      {/* Support Section */}
      <SectionHeader title="Support & Info" />
      <View style={styles.section}>
        <SettingRow
          icon="❓"
          title="Help & FAQ"
          subtitle="Get help and answers"
          onPress={() => Alert.alert('Help', 'Help documentation coming soon!')}
        />
        <SettingRow
          icon="📖"
          title="Tutorial"
          subtitle="Learn how to play"
          onPress={() => Alert.alert('Tutorial', 'Tutorial coming soon!')}
        />
        <SettingRow
          icon="⭐"
          title="Rate the App"
          subtitle="Share your feedback"
          onPress={() => Alert.alert('Thanks!', 'Rating feature coming soon!')}
        />
        <SettingRow
          icon="ℹ️"
          title="About"
          subtitle="Version 1.0.0"
          showArrow={false}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Language Quest</Text>
        <Text style={styles.footerSubtext}>Made with ❤️ for language learners</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 20,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#999',
  },
});

export default SettingsScreen;
