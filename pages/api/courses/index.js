import prisma from '../../../lib/prisma';
import { resolveUser } from '../../../lib/resolveUser';
import withPrisma from '../../../lib/withPrisma';
import { normalizeCourseColor } from '../../../lib/color-utils';
import { sanitizeString, isValidUUID } from '../../../lib/security/validation';

const isDev = process.env.NODE_ENV === 'development';

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      res.setHeader('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=30');
      
      const userId = await resolveUser(req);
      if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });
      
      const courses = await prisma.course.findMany({ 
        where: { user_id: userId }, 
        orderBy: { name: 'asc' } 
      });
      
      // Normalize colors using shared utility
      const normalized = courses.map(normalizeCourseColor);
      return res.status(200).json({ success: true, courses: normalized });
    } catch (err) {
      if (isDev) console.error('GET /api/courses error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, professor, instructor, color, credits, semester, code, description, office_hours, zoom_link, course_website } = req.body || {};
      const userId = await resolveUser(req);
      if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });
      
      // Validate and sanitize inputs
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, error: 'Course name is required' });
      }

      const created = await prisma.course.create({ data: {
        name: sanitizeString(name, { maxLength: 200 }),
        code: code ? sanitizeString(code, { maxLength: 50 }) : null,
        instructor: sanitizeString(instructor ?? professor ?? '', { maxLength: 200 }) || null,
        color: color ? sanitizeString(color, { maxLength: 50 }) : null,
        credits: Number.isFinite(Number(credits)) ? Number(credits) : 3,
        semester: semester ? sanitizeString(semester, { maxLength: 100 }) : null,
        description: description ? sanitizeString(description, { maxLength: 2000 }) : null,
        office_hours: office_hours ? sanitizeString(office_hours, { maxLength: 500 }) : null,
        zoom_link: zoom_link ? sanitizeString(zoom_link, { maxLength: 500 }) : null,
        course_website: course_website ? sanitizeString(course_website, { maxLength: 500 }) : null,
        user_id: userId
      }});
      
      return res.status(201).json({ success: true, course: normalizeCourseColor(created) });
    } catch (err) {
      if (isDev) console.error('POST /api/courses error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to create course' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, professor, color, credits, semester, instructor, description, office_hours, zoom_link, course_website } = req.body;
      
      // Validate ID
      if (!id || !isValidUUID(id)) {
        return res.status(400).json({ success: false, error: 'Valid course id is required' });
      }
      
      const userId = await resolveUser(req);
      if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

      // Ensure course belongs to user
      const existing = await prisma.course.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, error: 'Course not found' });
      if (existing.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to edit this course' });
      }
      
      const updated = await prisma.course.update({ where: { id }, data: {
        name: name ? sanitizeString(name, { maxLength: 200 }) : existing.name,
        instructor: (instructor ?? professor) ? sanitizeString(instructor ?? professor, { maxLength: 200 }) : existing.instructor,
        color: color ? sanitizeString(color, { maxLength: 50 }) : existing.color,
        credits: credits ?? existing.credits,
        semester: semester ? sanitizeString(semester, { maxLength: 100 }) : existing.semester,
        description: description !== undefined ? sanitizeString(description, { maxLength: 2000 }) : existing.description,
        office_hours: office_hours !== undefined ? sanitizeString(office_hours, { maxLength: 500 }) : existing.office_hours,
        zoom_link: zoom_link !== undefined ? sanitizeString(zoom_link, { maxLength: 500 }) : existing.zoom_link,
        course_website: course_website !== undefined ? sanitizeString(course_website, { maxLength: 500 }) : existing.course_website
      }});
      
      return res.status(200).json({ success: true, course: normalizeCourseColor(updated) });
    } catch (err) {
      if (isDev) console.error('PUT /api/courses error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to update course' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body || {};
      
      // Validate ID
      if (!id || !isValidUUID(id)) {
        return res.status(400).json({ success: false, error: 'Valid course id is required' });
      }
      
      const userId = await resolveUser(req);
      if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

      const existing = await prisma.course.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, error: 'Course not found' });
      if (existing.user_id !== userId) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this course' });
      }
      
      await prisma.course.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (err) {
      if (isDev) console.error('DELETE /api/courses error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete course' });
    }
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE,OPTIONS');
  res.status(405).end();
}

export default withPrisma(handler);
