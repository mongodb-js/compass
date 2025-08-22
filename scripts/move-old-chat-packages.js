#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OLD_CHAT_DIR = 'packages/compass-assistant/src/vendor/old-chat';
const LG_CHAT_DIR = 'packages/compass-assistant/src/vendor/@lg-chat';

/**
 * Gets all package directories from old-chat and @lg-chat
 */
function getPackageDirectories() {
  if (!fs.existsSync(OLD_CHAT_DIR)) {
    console.error(`❌ Old chat directory not found: ${OLD_CHAT_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(LG_CHAT_DIR)) {
    console.error(`❌ LG chat directory not found: ${LG_CHAT_DIR}`);
    process.exit(1);
  }

  const oldChatPackages = [];
  const lgChatPackages = [];

  // Get old-chat packages
  const oldChatItems = fs.readdirSync(OLD_CHAT_DIR);
  for (const item of oldChatItems) {
    const fullPath = path.join(OLD_CHAT_DIR, item);
    const packageJsonPath = path.join(fullPath, 'package.json');

    if (fs.statSync(fullPath).isDirectory() && fs.existsSync(packageJsonPath)) {
      oldChatPackages.push({
        name: item,
        packageJsonPath,
      });
    }
  }

  // Get @lg-chat packages
  const lgChatItems = fs.readdirSync(LG_CHAT_DIR);
  for (const item of lgChatItems) {
    const fullPath = path.join(LG_CHAT_DIR, item);
    const srcPath = path.join(fullPath, 'src');
    const indexPath = path.join(srcPath, 'index.ts');

    if (
      fs.statSync(fullPath).isDirectory() &&
      fs.existsSync(srcPath) &&
      fs.existsSync(indexPath)
    ) {
      lgChatPackages.push({
        name: item,
        destPackageJsonPath: path.join(fullPath, 'package.json'),
      });
    }
  }

  return { oldChatPackages, lgChatPackages };
}

/**
 * Updates package.json to point main to src/index.ts
 */
function updatePackageJsonMain(packageJsonContent) {
  const packageJson = JSON.parse(packageJsonContent);

  // Update main field to point to src/index.ts for development
  packageJson.main = 'src/index.ts';

  // Remove build-related fields since we're pointing to source
  delete packageJson.module;
  delete packageJson.types;

  return JSON.stringify(packageJson, null, 2) + '\n';
}

/**
 * Moves package.json from old-chat to @lg-chat
 */
function movePackageJson(oldPackage, lgPackage) {
  const { name, packageJsonPath: sourcePackageJsonPath } = oldPackage;
  const { destPackageJsonPath } = lgPackage;

  try {
    // Read the source package.json
    const packageJsonContent = fs.readFileSync(sourcePackageJsonPath, 'utf8');

    // Update main field to point to src/index.ts
    const updatedContent = updatePackageJsonMain(packageJsonContent);

    // Write to destination
    fs.writeFileSync(destPackageJsonPath, updatedContent);

    console.log(`✅ Moved package.json for @lg-chat/${name}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to move package.json for ${name}: ${error.message}`
    );
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Moving package.json files from old-chat to @lg-chat...\n');

  const { oldChatPackages, lgChatPackages } = getPackageDirectories();

  console.log(`📦 Found ${oldChatPackages.length} old-chat packages`);
  console.log(`📦 Found ${lgChatPackages.length} @lg-chat packages\n`);

  // Create a map of lg-chat packages for quick lookup
  const lgChatMap = new Map(lgChatPackages.map((pkg) => [pkg.name, pkg]));

  let successCount = 0;
  let skippedCount = 0;

  // Process each old-chat package
  for (const oldPackage of oldChatPackages) {
    const lgPackage = lgChatMap.get(oldPackage.name);

    if (!lgPackage) {
      console.warn(
        `⚠️  No matching @lg-chat package found for ${oldPackage.name}`
      );
      skippedCount++;
      continue;
    }

    if (movePackageJson(oldPackage, lgPackage)) {
      successCount++;
    }
  }

  console.log(
    `\n🎉 Done! Successfully moved ${successCount} package.json files.`
  );
  if (skippedCount > 0) {
    console.log(
      `⚠️  Skipped ${skippedCount} packages (no matching destination).`
    );
  }

  console.log('\n💡 All moved packages now have:');
  console.log('   • Proper dependencies from old-chat versions');
  console.log('   • main field pointing to "src/index.ts"');
  console.log('   • Build configurations from original packages');

  // Optionally show what to do next
  console.log('\n📝 Next steps:');
  console.log('   • Review the moved package.json files');
  console.log('   • Run npm install to update dependencies');
  console.log('   • Consider removing the old-chat directory when ready');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getPackageDirectories,
  updatePackageJsonMain,
  movePackageJson,
};
