import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, CheckCircle, XCircle, Clock, FileText, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { KeyboardButton } from '@/components/ui/KeyboardButton';
import { useToast } from '@/components/ui/ToastManager';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  rejection_reason?: string;
}

interface DocumentType {
  id: string;
  label: string;
  description: string;
  icon: any;
  required: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'passport',
    label: 'Passport',
    description: 'Photo page of your passport',
    icon: FileText,
    required: true,
  },
  {
    id: 'national_id',
    label: 'National ID',
    description: 'Front and back of your ID card',
    icon: FileText,
    required: false,
  },
  {
    id: 'drivers_license',
    label: "Driver's License",
    description: 'Front and back of your license',
    icon: FileText,
    required: false,
  },
  {
    id: 'proof_of_address',
    label: 'Proof of Address',
    description: 'Utility bill or bank statement (last 3 months)',
    icon: FileText,
    required: true,
  },
  {
    id: 'selfie',
    label: 'Selfie with ID',
    description: 'Photo of you holding your ID',
    icon: Camera,
    required: false,
  },
];

export default function DocumentUploadScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    documentType: string,
    uri: string,
    fileName: string,
    mimeType: string
  ) => {
    if (!user) return;

    try {
      setUploading(documentType);
      setUploadProgress(0);

      // Read file as blob (web) or file URI (native)
      let blob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        // For native, create FormData
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: fileName,
          type: mimeType,
        } as any);
        blob = formData.get('file') as Blob;
      }

      // Validate file size (max 10MB)
      if (blob.size > 10485760) {
        throw new Error('File size must be less than 10MB');
      }

      setUploadProgress(25);

      // Generate unique file path
      const fileExt = fileName.split('.').pop();
      const filePath = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;

      setUploadProgress(50);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      // Create database record
      const { error: dbError } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: documentType,
        file_path: uploadData.path,
        file_name: fileName,
        file_size: blob.size,
        mime_type: mimeType,
        status: 'pending',
      });

      if (dbError) throw dbError;

      setUploadProgress(90);

      // Update profile KYC status to pending if not already verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single();

      if (profile?.kyc_status !== 'verified') {
        await supabase
          .from('profiles')
          .update({ kyc_status: 'pending' })
          .eq('id', user.id);
      }

      setUploadProgress(100);

      toast.showSuccess('Document uploaded successfully');
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.showError(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const pickDocument = async (documentType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await uploadDocument(
          documentType,
          result.uri,
          result.name,
          result.mimeType || 'application/octet-stream'
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const pickImage = async (documentType: string, useCamera: boolean = false) => {
    try {
      // Request permissions
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission denied', 'Please grant camera/library access');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument(
          documentType,
          asset.uri,
          `${documentType}_${Date.now()}.jpg`,
          'image/jpeg'
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const deleteDocument = async (docId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('kyc_documents')
                .delete()
                .eq('id', docId);

              if (error) throw error;

              toast.showSuccess('Document deleted');
              loadDocuments();
            } catch (error) {
              console.error('Delete error:', error);
              toast.showError('Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find((d) => d.document_type === documentType);
    return doc?.status || null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color="#10B981" />;
      case 'rejected':
        return <XCircle size={20} color="#EF4444" />;
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Not Uploaded';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>KYC Verification</Text>
        <Text style={styles.subtitle}>
          Upload your documents to verify your identity
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Required Documents</Text>
        <Text style={styles.infoText}>
          • Passport or National ID{'\n'}
          • Proof of Address (utility bill or bank statement){'\n'}
          • Documents must be clear and valid
        </Text>
      </View>

      {DOCUMENT_TYPES.map((docType) => {
        const status = getDocumentStatus(docType.id);
        const doc = documents.find((d) => d.document_type === docType.id);
        const isUploading = uploading === docType.id;

        return (
          <View key={docType.id} style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <View style={styles.documentInfo}>
                <Text style={styles.documentLabel}>
                  {docType.label}
                  {docType.required && <Text style={styles.required}> *</Text>}
                </Text>
                <Text style={styles.documentDescription}>
                  {docType.description}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                {getStatusIcon(status)}
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {getStatusText(status)}
                </Text>
              </View>
            </View>

            {status === 'rejected' && doc?.rejection_reason && (
              <View style={styles.rejectionCard}>
                <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
                <Text style={styles.rejectionText}>{doc.rejection_reason}</Text>
              </View>
            )}

            {isUploading ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
              </View>
            ) : status !== 'approved' ? (
              <View style={styles.actions}>
                <KeyboardButton
                  title="Take Photo"
                  onPress={() => pickImage(docType.id, true)}
                  variant="secondary"
                  size="sm"
                  icon={<Camera size={18} color={colors.textInverse} />}
                  style={styles.actionButton}
                />
                <KeyboardButton
                  title="Choose File"
                  onPress={() => pickDocument(docType.id)}
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={18} color={colors.textInverse} />}
                  style={styles.actionButton}
                />
                {status && (
                  <TouchableOpacity
                    onPress={() => doc && deleteDocument(doc.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.approvedContainer}>
                <Text style={styles.approvedText}>✓ Document Verified</Text>
              </View>
            )}

            {doc && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{doc.file_name}</Text>
                <Text style={styles.fileDate}>
                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All documents are encrypted and stored securely. Your data is protected
          according to our privacy policy.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: Typography.size.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.family.bold,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.semibold,
    color: '#3B82F6',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  documentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  documentLabel: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.semibold,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  required: {
    color: '#EF4444',
  },
  documentDescription: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
    fontFamily: Typography.family.medium,
  },
  rejectionCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectionTitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semibold,
    color: '#EF4444',
    marginBottom: Spacing.xs,
  },
  rejectionText: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.sm,
  },
  approvedContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  approvedText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semibold,
    color: '#10B981',
  },
  fileInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: Spacing.sm,
  },
  fileName: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fileDate: {
    fontSize: Typography.size.xs,
    color: colors.textTertiary,
  },
  footer: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
