const formatter = new Intl.NumberFormat();
export default function formatNumber(num: number | string) {
  return formatter.format(Math.ceil(Number(num)));
}
