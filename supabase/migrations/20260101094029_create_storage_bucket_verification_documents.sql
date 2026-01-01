/*
  # Create Storage Bucket for Verification Documents
  
  1. New Storage Bucket
    - `verification-documents` - Bucket for KYC documents (CNI, registre commerce)
    
  2. Security
    - Enable RLS on bucket
    - Allow authenticated users to upload their own documents
    - Only admins can read all documents
    - Users can only read their own documents
*/

-- Create the storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
CREATE POLICY "Users can upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Admins can delete verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'finance')
    AND is_active = true
  )
);
