const formatter = new Intl.NumberFormat();
export default function (num) {
  return formatter.format(Math.ceil(Number(num)));
}
