const fs = require('fs');
const path = require('path');

async function copyRecursive(src, dest) {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(src, dest);
  }
}

async function run() {
  try {
    const root = path.resolve(__dirname, '..');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(root, 'backups', `offline-backup-${ts}`);
    await fs.promises.mkdir(outDir, { recursive: true });

    const items = [
      'prisma/schema.prisma',
      'prisma/migrations',
      'data',
      '.env'
    ];

    for (const rel of items) {
      const src = path.join(root, rel);
      if (fs.existsSync(src)) {
        const dest = path.join(outDir, rel);
        await copyRecursive(src, dest);
        console.log('Copied', rel);
      } else {
        console.log('Not found (skipped):', rel);
      }
    }

    console.log('\nOffline backup completed at:', outDir);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

run();
