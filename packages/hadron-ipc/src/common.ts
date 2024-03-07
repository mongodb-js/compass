export const getResponseChannel = (methodName: string) =>
  `@cloud-mongodb-js/hadron-ipc-${methodName}-response`;
