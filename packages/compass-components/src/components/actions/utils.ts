export function actionTestId<Action extends string>(
  dataTestId: string | undefined,
  action: Action
) {
  return dataTestId ? `${dataTestId}-${action}-action` : undefined;
}
