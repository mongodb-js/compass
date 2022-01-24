export function compactBytes(bytes: number, si = true, decimals = 2): string {
  const threshold = si ? 1000 : 1024;
  if (bytes === 0) {
    return `${bytes} B`;
  }
  const units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(threshold));
  const num = bytes / Math.pow(threshold, i);
  return `${num.toFixed(decimals)} ${units[i]}`;
}

export function compactNumber(number: number): string {
  return new Intl.NumberFormat('en', {
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
