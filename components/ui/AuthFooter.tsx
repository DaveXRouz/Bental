import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Twitter, Linkedin, Github, Facebook } from 'lucide-react-native';

export default function AuthFooter() {
  const currentYear = new Date().getFullYear();

  const openLink = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.socialLinks}>
        <TouchableOpacity
          onPress={() => openLink('https://twitter.com')}
          style={styles.socialButton}
          activeOpacity={0.7}
        >
          <Twitter size={18} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink('https://linkedin.com')}
          style={styles.socialButton}
          activeOpacity={0.7}
        >
          <Linkedin size={18} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink('https://github.com')}
          style={styles.socialButton}
          activeOpacity={0.7}
        >
          <Github size={18} color="#BDBDBD" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openLink('https://facebook.com')}
          style={styles.socialButton}
          activeOpacity={0.7}
        >
          <Facebook size={18} color="#BDBDBD" />
        </TouchableOpacity>
      </View>
      <Text style={styles.copyrightText}>
        © {currentYear} Financial Advisor. All rights reserved.
      </Text>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => openLink('https://example.com/privacy')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Privacy</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>•</Text>
        <TouchableOpacity onPress={() => openLink('https://example.com/terms')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Terms</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>•</Text>
        <TouchableOpacity onPress={() => openLink('https://example.com/contact')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
    position: 'relative',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  socialButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyrightText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontFamily: 'Inter-Regular',
  },
  separator: {
    fontSize: 11,
    color: '#616161',
  },
});
