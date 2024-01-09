import toNS from 'mongodb-ns';

export default function updateTitle(
  appName: string,
  connectionTitle?: string,
  workspaceType?: string,
  namespace?: string
): void {
  const ns = namespace ? toNS(namespace) : null;

  if (connectionTitle) {
    if (ns?.collection) {
      document.title = `${appName} - ${connectionTitle}/${ns.database}.${ns.collection}`;
      return;
    }

    if (ns?.database) {
      document.title = `${appName} - ${connectionTitle}/${ns.database}`;
      return;
    }

    if (workspaceType) {
      document.title = `${appName} - ${connectionTitle}/${workspaceType}`;
      return;
    }

    document.title = `${appName} - ${connectionTitle}`;
    return;
  }

  document.title = `${appName}`;
}
