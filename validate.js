const fs = require('fs');
const { execSync } = require('child_process');
const config = require('./resume-config.json');

console.log('🔍 Validating all resumes configured in resume-config.json...');

Object.entries(config).forEach(([resumeName, details]) => {
    const { source } = details;
    console.log(`\n📄 Validating ${resumeName} resume (${source})...`);
    try {
        execSync(`npx resumed validate ${source}`, { stdio: 'inherit' });
        console.log(`✅ ${resumeName} resume is valid.`);
    } catch (error) {
        console.error(`❌ Validation failed for ${resumeName}:`, error.message);
        process.exit(1);
    }
});
