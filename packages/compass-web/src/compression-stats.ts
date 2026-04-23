type CompressionStat = {
  originalLength: number;
  compressedLength: number;
  compressionTime: number;
  ratio: number;
};

type DecompressionStat = {
  compressedLength: number;
  decompressedLength: number;
  decompressionTime: number;
  ratio: number;
};

const compressionStats: CompressionStat[] = [];
const decompressionStats: DecompressionStat[] = [];

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
  });
}

(window as any).compressionStats = {
  getCompressionStats: () => compressionStats,
  getDecompressionStats: () => decompressionStats,
  reset: () => {
    compressionStats.length = 0;
    decompressionStats.length = 0;
  },
};
