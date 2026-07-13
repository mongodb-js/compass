declare module '*.module.less' {
  const styles = Record<string, string>;
  export default styles;
}

declare module '*.less' {
  export default undefined;
}

declare module '*.css' {
  export default undefined;
}
