function windowsInstallerVersion(version) {
  const versionComponents = (version || '').match(/^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?/);

  if (versionComponents) {
    const [, major, minor, patch, pre] = versionComponents;
    return `${major}.${minor}.${patch}.${pre || 0}`;
  }

  return '0.0.0.0';
}

module.exports = windowsInstallerVersion;
