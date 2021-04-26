export function wrapObjectLiteral(code: string): string {
  // Without this hack `{x: 2}` would be interpreted as code block and evaluated to `2`
  // rather than as an object literal.
  //
  // https://chromium.googlesource.com/chromium/src.git/+/4fd348fdb9c0b3842829acdfb2b82c86dacd8e0a%5E%21/#F2
  if (/^\s*\{/.test(code) && /\}\s*$/.test(code)) {
    return `(${code})`;
  }

  return code;
}
