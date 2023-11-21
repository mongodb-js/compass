export default function windowsInstallerVersion(version?: string) {
  const versionComponents = (version || '').match(
    /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?/
  );

  if (versionComponents) {
    const [, major, minor, patch, pre] = versionComponents;
    return `${major}.${minor}.${patch}.${pre || 0}`;
  }

  return '0.0.0.0';
}
