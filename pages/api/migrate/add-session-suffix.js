import prisma from '../../../lib/prisma';

const isDev = process.env.NODE_ENV === 'development';

async function resolveUserId(req) {
  try {
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret' });
    const tokenUserId = token && (token.userId || token.sub) ? (token.userId || token.sub) : null;
    if (tokenUserId) return tokenUserId;

    if (isDev && req && req.cookies) {
      if (req.cookies.userId) return req.cookies.userId;
      if (req.cookies.debug_userId) return req.cookies.debug_userId;
    }
    return null;
  } catch (err) {
    if (isDev) console.error('resolveUserId error', err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Find all events that have schedulePattern metadata (smart-schedule events)
    const events = await prisma.event.findMany({
      where: {
        user_id: userId,
        NOT: {
          meta: {
            equals: null
          }
        }
      },
      include: {
        courses: true
      }
    });

    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      try {
        const meta = typeof event.meta === 'string' ? JSON.parse(event.meta) : event.meta;
        
        if (!meta?.schedulePattern?.sessionType) {
          skipped++;
          continue;
        }

        const sessionType = meta.schedulePattern.sessionType;
        const courseName = event.courses?.name;
        
        if (!courseName) {
          skipped++;
          continue;
        }

        // Check if title already has the suffix
        if (sessionType.toLowerCase() !== 'lecture') {
          const expectedSuffix = ` - ${sessionType}`;
          
          // If title is just the course name (no suffix yet), add suffix
          if (event.title === courseName) {
            await prisma.event.update({
              where: { id: event.id },
              data: { title: `${courseName}${expectedSuffix}` }
            });
            updated++;
            if (isDev) console.log(`Updated: "${courseName}" -> "${courseName}${expectedSuffix}"`);
          } else if (!event.title.includes(expectedSuffix)) {
            // Title has some suffix but not the correct one, update it
            await prisma.event.update({
              where: { id: event.id },
              data: { title: `${courseName}${expectedSuffix}` }
            });
            updated++;
            if (isDev) console.log(`Updated: "${event.title}" -> "${courseName}${expectedSuffix}"`);
          } else {
            skipped++;
          }
        } else {
          // Lecture type - title should be just course name
          if (event.title !== courseName && event.title.startsWith(courseName)) {
            // Remove any suffix for lectures
            await prisma.event.update({
              where: { id: event.id },
              data: { title: courseName }
            });
            updated++;
            if (isDev) console.log(`Updated: "${event.title}" -> "${courseName}" (removed suffix)`);
          } else {
            skipped++;
          }
        }
      } catch (e) {
        if (isDev) console.warn(`Failed to process event ${event.id}:`, e);
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Migration complete: ${updated} events updated, ${skipped} skipped`,
      updated,
      skipped,
      total: events.length
    });

  } catch (error) {
    if (isDev) console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to migrate events',
      details: error.message
    });
  }
}
