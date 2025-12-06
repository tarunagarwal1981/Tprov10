'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText as FileTextIcon, Upload, CheckCircle, X, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentsFormProps {
  onComplete: () => void;
}

type DocumentType =
  | 'aadhar_card'
  | 'pan_card'
  | 'incorporation_certificate'
  | 'owner_pan_card'
  | 'business_license'
  | 'other';

type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface Document {
  id: string;
  document_type: DocumentType;
  document_name: string;
  status: DocumentStatus;
  viewUrl?: string | null;
  uploaded_at: string;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; required: boolean }[] = [
  { value: 'aadhar_card', label: 'Aadhar Card', required: true },
  { value: 'pan_card', label: 'PAN Card', required: true },
  { value: 'incorporation_certificate', label: 'Incorporation Certificate', required: true },
  { value: 'owner_pan_card', label: 'Owner Pan Card', required: true },
  { value: 'business_license', label: 'Business License', required: false },
  { value: 'other', label: 'Other', required: false },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200',
};

  const STATUS_ICONS = {
    pending: Clock,
    approved: CheckCircle,
    rejected: X,
    expired: Clock,
  };

export function DocumentsForm({ onComplete }: DocumentsFormProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) return;

      const { accessToken } = JSON.parse(tokens);
      const response = await fetch('/api/profile/documents', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    setUploading(documentType);

    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) {
        toast.error('Please login again');
        return;
      }

      const { accessToken } = JSON.parse(tokens);

      // Get presigned URL
      const response = await fetch('/api/profile/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create document');
      }

      const { document } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(document.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      toast.success('Document uploaded successfully!');
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const tokens = localStorage.getItem('cognito_tokens');
      if (!tokens) {
        toast.error('Please login again');
        return;
      }

      const { accessToken } = JSON.parse(tokens);
      const response = await fetch(`/api/profile/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }

      toast.success('Document deleted successfully!');
      loadDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const getDocument = (type: DocumentType) => {
    return documents.find((doc) => doc.document_type === type);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const Icon = STATUS_ICONS[status];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents</h2>
        <p className="text-gray-600">Upload your KYC documents for verification</p>
      </div>

      <div className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = getDocument(docType.value);
          const isUploading = uploading === docType.value;

          return (
            <motion.div
              key={docType.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileTextIcon className="w-5 h-5 text-[#FF6B35]" />
                    <h3 className="font-semibold text-gray-900">{docType.label}</h3>
                    {docType.required && (
                      <span className="text-xs text-red-500">*Required</span>
                    )}
                  </div>
                  {existingDoc && (
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(existingDoc.status)}
                      {existingDoc.viewUrl && (
                        <a
                          href={existingDoc.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF6B35] hover:text-[#E05A2A] text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Document
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {existingDoc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(existingDoc.id)}
                    >
                      Delete
                    </Button>
                  )}
                  <label
                    htmlFor={`upload-${docType.value}`}
                    className={`cursor-pointer ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      id={`upload-${docType.value}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(docType.value, file);
                        }
                      }}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant={existingDoc ? 'outline' : 'default'}
                      size="sm"
                      loading={isUploading}
                      className={!existingDoc ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white' : ''}
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          'Uploading...'
                        ) : existingDoc ? (
                          'Replace'
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Check */}
      {documents.filter((d) => d.status === 'approved').length >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">All required documents uploaded!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

