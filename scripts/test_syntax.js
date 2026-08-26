const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  let errors = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        errors += checkDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Basic sanity checks
      if (content.includes('import ') && content.includes('from ')) {
        // Check for unresolved local relative imports
        const importMatches = content.matchAll(/from\s+['"](\.[^'"]+)['"]/g);
        for (const m of importMatches) {
          const importPath = m[1];
          const resolvedDir = path.dirname(fullPath);
          const tryJsx = path.resolve(resolvedDir, importPath + '.jsx');
          const tryJs = path.resolve(resolvedDir, importPath + '.js');
          const tryIndexJs = path.resolve(resolvedDir, importPath, 'index.js');
          const tryIndexJsx = path.resolve(resolvedDir, importPath, 'index.jsx');
          const tryDirect = path.resolve(resolvedDir, importPath);

          if (!fs.existsSync(tryJsx) && !fs.existsSync(tryJs) && !fs.existsSync(tryIndexJs) && !fs.existsSync(tryIndexJsx) && !fs.existsSync(tryDirect)) {
            console.error(`❌ BROKEN IMPORT in ${fullPath}: cannot resolve "${importPath}"`);
            errors++;
          }
        }
      }
    }
  }
  return errors;
}

const frontendErrors = checkDir(path.resolve('c:/coding/MatchA/app/frontend/src'));
const backendErrors = checkDir(path.resolve('c:/coding/MatchA/app/backend'));

console.log(`\n================================`);
console.log(`Checked all source files!`);
console.log(`Broken Import Errors: ${frontendErrors + backendErrors}`);
console.log(`================================\n`);
