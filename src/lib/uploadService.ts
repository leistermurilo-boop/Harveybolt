import { supabase } from './supabase';
import {
  withRetry,
  handleSupabaseError,
  validateFile,
  generateUniqueFileName,
} from './supabaseUtils';

export interface UploadDocumentParams {
  file: File;
  caseId: string;
  type: 'edital' | 'recurso_concorrente' | 'outros';
}

export interface UploadDocumentResult {
  documentId: string;
  storagePath: string;
  publicUrl: string;
}

export interface UploadLogoParams {
  file: File;
  companyId: string;
}

export interface UploadLogoResult {
  publicUrl: string;
  storagePath: string;
}

export async function uploadDocument(
  params: UploadDocumentParams
): Promise<UploadDocumentResult> {
  const { file, caseId, type } = params;

  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const storagePath = generateUniqueFileName(file.name, caseId);

  try {
    const uploadResult = await withRetry(async () => {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        handleSupabaseError(error, 'Document upload');
      }

      return data;
    });

    if (!uploadResult) {
      throw new Error('Upload failed: No data returned');
    }

    let insertedDocumentId: string | null = null;

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('documents')
        .insert({
          case_id: caseId,
          filename: file.name,
          type,
          storage_path: storagePath,
          file_size: file.size,
        })
        .select('id')
        .single();

      if (insertError) {
        handleSupabaseError(insertError, 'Document database insert');
      }

      insertedDocumentId = insertData.id;
    } catch (dbError) {
      await supabase.storage.from('documents').remove([storagePath]);
      throw dbError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    return {
      documentId: insertedDocumentId!,
      storagePath,
      publicUrl,
    };
  } catch (error) {
    console.error('Upload document failed:', error);
    throw error;
  }
}

export async function uploadLogo(
  params: UploadLogoParams
): Promise<UploadLogoResult> {
  const { file, companyId } = params;

  const validation = validateFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileExt = file.name.split('.').pop();
  const storagePath = `logos/${companyId}.${fileExt}`;

  try {
    const uploadResult = await withRetry(async () => {
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        handleSupabaseError(error, 'Logo upload');
      }

      return data;
    });

    if (!uploadResult) {
      throw new Error('Upload failed: No data returned');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(storagePath);

    await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', companyId);

    return {
      publicUrl,
      storagePath,
    };
  } catch (error) {
    console.error('Upload logo failed:', error);
    throw error;
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .single();

  if (fetchError) {
    handleSupabaseError(fetchError, 'Fetch document for deletion');
  }

  if (!doc) {
    throw new Error('Document not found');
  }

  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path]);

  if (storageError) {
    console.error('Failed to delete from storage:', storageError);
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (deleteError) {
    handleSupabaseError(deleteError, 'Delete document from database');
  }
}
