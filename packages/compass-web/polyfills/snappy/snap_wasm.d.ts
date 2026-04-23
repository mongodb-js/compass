/* tslint:disable */
/* eslint-disable */

/**
 * Compresses `data` using the raw Snappy block format.
 *
 * Returns the compressed bytes on success, or throws a JS error string on failure.
 * Use this format when interoperating with other raw Snappy implementations.
 */
export function compress(data: Uint8Array): Promise<Uint8Array>;

/**
 * Compresses `data` using the Snappy frame format (`.sz` files,
 * MIME type `application/x-snappy-framed`).
 *
 * This is the recommended format for most use-cases: it supports streaming
 * and includes per-chunk CRC32C integrity checksums.
 *
 * Returns the compressed bytes on success, or throws a JS error string on failure.
 */
export function compress_frame(data: Uint8Array): Uint8Array;

/**
 * Decompresses `data` using the raw Snappy block format.
 *
 * Returns the decompressed bytes on success, or throws a JS error string on failure.
 */
export function decompress(data: Uint8Array): Promise<Uint8Array>;

/**
 * Decompresses `data` using the Snappy frame format (`.sz` files).
 *
 * Returns the decompressed bytes on success, or throws a JS error string on failure.
 */
export function decompress_frame(data: Uint8Array): Uint8Array;

/**
 * Initializes the WASM module.
 * Must be called before using compress/decompress functions.
 */
export function start(): Promise<void>;
