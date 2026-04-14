declare module 'process/browser' {
  export default process;
}

declare module 'core-js/actual/disposable-stack' {
  class DisposableStack implements Disposable {
    constructor();
    readonly disposed: boolean;
    use<T extends Disposable | null | undefined>(value: T): T;
    adopt<T>(value: T, onDispose: (value: T) => void): T;
    defer(onDispose: () => void): void;
    move(): DisposableStack;
    dispose(): void;
    [Symbol.dispose](): void;
  }
  export = DisposableStack;
}
