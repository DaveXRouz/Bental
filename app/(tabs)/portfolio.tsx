import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QuantumFieldBackground } from '@/components/backgrounds';
import { BlurView } from 'expo-blur';
import { Briefcase, Star } from 'lucide-react-native';
import { colors, Spacing, Typography, zIndex } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

import HoldingsView from '@/components/portfolio/HoldingsView';
import EnhancedWatchlistView from '@/components/portfolio/EnhancedWatchlistView';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

type SegmentType = 'holdings' | 'watchlist';

export default function PortfolioScreen() {
  const { user } = useAuth();
  const [activeSegment, setActiveSegment] = useState<SegmentType>('holdings');


  return (
    <View style={styles.container}>
      <QuantumFieldBackground />

      <View style={styles.header} accessible={true} accessibilityLabel="Portfolio page header">
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Briefcase size={28} color="#10B981" />
          </View>
          <View>
            <Text style={styles.greeting}>My Assets</Text>
            <Text style={styles.headerTitle}>Portfolio</Text>
          </View>
        </View>
      </View>

      <View style={styles.segmentContainer} accessible={true} accessibilityLabel="Portfolio sections">
        <BlurView intensity={15} tint="dark" style={styles.segmentControl}>
          <TouchableOpacity
            style={[styles.segment, activeSegment === 'holdings' && styles.segmentActive]}
            onPress={() => setActiveSegment('holdings')}
            activeOpacity={0.7}
          >
            <Briefcase size={18} color={activeSegment === 'holdings' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.segmentText, activeSegment === 'holdings' && styles.segmentTextActive]}>
              Holdings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segment, activeSegment === 'watchlist' && styles.segmentActive]}
            onPress={() => setActiveSegment('watchlist')}
            activeOpacity={0.7}
          >
            <Star size={18} color={activeSegment === 'watchlist' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.segmentText, activeSegment === 'watchlist' && styles.segmentTextActive]}>
              Watchlist
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>

      <View style={styles.content} accessible={true} accessibilityLabel="Portfolio main content">
        {activeSegment === 'holdings' ? <HoldingsView /> : <EnhancedWatchlistView />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  shape3D: {
    position: 'absolute',
    width: Math.min(250, width * 0.65),
    height: Math.min(250, width * 0.65),
    borderRadius: 40,
    top: -60,
    right: isTablet ? -80 : -100,
    zIndex: zIndex.background,
  },
  shapeGradient: {
    flex: 1,
    borderRadius: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
    zIndex: zIndex.content,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: isTablet ? 56 : 48,
    height: isTablet ? 56 : 48,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: isTablet ? Typography.size.sm : 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: isTablet ? Typography.size.xxl : 22,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  segmentContainer: {
    paddingHorizontal: isTablet ? 24 : 16,
    marginBottom: 16,
    zIndex: zIndex.content,
  },
  segmentControl: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 12 : 10,
    paddingHorizontal: isTablet ? 16 : 12,
    borderRadius: 12,
  },
  segmentActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  segmentText: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: Typography.weight.semibold,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    zIndex: 5,
  },
});
