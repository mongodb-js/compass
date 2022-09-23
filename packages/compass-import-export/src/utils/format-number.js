const formatter = new Intl.NumberFormat();
export default function formatNumber(num) {
  return formatter.format(Math.ceil(Number(num)));
}
