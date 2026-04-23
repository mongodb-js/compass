/* tslint:disable */
/* eslint-disable */

/**
 * Compress `input` bytes using deflate at the given compression level (0–9).
 *
 * Returns the compressed bytes on success, or throws a JavaScript error on failure.
 *
 * - `level` 0 = no compression, 1 = fastest, 9 = best compression, -1 = default (6)
 */
export function compress(input: Uint8Array, level: number): Uint8Array;

/**
 * Returns the maximum compressed size for an input of `input_len` bytes.
 *
 * Use this to pre-allocate a buffer before calling `compress`.
 */
export function compress_bound(input_len: number): number;

/**
 * Decompress deflate-compressed `input` bytes.
 *
 * `max_output_size` limits the decompressed buffer to prevent memory exhaustion
 * (defaults to 256 MiB when set to 0).
 *
 * Returns the decompressed bytes on success, or throws a JavaScript error on failure.
 */
export function decompress(
  input: Uint8Array,
  max_output_size: number
): Uint8Array;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly compress: (
    a: number,
    b: number,
    c: number
  ) => [number, number, number, number];
  readonly compress_bound: (a: number) => number;
  readonly decompress: (
    a: number,
    b: number,
    c: number
  ) => [number, number, number, number];
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>
): Promise<InitOutput>;
