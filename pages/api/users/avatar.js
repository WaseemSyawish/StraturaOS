import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const userId = await resolveUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse the multipart form
    const form = new IncomingForm({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.avatar?.[0] || files.avatar;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      // Clean up the uploaded file
      try { fs.unlinkSync(file.filepath); } catch (e) {}
      return res.status(400).json({ error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP.' });
    }

    // Generate unique filename
    const ext = path.extname(file.originalFilename || '.jpg');
    const filename = `${userId}-${Date.now()}${ext}`;
    const newPath = path.join(UPLOAD_DIR, filename);

    // Move file to final location
    fs.renameSync(file.filepath, newPath);

    // Update user's avatarUrl in settings
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      try { fs.unlinkSync(newPath); } catch (e) {}
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old avatar if exists
    const oldSettings = user.settings || {};
    if (oldSettings.avatarUrl) {
      const oldAvatarPath = path.join(process.cwd(), 'public', oldSettings.avatarUrl);
      try { fs.unlinkSync(oldAvatarPath); } catch (e) {}
    }

    // Update settings with new avatar URL
    const avatarUrl = `/avatars/${filename}`;
    const newSettings = { ...oldSettings, avatarUrl };

    await prisma.user.update({
      where: { id: userId },
      data: { settings: newSettings }
    });

    return res.status(200).json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
}
