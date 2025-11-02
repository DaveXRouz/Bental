import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Settings, CheckCircle2, MoreVertical } from 'lucide-react-native';

const THEME = {
  bg: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  accentBlue: '#1DA1F2',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  profit: '#10B981',
  loss: '#EF4444',
};

interface BotHeaderProps {
  logoUrl: string | null;
  name: string;
  strategy: string | null;
  status: string;
  onMenuPress: () => void;
}

export default function BotHeader({ logoUrl, name, strategy, status, onMenuPress }: BotHeaderProps) {
  const isActive = status === 'active';

  return (
    <BlurView intensity={22} tint="dark" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Settings size={24} color={THEME.textPrimary} />
              </View>
            )}
            <CheckCircle2 size={16} color={THEME.accentBlue} style={styles.verifiedBadge} />
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            {strategy && <Text style={styles.strategy}>{strategy}</Text>}
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusPaused]}>
            <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotPaused]} />
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextPaused]}>
              {isActive ? 'Active' : 'Paused'}
            </Text>
          </View>

          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.7}>
            <MoreVertical size={20} color={THEME.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  logoContainer: {
    position: 'relative',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.cardBg,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: THEME.bg,
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  strategy: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  statusPaused: {
    backgroundColor: 'rgba(189,189,189,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(189,189,189,0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: THEME.profit,
  },
  dotPaused: {
    backgroundColor: THEME.textSecondary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: THEME.profit,
  },
  statusTextPaused: {
    color: THEME.textSecondary,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
