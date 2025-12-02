#!/usr/bin/env node

/**
 * Script para reemplazar console.log/error/warn con logger
 * Uso: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const loggerImport = "import logger from '../utils/logger';";
const loggerImportRelative = "import logger from '@/utils/logger';";

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function replaceConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Reemplazar console.log
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, 'logger.info(');
    modified = true;
  }
  
  // Reemplazar console.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error\(/g, 'logger.error(');
    modified = true;
  }
  
  // Reemplazar console.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    modified = true;
  }
  
  // Agregar import si se hizo algún reemplazo y no existe el import
  if (modified && !content.includes("import logger")) {
    // Encontrar la última línea de imports
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      } else if (lastImportIndex !== -1 && lines[i].trim() === '') {
        break;
      }
    }
    
    if (lastImportIndex !== -1) {
      // Determinar si usar ruta relativa o @ alias
      const isInPages = filePath.includes('/pages/');
      const isInComponents = filePath.includes('/components/');
      const importToAdd = (isInPages || isInComponents) ? loggerImportRelative : loggerImport;
      
      lines.splice(lastImportIndex + 1, 0, importToAdd);
      content = lines.join('\n');
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

// Ejecutar
const srcDir = path.join(__dirname, '../src');
const files = findFiles(srcDir);
let updatedCount = 0;

console.log(`📁 Found ${files.length} files to check...\n`);

files.forEach(file => {
  if (replaceConsoleLogs(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Done! Updated ${updatedCount} files.`);

