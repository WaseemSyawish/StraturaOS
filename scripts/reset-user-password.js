const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetPassword(userId, newPassword) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password hash
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    console.log(`✅ Password reset for user: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   New temporary password: ${newPassword}`);
    console.log(`   Please change this password on first login.`);

    return user;
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage
const userId = process.argv[2];
const newPassword = process.argv[3] || 'TempPassword123!';

if (!userId) {
  console.error('Usage: node reset-user-password.js <userId> [newPassword]');
  console.error('Example: node reset-user-password.js 265c42f0-477b-4878-b1b6-f204d61de18c MyNewPassword123');
  process.exit(1);
}

resetPassword(userId, newPassword).catch(console.error);
