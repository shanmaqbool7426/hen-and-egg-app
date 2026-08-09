import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '@/constants/types';
import { formatDate } from '@/constants/helpers';

const NOTIFICATION_ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  order: 'receipt-outline',
  referral: 'people-outline',
  warning: 'warning-outline',
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllRead } = useHenFarm();

  const handlePress = (id: string) => {
    markNotificationRead(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20, backgroundColor: colors.primary },
        ]}
      >
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <Pressable onPress={markAllRead}>
            <Text style={[styles.markAllText, { color: colors.primaryForeground }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === 'web' ? 34 + 20 : insets.bottom + 20 },
          ]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePress(item.id)}
              style={({ pressed }) => [
                styles.notificationCard,
                { backgroundColor: item.read ? colors.card : colors.primary + '10', borderColor: colors.border },
                pressed && styles.notificationCardPressed,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.read ? colors.muted : colors.primary + '20' },
                ]}
              >
                <Ionicons
                  name={NOTIFICATION_ICONS[item.type as AppNotification['type']]} 
                  size={20}
                  color={item.read ? colors.mutedForeground : colors.primary}
                />
              </View>
              <View style={styles.content}>
                <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={3}>
                  {item.message}
                </Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  markAllText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationCardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});
