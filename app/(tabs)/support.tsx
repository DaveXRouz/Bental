import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';

const FAQ_ITEMS = [
  {
    question: 'How do I deposit funds?',
    answer:
      'You can deposit funds using bank transfer, wire transfer, cash courier, or crypto. Go to the More tab and select Deposit to get started.',
  },
  {
    question: 'What are the trading hours?',
    answer:
      'Regular market hours are 9:30 AM - 4:00 PM ET, Monday-Friday. Extended hours trading is available from 4:00 AM - 9:30 AM and 4:00 PM - 8:00 PM ET.',
  },
  {
    question: 'How do I enable 2FA?',
    answer:
      'Go to Settings → Security → Two-Factor Authentication. Follow the steps to link your authenticator app for enhanced account security.',
  },
  {
    question: 'What is the minimum deposit?',
    answer:
      'The minimum deposit varies by method: $100 for bank transfer, $10,000 for cash courier, and no minimum for crypto deposits.',
  },
  {
    question: 'How long do withdrawals take?',
    answer:
      'Bank transfers typically take 1-3 business days. Wire transfers are processed same-day. Crypto withdrawals are typically processed within 1 hour.',
  },
  {
    question: 'Are my funds insured?',
    answer:
      'Securities are protected by SIPC up to $500,000. Cash deposits are FDIC insured up to $250,000 per account.',
  },
];

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@example.com';
const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP || '+1234567890';
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL || '';

export default function SupportScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleFAQPress = (index: number) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleChatPress = () => {
    if (SUPPORT_URL) {
      setShowChat(true);
    } else {
      Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleWhatsAppPress = () => {
    const phone = SUPPORT_PHONE.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${phone}`);
  };

  if (showChat && SUPPORT_URL) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowChat(false)}
          >
            <ChevronDown size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>Live Chat</Text>
        </View>
        <WebView
          source={{ uri: SUPPORT_URL }}
          style={styles.webview}
          startInLoadingState
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(59,130,246,0.15)', 'rgba(16,185,129,0.15)', 'transparent']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
        <Text style={styles.headerSubtitle}>We're here to help</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MessageCircle size={24} color={colors.white} />
              <Text style={styles.actionText}>Chat with Support</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.smallActionButton}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <Mail size={20} color="#10B981" />
              <Text style={styles.smallActionText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallActionButton}
              onPress={handleWhatsAppPress}
              activeOpacity={0.7}
            >
              <Phone size={20} color="#10B981" />
              <Text style={styles.smallActionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {FAQ_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => handleFAQPress(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedIndex === index ? (
                  <ChevronUp size={20} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={colors.textMuted} />
                )}
              </View>

              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is available 24/7 to assist you with any questions or concerns.
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleChatPress}
            activeOpacity={0.7}
          >
            <ExternalLink size={18} color="#3B82F6" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
  },
  headerTitle: {
    fontSize: isTablet ? Typography.size.xxxl : 26,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: isTablet ? Typography.size.md : 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
    paddingBottom: 120,
  },
  quickActions: {
    marginBottom: Spacing.xl,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: isTablet ? Spacing.lg : Spacing.md,
    paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
  },
  actionText: {
    fontSize: isTablet ? Typography.size.md : 14,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  smallActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isTablet ? Spacing.xs : 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
    paddingVertical: isTablet ? Spacing.md : Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  smallActionText: {
    fontSize: isTablet ? Typography.size.sm : 12,
    fontWeight: Typography.weight.semibold,
    color: '#10B981',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: isTablet ? Typography.size.lg : 16,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: Spacing.md,
  },
  faqItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  faqAnswer: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  contactTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 10,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  contactButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: '#3B82F6',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  chatTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  webview: {
    flex: 1,
  },
});
