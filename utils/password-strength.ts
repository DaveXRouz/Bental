export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string;
  color: string;
}

const commonPasswords = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football'
];

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      feedback: 'Enter a password',
      color: '#EF4444',
    };
  }

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;

  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= password.length * 0.7) score += 10;

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 30;
    feedback.push('Avoid common passwords');
  }

  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Add letters and symbols');
  }

  score = Math.max(0, Math.min(100, score));

  let strength: PasswordStrength;
  let color: string;
  let message: string;

  if (score < 40) {
    strength = 'weak';
    color = '#EF4444';
    message = 'Weak password';
  } else if (score < 60) {
    strength = 'medium';
    color = '#F59E0B';
    message = 'Medium strength';
  } else if (score < 80) {
    strength = 'strong';
    color = '#10B981';
    message = 'Strong password';
  } else {
    strength = 'very-strong';
    color = '#059669';
    message = 'Very strong password';
  }

  return {
    strength,
    score,
    feedback: feedback.length > 0 ? feedback.join('. ') : message,
    color,
  };
}

export function getPasswordRequirements(password: string): Array<{ met: boolean; text: string }> {
  return [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
    { met: /[^a-zA-Z0-9]/.test(password), text: 'One special character' },
  ];
}
