type CompressionStat = {
  originalLength: number;
  compressedLength: number;
  compressionTime: number;
  ratio: number;
  algorithm: string;
};

type DecompressionStat = {
  compressedLength: number;
  decompressedLength: number;
  decompressionTime: number;
  ratio: number;
  algorithm: string;
};

const compressionStats: CompressionStat[] = [];
const decompressionStats: DecompressionStat[] = [];

function getCaller(): string {
  const error = new Error();
  const match = error.stack?.match(/\/polyfills\/([^/]+)\//);
  return match?.[1] || 'unknown';
}

export function addCompressionStat(
  originalLength: number,
  compressedLength: number,
  startTime: number
): void {
  compressionStats.push({
    originalLength,
    compressedLength,
    ratio: Math.round((compressedLength / originalLength) * 100) / 100,
    compressionTime: performance.now() - startTime,
    algorithm: getCaller(),
  });
}

export function addDecompressionStat(
  compressedLength: number,
  decompressedLength: number,
  startTime: number
): void {
  decompressionStats.push({
    compressedLength,
    decompressedLength,
    ratio: Math.round((decompressedLength / compressedLength) * 100) / 100,
    decompressionTime: performance.now() - startTime,
    algorithm: getCaller(),
  });
}

(window as any).compressionStats = {
  compressor: process.env.COMPRESSION_ALGORITHM,
  getCompressionStats: () => compressionStats,
  getDecompressionStats: () => decompressionStats,
  reset: () => {
    compressionStats.length = 0;
    decompressionStats.length = 0;
  },
};
