import { Platform } from 'react-native';

/**
 * Consistent soft-elevation shadow for cards, using the current theme's
 * shadow color. Pass the object from useColors().
 */
export function cardShadow(colors: { shadow: string }) {
  return Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
  });
}

/** Slightly stronger elevation for hero/primary cards (balance card, top banners). */
export function heroShadow(colors: { shadow: string }) {
  return Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
    },
  });
}
