import Namespace from '../types/namespace';

export default function updateTitle(
  appName: string,
  connectionTitle?: string,
  namespace?: Namespace
): void {
  if (!connectionTitle) {
    document.title = `${appName}`;
    return;
  }

  if (!namespace || !namespace.database) {
    document.title = `${appName} - ${connectionTitle}`;
    return;
  }

  if (!namespace.collection) {
    document.title = `${appName} - ${connectionTitle}/${namespace.database}`;
    return;
  }

  document.title = `${appName} - ${connectionTitle}/${namespace.database}.${namespace.collection}`;
}
