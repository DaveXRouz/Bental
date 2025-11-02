import type { AdminUser, AdminDeposit } from '@/services/admin';
import type { Lead } from '@/services/crm/lead-management';

export interface ExportOptions {
  filename: string;
  includeTimestamp?: boolean;
}

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringValue = String(field);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const headers = columns.map(col => escapeCSVField(col.label)).join(',');

  const rows = data.map(row => {
    return columns
      .map(col => {
        const value = row[col.key];
        return escapeCSVField(value);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportUsersToCSV(
  users: AdminUser[],
  options: ExportOptions = { filename: 'users-export.csv' }
): void {
  const columns = [
    { key: 'email' as keyof AdminUser, label: 'Email' },
    { key: 'full_name' as keyof AdminUser, label: 'Full Name' },
    { key: 'kyc_status' as keyof AdminUser, label: 'KYC Status' },
    { key: 'risk_tier' as keyof AdminUser, label: 'Risk Tier' },
    { key: 'phone' as keyof AdminUser, label: 'Phone' },
    { key: 'country' as keyof AdminUser, label: 'Country' },
    { key: 'created_at' as keyof AdminUser, label: 'Joined Date' },
    { key: 'last_login' as keyof AdminUser, label: 'Last Login' },
  ];

  const processedUsers = users.map(user => ({
    ...user,
    created_at: user.created_at ? new Date(user.created_at).toLocaleString() : '',
    last_login: user.last_login ? new Date(user.last_login).toLocaleString() : '',
  }));

  const csvContent = convertToCSV(processedUsers, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}

export function exportDepositsToCSV(
  deposits: AdminDeposit[],
  options: ExportOptions = { filename: 'deposits-export.csv' }
): void {
  const columns = [
    { key: 'user_email' as keyof AdminDeposit, label: 'User Email' },
    { key: 'user_name' as keyof AdminDeposit, label: 'User Name' },
    { key: 'amount' as keyof AdminDeposit, label: 'Amount' },
    { key: 'currency' as keyof AdminDeposit, label: 'Currency' },
    { key: 'method' as keyof AdminDeposit, label: 'Method' },
    { key: 'status' as keyof AdminDeposit, label: 'Status' },
    { key: 'location' as keyof AdminDeposit, label: 'Location' },
    { key: 'scheduled_at' as keyof AdminDeposit, label: 'Scheduled Date' },
    { key: 'created_at' as keyof AdminDeposit, label: 'Created Date' },
  ];

  const processedDeposits = deposits.map(deposit => ({
    ...deposit,
    user_email: deposit.profiles?.email || '',
    user_name: deposit.profiles?.full_name || '',
    location: deposit.address_json
      ? `${deposit.address_json.city}, ${deposit.address_json.state}`
      : '',
    scheduled_at: deposit.scheduled_at
      ? new Date(deposit.scheduled_at).toLocaleString()
      : '',
    created_at: new Date(deposit.created_at).toLocaleString(),
  }));

  const csvContent = convertToCSV(processedDeposits, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}

export function exportLeadsToCSV(
  leads: Lead[],
  options: ExportOptions = { filename: 'leads-export.csv' }
): void {
  const columns = [
    { key: 'email' as keyof Lead, label: 'Email' },
    { key: 'full_name' as keyof Lead, label: 'Full Name' },
    { key: 'phone' as keyof Lead, label: 'Phone' },
    { key: 'lead_score' as keyof Lead, label: 'Lead Score' },
    { key: 'current_stage' as keyof Lead, label: 'Current Stage' },
    { key: 'lead_source' as keyof Lead, label: 'Lead Source' },
    { key: 'conversion_probability' as keyof Lead, label: 'Conversion Probability' },
    { key: 'utm_source' as keyof Lead, label: 'UTM Source' },
    { key: 'utm_medium' as keyof Lead, label: 'UTM Medium' },
    { key: 'utm_campaign' as keyof Lead, label: 'UTM Campaign' },
    { key: 'created_at' as keyof Lead, label: 'Created Date' },
  ];

  const processedLeads = leads.map(lead => ({
    ...lead,
    conversion_probability: lead.conversion_probability
      ? `${lead.conversion_probability.toFixed(1)}%`
      : '',
    created_at: new Date(lead.created_at).toLocaleString(),
  }));

  const csvContent = convertToCSV(processedLeads, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}

export function exportWithdrawalsToCSV(
  withdrawals: any[],
  options: ExportOptions = { filename: 'withdrawals-export.csv' }
): void {
  const columns = [
    { key: 'user_email' as const, label: 'User Email' },
    { key: 'user_name' as const, label: 'User Name' },
    { key: 'amount' as const, label: 'Amount' },
    { key: 'currency' as const, label: 'Currency' },
    { key: 'status' as const, label: 'Status' },
    { key: 'method_type' as const, label: 'Method' },
    { key: 'network_fee' as const, label: 'Network Fee' },
    { key: 'scheduled_release_at' as const, label: 'Scheduled Release' },
    { key: 'created_at' as const, label: 'Created Date' },
  ];

  const processedWithdrawals = withdrawals.map(withdrawal => ({
    ...withdrawal,
    user_email: withdrawal.profiles?.email || '',
    user_name: withdrawal.profiles?.full_name || '',
    method_type: withdrawal.payout_methods?.type || 'N/A',
    scheduled_release_at: withdrawal.scheduled_release_at
      ? new Date(withdrawal.scheduled_release_at).toLocaleString()
      : '',
    created_at: new Date(withdrawal.created_at).toLocaleString(),
  }));

  const csvContent = convertToCSV(processedWithdrawals, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}

export function exportNotificationsToCSV(
  notifications: any[],
  options: ExportOptions = { filename: 'notifications-export.csv' }
): void {
  const columns = [
    { key: 'title' as const, label: 'Title' },
    { key: 'message' as const, label: 'Message' },
    { key: 'audience_type' as const, label: 'Audience Type' },
    { key: 'status' as const, label: 'Status' },
    { key: 'recipient_count' as const, label: 'Recipient Count' },
    { key: 'created_at' as const, label: 'Created Date' },
  ];

  const processedNotifications = notifications.map(notification => ({
    ...notification,
    created_at: new Date(notification.created_at).toLocaleString(),
  }));

  const csvContent = convertToCSV(processedNotifications, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}

export function exportGenericToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  options: ExportOptions
): void {
  const csvContent = convertToCSV(data, columns);
  const filename = options.includeTimestamp
    ? `${options.filename.replace('.csv', '')}-${Date.now()}.csv`
    : options.filename;

  downloadCSV(csvContent, filename);
}
