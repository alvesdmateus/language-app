import { Language } from '../types';

export interface LanguageInfo {
  name: string;
  flag: string;
  color: string;
  nativeName: string;
}

export const LANGUAGE_INFO: Record<Language, LanguageInfo> = {
  PORTUGUESE: { name: 'Portuguese', flag: '🇧🇷', color: '#009739', nativeName: 'Português' },
  SPANISH:    { name: 'Spanish',    flag: '🇪🇸', color: '#C60B1E', nativeName: 'Español' },
  ENGLISH:    { name: 'English',    flag: '🇺🇸', color: '#3C3B6E', nativeName: 'English' },
  ITALIAN:    { name: 'Italian',    flag: '🇮🇹', color: '#009246', nativeName: 'Italiano' },
  FRENCH:     { name: 'French',     flag: '🇫🇷', color: '#0055A4', nativeName: 'Français' },
  GERMAN:     { name: 'German',     flag: '🇩🇪', color: '#000000', nativeName: 'Deutsch' },
  JAPANESE:   { name: 'Japanese',   flag: '🇯🇵', color: '#BC002D', nativeName: '日本語' },
  KOREAN:     { name: 'Korean',     flag: '🇰🇷', color: '#003478', nativeName: '한국어' },
};

/** All languages as an ordered array (useful for pickers/lists) */
export const LANGUAGES_LIST = Object.entries(LANGUAGE_INFO).map(
  ([key, info]) => ({ value: key as Language, ...info })
);
