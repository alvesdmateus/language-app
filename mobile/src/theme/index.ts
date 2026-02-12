import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  // Primary palette (Duolingo-inspired vibrant)
  primary: '#58CC02',       // Duolingo green — primary actions, success
  primaryDark: '#46A302',   // Pressed state
  primaryLight: '#D7FFB8',  // Light green backgrounds

  secondary: '#1CB0F6',     // Bright blue — links, info, selected
  secondaryDark: '#1899D6', // Pressed state
  secondaryLight: '#DDF4FF', // Light blue backgrounds

  accent: '#FF9600',        // Orange — warnings, streaks, timer alerts
  accentDark: '#E08600',    // Pressed state
  accentLight: '#FFF3E0',   // Light orange backgrounds

  danger: '#FF4B4B',        // Red — errors, incorrect, ranked mode
  dangerDark: '#E03C3C',    // Pressed state
  dangerLight: '#FFE0E0',   // Light red backgrounds

  purple: '#CE82FF',        // Purple — accents, special elements, XP
  purpleDark: '#A855F7',    // Pressed state
  purpleLight: '#F3E8FF',   // Light purple backgrounds

  gold: '#FFC800',          // Gold — achievements, premium
  goldDark: '#E0B000',      // Pressed state
  goldLight: '#FFF8E1',     // Light gold backgrounds

  // Battle mode
  ranked: '#FF4B4B',        // Ranked mode color
  casual: '#1CB0F6',        // Casual mode color
  battle: '#FF9600',        // Battle mode color

  // Neutrals
  white: '#FFFFFF',
  background: '#F7F7F7',    // Main screen background
  surface: '#FFFFFF',        // Cards, modals
  surfaceSecondary: '#F0F0F0', // Secondary surfaces
  border: '#E5E5E5',        // Borders, dividers
  borderLight: '#F0F0F0',   // Light borders

  // Text
  textPrimary: '#3C3C3C',   // Main text
  textSecondary: '#777777',  // Secondary text
  textTertiary: '#AFAFAF',   // Placeholder, disabled
  textInverse: '#FFFFFF',    // Text on dark backgrounds

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
} as const;

// Division colors
export const divisionColors = {
  UNRANKED: '#AFAFAF',
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFC800',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#1CB0F6',
  MASTER: '#CE82FF',
  GRANDMASTER: '#FF4B88',
} as const;

// Gradient presets
export const gradients = {
  primary: ['#58CC02', '#46A302'] as const,
  secondary: ['#1CB0F6', '#1899D6'] as const,
  accent: ['#FF9600', '#FF7300'] as const,
  danger: ['#FF4B4B', '#E03C3C'] as const,
  purple: ['#CE82FF', '#A855F7'] as const,
  gold: ['#FFC800', '#FF9600'] as const,
  sunset: ['#FF9600', '#FF4B4B'] as const,
  ocean: ['#1CB0F6', '#CE82FF'] as const,
  ranked: ['#FF4B4B', '#FF7300'] as const,
  casual: ['#1CB0F6', '#58CC02'] as const,
  header: ['#58CC02', '#46A302'] as const,
  dark: ['#3C3C3C', '#1A1A1A'] as const,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textTertiary,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  stat: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.textPrimary,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 12,
    },
  }) as ViewStyle,

  // Colored shadow for primary buttons (Duolingo's "3D" button look)
  primaryButton: Platform.select({
    ios: {
      shadowColor: '#46A302',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,

  dangerButton: Platform.select({
    ios: {
      shadowColor: '#E03C3C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,

  secondaryButton: Platform.select({
    ios: {
      shadowColor: '#1899D6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,
} as const;

// ─── Common Styles ────────────────────────────────────────────────────────────

export const commonStyles = StyleSheet.create({
  // Screen containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  } as ViewStyle,

  cardSmall: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadows.sm,
  } as ViewStyle,

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryDark,
    ...shadows.primaryButton,
  } as ViewStyle,

  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.secondaryDark,
    ...shadows.secondaryButton,
  } as ViewStyle,

  buttonDanger: {
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.dangerDark,
    ...shadows.dangerButton,
  } as ViewStyle,

  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  } as ViewStyle,

  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Button text
  buttonPrimaryText: {
    ...typography.button,
    color: colors.textInverse,
  } as TextStyle,

  buttonSecondaryText: {
    ...typography.button,
    color: colors.textInverse,
  } as TextStyle,

  buttonOutlineText: {
    ...typography.button,
    color: colors.textSecondary,
  } as TextStyle,

  buttonGhostText: {
    ...typography.button,
    color: colors.textTertiary,
  } as TextStyle,

  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  } as TextStyle,

  inputFocused: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  } as ViewStyle,

  // Progress bar
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.full,
    overflow: 'hidden' as const,
  } as ViewStyle,

  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  } as ViewStyle,

  // Badges / Pills
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Row / layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});

// ─── Theme Export ─────────────────────────────────────────────────────────────

export const theme = {
  colors,
  divisionColors,
  gradients,
  typography,
  spacing,
  radii,
  shadows,
  commonStyles,
} as const;

export default theme;
