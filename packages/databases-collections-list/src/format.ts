export function compactBytes(bytes: number, si = false, dp = 1): string {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
}
export function compactNumber(number: number): string {
  return new Intl.NumberFormat('en', {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    notation: 'compact',
  })
    .formatToParts(number)
    .reduce((acc, part) => {
      if (part.type === 'compact') {
        return `${acc} ${part.value}`;
      }
      return `${acc}${part.value}`;
    }, '');
}
