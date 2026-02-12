import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radii, shadows, typography } from '../theme';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), username.trim(), password, displayName.trim() || username.trim());
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Unable to create account. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#CE82FF', '#A855F7']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="rocket" size={64} color={colors.white} />
            <Text style={styles.title}>Join Language Quest</Text>
            <Text style={styles.subtitle}>Start your learning journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name (Optional)"
              placeholderTextColor={colors.textTertiary}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={handleRegister}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  form: {
    marginTop: spacing.xl,
    marginBottom: 40,
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    ...shadows.md,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
    ...shadows.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  linkText: {
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: 15,
  },
  linkTextBold: {
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
