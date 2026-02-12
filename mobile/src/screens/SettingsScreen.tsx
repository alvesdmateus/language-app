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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

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
    iconName,
    iconLib = 'ion',
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    iconName: string;
    iconLib?: 'ion' | 'mci';
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          {iconLib === 'ion' ? (
            <Ionicons name={iconName as any} size={22} color={colors.secondary} />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={22} color={colors.secondary} />
          )}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ))}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.header} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      {/* Account Section */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <SettingRow
          iconName="person-outline"
          title="Profile"
          subtitle={`@${user?.username}`}
          onPress={() => navigation.navigate('Profile' as never)}
        />
        <SettingRow
          iconName="mail-outline"
          title="Email"
          subtitle={user?.email}
          showArrow={false}
        />
      </View>

      {/* Preferences Section */}
      <SectionHeader title="Preferences" />
      <View style={styles.section}>
        <SettingRow
          iconName="notifications-outline"
          title="Push Notifications"
          subtitle="Get notified about matches and challenges"
          showArrow={false}
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.white}
            />
          }
        />
        <SettingRow
          iconName="volume-high-outline"
          title="Sound Effects"
          subtitle="Play sounds during gameplay"
          showArrow={false}
          rightComponent={
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.white}
            />
          }
        />
        <SettingRow
          iconName="flash-outline"
          title="Auto-match"
          subtitle="Automatically find matches"
          showArrow={false}
          rightComponent={
            <Switch
              value={autoMatch}
              onValueChange={setAutoMatch}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.white}
            />
          }
        />
      </View>

      {/* Game Settings */}
      <SectionHeader title="Game" />
      <View style={styles.section}>
        <SettingRow
          iconName="earth"
          title="Language Stats"
          subtitle="View stats for all languages"
          onPress={() => navigation.navigate('LanguageStats' as never)}
        />
        <SettingRow
          iconName="trophy-outline"
          title="Achievements"
          subtitle="View your badges and milestones"
          onPress={() => navigation.navigate('Achievements' as never)}
        />
        <SettingRow
          iconName="bar-chart-outline"
          title="Match History"
          subtitle="View past battles and scores"
          onPress={() => navigation.navigate('Profile' as never)}
        />
      </View>

      {/* Support Section */}
      <SectionHeader title="Support & Info" />
      <View style={styles.section}>
        <SettingRow
          iconName="help-circle-outline"
          title="Help & FAQ"
          subtitle="Get help and answers"
          onPress={() => Alert.alert('Help', 'Help documentation coming soon!')}
        />
        <SettingRow
          iconName="school-outline"
          title="Tutorial"
          subtitle="Learn how to play"
          onPress={() => Alert.alert('Tutorial', 'Tutorial coming soon!')}
        />
        <SettingRow
          iconName="star-outline"
          title="Rate the App"
          subtitle="Share your feedback"
          onPress={() => Alert.alert('Thanks!', 'Rating feature coming soon!')}
        />
        <SettingRow
          iconName="information-circle-outline"
          title="About"
          subtitle="Version 1.0.0"
          showArrow={false}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Language Quest</Text>
        <Text style={styles.footerSubtext}>Made with love for language learners</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  backButtonTouch: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textInverse,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    marginBottom: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 32,
    marginRight: spacing.lg,
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.dangerButton,
  },
  logoutText: {
    ...typography.button,
    color: colors.textInverse,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  footerText: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});

export default SettingsScreen;
