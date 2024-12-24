export function actionTestId(dataTestId: string | undefined, action: string) {
  return dataTestId ? `${dataTestId}-${action}-action` : undefined;
}
