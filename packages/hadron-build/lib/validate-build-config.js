const platformRequiredKeys = {
  darwin: ['dmg_background', 'app_category_type', 'icon'],
  linux: ['deb_section', 'rpm_categories', 'icon'],
  win32: ['icon', 'favicon_url', 'loading_gif', 'background', 'banner'],
};

const validateBuildConfig = (platform, config) => {
  const requiredKeys = platformRequiredKeys[platform];
  if (!requiredKeys) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new Error(`Missing \`${key}\` in ${platform} config`);
    }
  }

  // Validate the icons object
  if (typeof config.icon !== 'object') {
    throw new Error(`Invalid \`icon\` in ${platform} config`);
  }
};

module.exports = {
  validateBuildConfig,
};
