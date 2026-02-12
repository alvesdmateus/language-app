import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radii } from '../theme';

// App branding — change these to rebrand the login screen
const APP_TITLE = 'LINGUABATTLE';
const APP_SUBTITLE = 'MASTER THE ARENA';

// Background language symbols — scattered at low opacity for atmosphere
const SYMBOL_POSITIONS = [
  { char: 'あ', top: '8%',  left: '5%',  size: 48, rotation: '-15deg', opacity: 0.12 },
  { char: 'Ñ',  top: '15%', right: '10%', size: 32, rotation: '10deg',  opacity: 0.08 },
  { char: '한', top: '35%', left: '85%', size: 40, rotation: '20deg',  opacity: 0.10 },
  { char: 'Ç',  top: '55%', left: '8%',  size: 36, rotation: '-8deg',  opacity: 0.08 },
  { char: 'か', top: '70%', right: '5%', size: 44, rotation: '12deg',  opacity: 0.12 },
  { char: 'É',  top: '82%', left: '15%', size: 30, rotation: '-20deg', opacity: 0.06 },
  { char: '글', top: '25%', left: '70%', size: 38, rotation: '5deg',   opacity: 0.10 },
  { char: 'ß',  top: '45%', left: '2%',  size: 34, rotation: '15deg',  opacity: 0.08 },
  { char: 'さ', top: '90%', right: '20%', size: 42, rotation: '-10deg', opacity: 0.10 },
  { char: 'Ü',  top: '5%',  left: '45%', size: 28, rotation: '25deg',  opacity: 0.06 },
] as const;

// Dark battle theme colors (local to LoginScreen)
const darkTheme = {
  bgGradientStart: '#0D1B2A',
  bgGradientMid: '#0A1628',
  bgGradientEnd: '#050D18',

  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  inputBg: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',
  inputText: '#FFFFFF',
  inputPlaceholder: 'rgba(255, 255, 255, 0.35)',
  inputIcon: 'rgba(255, 255, 255, 0.4)',

  labelColor: '#1CB0F6',
  subtitleColor: '#1CB0F6',
  dimText: 'rgba(255, 255, 255, 0.45)',
  separatorLine: 'rgba(255, 255, 255, 0.12)',
  separatorText: 'rgba(255, 255, 255, 0.35)',

  shieldBg: 'rgba(255, 255, 255, 0.07)',
  shieldBorder: 'rgba(255, 255, 255, 0.12)',

  buttonGradientStart: '#1CB0F6',
  buttonGradientEnd: '#1899D6',

  demoBorder: 'rgba(28, 176, 246, 0.5)',
  demoText: '#1CB0F6',

  footerDim: 'rgba(255, 255, 255, 0.45)',
  footerBold: '#1CB0F6',
};

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await login('alice', 'password123');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.response?.data?.message || 'Demo account login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[darkTheme.bgGradientStart, darkTheme.bgGradientMid, darkTheme.bgGradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Background language symbols */}
      <View style={styles.symbolsContainer} pointerEvents="none">
        {SYMBOL_POSITIONS.map((symbol, index) => (
          <Text
            key={index}
            style={[
              styles.backgroundSymbol,
              {
                top: symbol.top,
                left: 'left' in symbol ? symbol.left : undefined,
                right: 'right' in symbol ? symbol.right : undefined,
                fontSize: symbol.size,
                opacity: symbol.opacity,
                transform: [{ rotate: symbol.rotation }],
              },
            ]}
          >
            {symbol.char}
          </Text>
        ))}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brandingSection}>
            <View style={styles.shieldLogo}>
              <MaterialCommunityIcons name="shield-sword" size={48} color={colors.secondary} />
            </View>
            <Text style={styles.appTitle}>{APP_TITLE}</Text>
            <Text style={styles.appSubtitle}>{APP_SUBTITLE}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Username */}
            <Text style={styles.inputLabel}>USERNAME / EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={darkTheme.inputIcon} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your warrior tag"
                placeholderTextColor={darkTheme.inputPlaceholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <View style={styles.passwordLabelRow}>
              <Text style={[styles.inputLabel, { marginBottom: 0 }]}>PASSWORD</Text>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={darkTheme.inputIcon} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={darkTheme.inputPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading
                  ? [colors.textSecondary, colors.textSecondary]
                  : [darkTheme.buttonGradientStart, darkTheme.buttonGradientEnd]}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>ENTER BATTLE</Text>
                    <Ionicons name="flash" size={20} color={colors.textInverse} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* OR Separator */}
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Demo Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.demoButtonText}>TRY DEMO ACCOUNT</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register' as never)}
              disabled={loading}
            >
              <Text style={styles.footerText}>
                Don't have an account?  <Text style={styles.footerBold}>Sign Up</Text>
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
  symbolsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundSymbol: {
    position: 'absolute',
    color: '#1CB0F6',
    fontWeight: '800',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    paddingBottom: 40,
  },

  // Branding
  brandingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldLogo: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    backgroundColor: darkTheme.shieldBg,
    borderWidth: 1.5,
    borderColor: darkTheme.shieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: darkTheme.subtitleColor,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Form Card
  formCard: {
    backgroundColor: darkTheme.cardBg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: darkTheme.cardBorder,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: darkTheme.labelColor,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.labelColor,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: darkTheme.inputBorder,
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: darkTheme.inputText,
    fontWeight: '500',
  },

  // Login Button
  loginButton: {
    borderRadius: radii.md,
    overflow: 'hidden',
    marginTop: spacing.xxl,
    ...Platform.select({
      ios: {
        shadowColor: darkTheme.buttonGradientStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 1.5,
    marginRight: spacing.sm,
  },

  // OR Separator
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: darkTheme.separatorLine,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: darkTheme.separatorText,
    marginHorizontal: spacing.lg,
    letterSpacing: 1,
  },

  // Demo Button
  demoButton: {
    borderWidth: 1.5,
    borderColor: darkTheme.demoBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: darkTheme.demoText,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 14,
    color: darkTheme.footerDim,
    textAlign: 'center',
  },
  footerBold: {
    fontWeight: '800',
    color: darkTheme.footerBold,
  },
});

export default LoginScreen;
