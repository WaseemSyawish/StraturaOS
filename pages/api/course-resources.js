import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prismaClient from '../../lib/prisma';

const isDev = process.env.NODE_ENV === 'development';

/**
 * API endpoint for managing course resources (links, files, notes)
 * GET: List all resources for a course
 * POST: Create new resource
 * PUT: Update existing resource
 * DELETE: Remove resource
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
    if (req.method === 'GET') {
      const { courseId } = req.query;
      
      if (!courseId) {
        return res.status(400).json({ success: false, error: 'Course ID required' });
      }

      // Verify course belongs to user
      const course = await prismaClient.course.findFirst({
        where: { id: courseId, user_id: userId }
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      // Fetch all resources for this course
      const resources = await prismaClient.courseResource.findMany({
        where: { course_id: courseId },
        orderBy: [
          { order: 'asc' },
          { created_at: 'desc' }
        ]
      });

      return res.status(200).json({ success: true, resources });
    }

    if (req.method === 'POST') {
      const { courseId, title, type, url, content, category, order } = req.body;

      if (!courseId || !title) {
        return res.status(400).json({ 
          success: false, 
          error: 'Course ID and title are required' 
        });
      }

      // Verify course belongs to user
      const course = await prismaClient.course.findFirst({
        where: { id: courseId, user_id: userId }
      });

      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      // Create resource
      const resource = await prismaClient.courseResource.create({
        data: {
          course_id: courseId,
          title,
          type: type || 'link',
          url,
          content,
          category: category || 'other',
          order: order !== undefined ? order : 0
        }
      });

      return res.status(201).json({ success: true, resource });
    }

    if (req.method === 'PUT') {
      const { id, title, type, url, content, category, order } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Resource ID required' });
      }

      // Verify resource belongs to user's course
      const resource = await prismaClient.courseResource.findFirst({
        where: { id },
        include: { course: true }
      });

      if (!resource || resource.course.user_id !== userId) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      // Update resource
      const updated = await prismaClient.courseResource.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(type && { type }),
          ...(url !== undefined && { url }),
          ...(content !== undefined && { content }),
          ...(category && { category }),
          ...(order !== undefined && { order }),
          updated_at: new Date()
        }
      });

      return res.status(200).json({ success: true, resource: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Resource ID required' });
      }

      // Verify resource belongs to user's course
      const resource = await prismaClient.courseResource.findFirst({
        where: { id },
        include: { course: true }
      });

      if (!resource || resource.course.user_id !== userId) {
        return res.status(404).json({ success: false, error: 'Resource not found' });
      }

      // Delete resource
      await prismaClient.courseResource.delete({
        where: { id }
      });

      return res.status(200).json({ success: true, message: 'Resource deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    if (isDev) console.error('[api/course-resources] Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
