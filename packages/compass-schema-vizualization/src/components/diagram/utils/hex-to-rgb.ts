export const hexToRgb = (hex: string): number[] => [
  parseInt(hex[1] + hex[2], 16),
  parseInt(hex[3] + hex[4], 16),
  parseInt(hex[5] + hex[6], 16),
];

export const toRgbString = (hex: string, opacity: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
