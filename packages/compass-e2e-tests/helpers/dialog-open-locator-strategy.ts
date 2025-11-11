export function dialogOpenLocator(selector: string) {
  // eslint-disable-next-line no-restricted-globals -- This runs in the browser
  const result: HTMLDialogElement[] = [];
  // eslint-disable-next-line no-restricted-globals -- This runs in the browser
  const elements = document.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (
      // eslint-disable-next-line no-restricted-globals -- This runs in the browser
      element instanceof HTMLDialogElement &&
      element.open
    ) {
      result.push(element);
    }
  }
  return result;
}
