export default [
  // both foo and bar have inconsistent types
  { foo: 1 },
  { foo: [1, 2, 3] },
  { foo: { bar: 1 } },
  { foo: { bar: { baz: 1 } } },

  // the objects inside array have different keys
  { array: [{ monkey: 1 }, { banana: 1 }] },
];
