declare type PickByValue<T, K> = Pick<
  T,
  { [k in keyof T]: T[k] extends K ? k : never }[keyof T]
>;
