const fs = require('node:fs')
const path = require('node:path')

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'vite',
  'dist',
  'node',
  'chunks',
  'config.js'
)

const originalBlock = `\texec("net use", (error$1, stdout) => {
\t\tif (error$1) return;
\t\tconst lines = stdout.split("\\n");
\t\tfor (const line of lines) {
\t\t\tconst m$2 = parseNetUseRE.exec(line);
\t\t\tif (m$2) windowsNetworkMap.set(m$2[2], m$2[1]);
\t\t}
\t\tif (windowsNetworkMap.size === 0) safeRealpathSync = fs.realpathSync.native;
\t\telse safeRealpathSync = windowsMappedRealpathSync;
\t});`

const patchedBlock = `\ttry {
\t\texec("net use", (error$1, stdout) => {
\t\t\tif (error$1) return;
\t\t\tconst lines = stdout.split("\\n");
\t\t\tfor (const line of lines) {
\t\t\t\tconst m$2 = parseNetUseRE.exec(line);
\t\t\t\tif (m$2) windowsNetworkMap.set(m$2[2], m$2[1]);
\t\t\t}
\t\t\tif (windowsNetworkMap.size === 0) safeRealpathSync = fs.realpathSync.native;
\t\t\telse safeRealpathSync = windowsMappedRealpathSync;
\t\t});
\t} catch {
\t\tsafeRealpathSync = fs.realpathSync.native;
\t}`

if (!fs.existsSync(targetFile)) {
  console.log('[patch-vite-eperm] Skip: vite config.js not found')
  process.exit(0)
}

const source = fs.readFileSync(targetFile, 'utf8')

if (source.includes(patchedBlock)) {
  console.log('[patch-vite-eperm] Already patched')
  process.exit(0)
}

if (!source.includes(originalBlock)) {
  console.log('[patch-vite-eperm] Skip: target block not found')
  process.exit(0)
}

const updated = source.replace(originalBlock, patchedBlock)
fs.writeFileSync(targetFile, updated, 'utf8')

console.log('[patch-vite-eperm] Patch applied')
