declare module 'electron-packager-plugin-non-proprietary-codecs-ffmpeg' {
  type AfterExtractCallback = (
    buildPath: string,
    electronVersion: string,
    platform: string,
    arch: string,
    callback: (error: Error | null) => void
  ) => void;

  const safeFFMPEG: AfterExtractCallback;
  export default safeFFMPEG;
}
