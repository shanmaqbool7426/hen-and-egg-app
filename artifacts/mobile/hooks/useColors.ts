import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the current color scheme (light or dark),
 * switching automatically based on the device's appearance setting.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? colors.dark ?? colors.light : colors.light;
  return { ...palette, radius: colors.radius };
}
