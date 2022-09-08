export interface AmpersandMethodOptions<T> {
  success: (model: T) => void;
  error: (model: T, error: Error) => void;
  validate?: boolean;
}

export function promisifyAmpersandMethod<T>(
  fn: (options: AmpersandMethodOptions<T>) => void
): () => Promise<T> {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, {
        success: (model: T) => {
          resolve(model);
        },
        error: (model: T, error: Error) => {
          reject(error);
        },
      });
    });
}
