import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Twitter, Linkedin, Github } from 'lucide-react-native';
import { spacing, typography, radius } from '@/constants/theme';

export function GlassFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(800)}
      style={styles.container}
    >
      <View style={styles.socialIconsContainer}>
        <SocialIcon icon={<Twitter size={18} color="rgba(255, 255, 255, 0.7)" />} label="Twitter" />
        <SocialIcon icon={<Linkedin size={18} color="rgba(255, 255, 255, 0.7)" />} label="LinkedIn" />
        <SocialIcon icon={<Github size={18} color="rgba(255, 255, 255, 0.7)" />} label="GitHub" />
      </View>

      <View style={styles.divider}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.12)',
            'rgba(220, 220, 220, 0.1)',
            'rgba(200, 200, 200, 0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dividerGradient}
        />
      </View>

      <View style={styles.linksContainer}>
        <FooterLink text="Privacy" />
        <Text style={styles.separator}>•</Text>
        <FooterLink text="Terms" />
        <Text style={styles.separator}>•</Text>
        <FooterLink text="Contact" />
      </View>

      <View style={styles.copyrightContainer}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.25)',
            'rgba(220, 220, 220, 0.22)',
            'rgba(200, 200, 200, 0.2)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.copyrightGradient}
        >
          <Text style={styles.copyrightText}>
            © {currentYear} Trading Platform. All rights reserved.
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

function SocialIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <TouchableOpacity
      style={styles.socialIconButton}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <BlurView intensity={30} tint="dark" style={styles.socialIconBlur}>
        <LinearGradient
          colors={[
            'rgba(30, 30, 40, 0.7)',
            'rgba(20, 20, 30, 0.8)',
          ]}
          style={styles.socialIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.iconGlow}>
          <LinearGradient
            colors={[
              'rgba(220, 220, 225, 0.1)',
              'rgba(200, 200, 205, 0.08)',
              'transparent',
            ]}
            style={styles.iconGlowGradient}
          />
        </View>

        <View style={styles.socialIconContent}>{icon}</View>

        <View style={styles.socialIconBorder}>
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.25)',
              'rgba(220, 220, 220, 0.22)',
              'rgba(200, 200, 200, 0.18)',
            ]}
            style={styles.socialBorderGradient}
          />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

function FooterLink({ text }: { text: string }) {
  return (
    <TouchableOpacity
      accessibilityLabel={text}
      accessibilityRole="link"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.linkText}>{text}</Text>
      <View style={styles.linkUnderline}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.25)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.underlineGradient}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md + 2,
  },
  socialIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  socialIconBlur: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  socialIconGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: 'hidden',
  },
  iconGlowGradient: {
    flex: 1,
  },
  socialIconContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  socialBorderGradient: {
    flex: 1,
    borderRadius: 22,
  },
  divider: {
    width: '50%',
    height: 1,
    marginBottom: spacing.sm + 2,
    overflow: 'hidden',
  },
  dividerGradient: {
    flex: 1,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  linkText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.3,
  },
  linkUnderline: {
    height: 1,
    marginTop: 2,
    opacity: 0,
  },
  underlineGradient: {
    flex: 1,
  },
  separator: {
    fontSize: typography.size.sm,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '400',
  },
  copyrightContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  copyrightGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  copyrightText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 255, 255, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
