export const getResponseChannel = (methodName: string) =>
  `hadron-ipc-${methodName}-response`;
