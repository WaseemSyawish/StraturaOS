const { spawn } = require('child_process')
const path = require('path')

// Force Webpack in-process so shell differences don't matter
process.env.NEXT_PREFER_WEBPACK = 'true'

// Clean .next if requested (or default to cleaning once)
try {
  require(path.join(__dirname, 'clean-next.js'))
} catch (err) {
  // ignore
}

// If a tsconfig.json exists, temporarily move it so Next won't try to auto-install TypeScript
const fs = require('fs')
const tsPath = path.join(process.cwd(), 'tsconfig.json')
const tsBackup = path.join(process.cwd(), 'tsconfig.json.disabled-by-dev')
let movedTs = false
try {
  if (fs.existsSync(tsPath)) {
    fs.renameSync(tsPath, tsBackup)
    movedTs = true
    console.log('Temporarily moved tsconfig.json to tsconfig.json.disabled-by-dev')
  }
} catch (err) {
  // non-fatal
  console.warn('Could not move tsconfig.json:', err && err.message)
}

// Invoke next's CLI using node + resolved path to avoid shell-specific npx issues
let nextBin
try {
  nextBin = require.resolve('next/dist/bin/next')
} catch (err) {
  console.error('Cannot resolve next binary. Please install dependencies: npm install')
  process.exit(1)
}

const child = spawn(process.execPath, [nextBin, 'dev'], { stdio: 'inherit', env: process.env })

function restoreTsConfig() {
  try {
    if (movedTs && fs.existsSync(tsBackup)) {
      fs.renameSync(tsBackup, tsPath)
      console.log('Restored tsconfig.json')
    }
  } catch (err) {
    console.warn('Failed to restore tsconfig.json:', err && err.message)
  }
}

child.on('exit', (code) => {
  restoreTsConfig()
  process.exit(code)
})

child.on('error', (err) => {
  restoreTsConfig()
  console.error('Failed to start next dev:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  // ensure tsconfig is restored on Ctrl+C
  restoreTsConfig()
  process.exit(130)
})

process.on('exit', () => restoreTsConfig())
