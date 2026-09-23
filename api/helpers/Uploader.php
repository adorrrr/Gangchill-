<?php
/**
 * Media Uploader & File Validator
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Response.php';

class Uploader {
    public static function handleUpload(string $fileKey = 'file', ?string $uploadedBy = null): array {
        if (!isset($_FILES[$fileKey])) {
            Response::error('কোনো ফাইল নির্বাচন করা হয়নি।');
        }

        $file = $_FILES[$fileKey];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $msg = 'ফাইল আপলোড ব্যর্থ হয়েছে (কোড: ' . $file['error'] . ')';
            Response::error($msg);
        }

        if ($file['size'] > UPLOAD_MAX_BYTES) {
            Response::error('ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইটের মধ্যে হতে হবে।');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!in_array($mime, ALLOWED_MIMES)) {
            Response::error('শুধুমাত্র JPG, PNG বা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।');
        }

        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp'
        ];
        $ext = $extensions[$mime] ?? 'jpg';

        $uniqueName = 'media_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . $uniqueName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::serverError('ফাইল সংরক্ষণ করতে সমস্যা হয়েছে।');
        }

        $publicUrl = '/api/uploads/' . $uniqueName;

        try {
            $db = Database::getConnection();
            $id = 'MED-' . time() . '-' . rand(100, 999);
            $stmt = $db->prepare("
                INSERT INTO media_uploads (id, filename, original_name, file_path, file_url, mime_type, file_size, uploaded_by)
                VALUES (:id, :filename, :original_name, :file_path, :file_url, :mime_type, :file_size, :uploaded_by)
            ");
            $stmt->execute([
                ':id' => $id,
                ':filename' => $uniqueName,
                ':original_name' => $file['name'],
                ':file_path' => $targetPath,
                ':file_url' => $publicUrl,
                ':mime_type' => $mime,
                ':file_size' => $file['size'],
                ':uploaded_by' => $uploadedBy
            ]);
        } catch (Exception $e) {
            // Non-fatal
        }

        return [
            'url' => $publicUrl,
            'filename' => $uniqueName,
            'originalName' => $file['name'],
            'size' => $file['size'],
            'mime' => $mime
        ];
    }
}
