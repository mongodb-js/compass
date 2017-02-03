module.exports = [
  {
    'v': 2,
    'key': {'a': Infinity},
    'name': 'a_Infinity',
    'ns': 'indexes.funky'
  },
// Skip Decimal128 for now...
// { v: 2,
//   key:
//    { a:
//       Decimal128 {
//         _bsontype: 'Decimal128',
//         bytes: <Buffer 01 00 00 00 00 00 00 00 00 00 00 00 00 00 58 30> } },
//   name: 'a_NumberDecimal("1E+12")',
//   ns: 'indexes.funky' } { a:
//    Decimal128 {
//      _bsontype: 'Decimal128',
//      bytes: <Buffer 01 00 00 00 00 00 00 00 00 00 00 00 00 00 58 30> } } Decimal128 {
//   _bsontype: 'Decimal128',
//   bytes: <Buffer 01 00 00 00 00 00 00 00 00 00 00 00 00 00 58 30> }
  {'v': 2, 'key': {'a': -2}, 'name': 'a_-2', 'ns': 'indexes.funky'},
  {'v': 2, 'key': {'a': 0.1}, 'name': 'a_0.1', 'ns': 'indexes.funky'},
  {'v': 2, 'key': {'a': -0.5}, 'name': 'a_-0.5', 'ns': 'indexes.funky'},
  {'v': 1, 'key': {'b': 0}, 'name': 'b_0', 'ns': 'indexes.funky'},
  {'v': 1, 'key': {'b': true}, 'name': 'b_true', 'ns': 'indexes.funky'}
];
