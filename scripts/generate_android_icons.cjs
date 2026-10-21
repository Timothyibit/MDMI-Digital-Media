const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const logoSource = path.resolve(__dirname, '../public/logo.png');

if (!fs.existsSync(logoSource)) {
  console.error('Source logo does not exist:', logoSource);
  process.exit(1);
}

const densities = [
  { folder: 'mipmap-mdpi', size: 48, fg: 108 },
  { folder: 'mipmap-hdpi', size: 72, fg: 162 },
  { folder: 'mipmap-xhdpi', size: 96, fg: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, fg: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, fg: 432 }
];

densities.forEach(({ folder, size, fg }) => {
  const dir = path.resolve(__dirname, '../android/app/src/main/res', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Standard square launcher icon
  spawnSync('convert', [logoSource, '-resize', `${size}x${size}`, path.join(dir, 'ic_launcher.png')], { stdio: 'inherit' });

  // 2. Round launcher icon (public/logo.png is already styled or resized)
  spawnSync('convert', [logoSource, '-resize', `${size}x${size}`, path.join(dir, 'ic_launcher_round.png')], { stdio: 'inherit' });

  // 3. Adaptive foreground icon (centered with standard 72% safe zone extent)
  const innerSize = Math.round(fg * 0.72);
  spawnSync('convert', [
    logoSource,
    '-resize', `${innerSize}x${innerSize}`,
    '-background', 'none',
    '-gravity', 'center',
    '-extent', `${fg}x${fg}`,
    path.join(dir, 'ic_launcher_foreground.png')
  ], { stdio: 'inherit' });

  console.log(`Generated ${folder} icons (${size}x${size}, fg: ${fg}x${fg})`);
});

console.log('All Android mipmap icons generated successfully from public/logo.png!');
