const invalidHostCharacterRegex = /[@/]/;
const invalidSrvHostnameCharacterRegex = /[:@,/]/;

export function checkForInvalidCharacterInHost(
  host: string,
  isSRV: boolean
): void {
  const hostRegex = isSRV
    ? invalidSrvHostnameCharacterRegex
    : invalidHostCharacterRegex;

  const invalidCharacterInHost = hostRegex.exec(host);
  if (invalidCharacterInHost) {
    throw new Error(
      `Invalid character in host: '${invalidCharacterInHost[0]}'`
    );
  }
}
