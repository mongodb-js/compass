/**
 * Format bytes into a human-readable string with appropriate units.
 *
 * @param bytes - The number of bytes to format
 * @param si - Use SI units (1000-based) if true, binary units (1024-based) if false
 * @param decimals - Number of decimal places to show
 * @returns Formatted string with units (e.g., "1.5 MB", "2.0 KiB")
 */
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

/**
 * Format a number into a compact notation with appropriate suffix.
 *
 * @param number - The number to format
 * @returns Formatted string with compact notation (e.g., "1.5 K", "2 M")
 */
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
