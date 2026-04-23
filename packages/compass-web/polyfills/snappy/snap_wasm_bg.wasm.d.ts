/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const compress: (
  a: number,
  b: number
) => [number, number, number, number];
export const compress_frame: (
  a: number,
  b: number
) => [number, number, number, number];
export const decompress: (
  a: number,
  b: number
) => [number, number, number, number];
export const decompress_frame: (
  a: number,
  b: number
) => [number, number, number, number];
export const start: () => void;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (
  a: number,
  b: number,
  c: number,
  d: number
) => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
