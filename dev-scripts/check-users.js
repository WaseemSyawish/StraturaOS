const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: 'waseemsyawish72@gmail.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
      },
    });

    console.log('All users with email waseemsyawish72@gmail.com:');
    console.log(JSON.stringify(users, null, 2));
    console.log('\n---\n');

    // Check which user owns the Bakhtiar task
    const taskUser = await prisma.user.findUnique({
      where: { id: '265c42f0-477b-4878-b1b6-f204d61de18c' },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log('User who owns "Bakhtiar Quiz" task:');
    console.log(JSON.stringify(taskUser, null, 2));
    console.log('\n---\n');

    // Count tasks for each user
    for (const user of users) {
      const taskCount = await prisma.event.count({
        where: {
          user_id: user.id,
          completed: false,
        },
      });
      console.log(`User ${user.email} (${user.id}): ${taskCount} incomplete tasks`);
    }

    if (taskUser && taskUser.id !== users[0]?.id) {
      const taskCount = await prisma.event.count({
        where: {
          user_id: taskUser.id,
          completed: false,
        },
      });
      console.log(`User ${taskUser.email} (${taskUser.id}): ${taskCount} incomplete tasks`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
