const { spawnSync } = require('child_process')
const path = require('path')

// Clean, generate Prisma client, build, then start (local production server)
try {
  require(path.join(__dirname, 'clean-next.js'))
} catch (err) {
  // ignore
}

console.log('Generating Prisma client...')
if (spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit' }).status !== 0) process.exit(1)

console.log('Running next build...')
if (spawnSync('npx', ['next', 'build'], { stdio: 'inherit' }).status !== 0) process.exit(1)

console.log('Starting production server (next start)...')
const child = spawnSync('npx', ['next', 'start'], { stdio: 'inherit' })
process.exit(child.status)
