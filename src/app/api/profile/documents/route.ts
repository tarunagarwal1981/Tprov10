/**
 * Profile Documents API
 * GET, POST, DELETE /api/profile/documents
 * Handles document upload, viewing, and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, queryMany, transaction } from '@/lib/aws/database';
import { getUser } from '@/lib/aws/cognito';
import { generateUploadUrl, generateDownloadUrl, deleteDocument } from '@/lib/services/s3Service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get all documents for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await getUser(token);
    const userId = userInfo.username;

    const documents = await queryMany<{
      id: string;
      document_type: string;
      document_name: string;
      s3_key: string;
      file_size: number | null;
      mime_type: string | null;
      status: string;
      rejection_reason: string | null;
      reviewed_at: Date | null;
      uploaded_at: Date;
      created_at: Date;
    }>(
      `SELECT id, document_type, document_name, s3_key, file_size, mime_type, 
              status, rejection_reason, reviewed_at, uploaded_at, created_at
       FROM documents 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Generate presigned URLs for viewing documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const viewUrl = await generateDownloadUrl(doc.s3_key);
          return { ...doc, viewUrl };
        } catch (error) {
          console.error(`Failed to generate URL for document ${doc.id}:`, error);
          return { ...doc, viewUrl: null };
        }
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithUrls,
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', message: error.message },
      { status: 500 }
    );
  }
}

// Upload a new document (creates presigned URL)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await getUser(token);
    const userId = userInfo.username;

    const { documentType, fileName, fileSize, mimeType } = await request.json();

    if (!documentType || !fileName) {
      return NextResponse.json(
        { error: 'Document type and file name are required' },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = [
      'aadhar_card',
      'pan_card',
      'incorporation_certificate',
      'owner_pan_card',
      'business_license',
      'other',
    ];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    // Generate presigned upload URL
    const { uploadUrl, s3Key } = await generateUploadUrl(
      userId,
      documentType,
      fileName,
      mimeType || 'application/octet-stream'
    );

    // Create document record in database
    const document = await queryOne<{ id: string }>(
      `INSERT INTO documents 
       (user_id, document_type, document_name, s3_key, file_size, mime_type, status, uploaded_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
       RETURNING id`,
      [userId, documentType, fileName, s3Key, fileSize || null, mimeType || null]
    );

    // Update profile completion
    await query(
      `UPDATE users 
       SET profile_completion_percentage = calculate_profile_completion($1),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      document: {
        id: document?.id,
        documentType,
        fileName,
        s3Key,
        uploadUrl,
        expiresIn: 3600, // 1 hour
      },
      message: 'Upload URL generated successfully',
    });
  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: 'Failed to create document', message: error.message },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await getUser(token);
    const userId = userInfo.username;

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document to verify ownership and get S3 key
    const document = await queryOne<{ s3_key: string; user_id: string }>(
      `SELECT s3_key, user_id FROM documents WHERE id = $1`,
      [documentId]
    );

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete from S3
    try {
      await deleteDocument(document.s3_key);
    } catch (s3Error) {
      console.error('Failed to delete from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await query(`DELETE FROM documents WHERE id = $1`, [documentId]);

    // Update profile completion
    await query(
      `UPDATE users 
       SET profile_completion_percentage = calculate_profile_completion($1),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', message: error.message },
      { status: 500 }
    );
  }
}

