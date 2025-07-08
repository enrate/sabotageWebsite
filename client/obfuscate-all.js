const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'build/static/js');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(dir, file);
    console.log('Obfuscating', filePath);
    execSync(`npx javascript-obfuscator "${filePath}" --output "${filePath}" --compact true --self-defending true --control-flow-flattening true`);
  }
}); 