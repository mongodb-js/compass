import { Readable } from 'stream';
import { StringDecoder } from 'string_decoder';

const LINE_ENDING_RE = /\r?\n|\r(?!\n)/;
const CTRL_C = '\u0003';
const CTRL_D = '\u0004';

/**
 * A proxy for `tty.ReadStream` that allows to read
 * the stream line by line.
 *
 * Each time a newline is encountered the stream wont emit further data
 * untill `.nextLine()` is called.
 *
 * NOTE: the control sequences Ctrl+C and Ctrl+D are not buffered and instead
 * are forwarded regardless.
 *
 * Is possible to disable the "line splitting" by calling `.disableBlockOnNewline()` and
 * re-enable it by calling `.enableBlockOnNewLine()`.
 *
 * If the line splitting is disabled the stream will behave like
 * the proxied `tty.ReadStream`, forwarding all the characters.
 */
export class LineByLineInput extends Readable {
  private _originalInput: NodeJS.ReadStream;
  private _forwarding: boolean;
  private _blockOnNewLineEnabled: boolean;
  private _charQueue: (string | null)[];
  private _decoder: StringDecoder;
  private _insidePushCalls: number;

  constructor(readable: NodeJS.ReadStream) {
    super();
    this._originalInput = readable;
    this._forwarding = true;
    this._blockOnNewLineEnabled = true;
    this._charQueue = [];
    this._decoder = new StringDecoder('utf-8');
    this._insidePushCalls = 0;

    const isReadableEvent = (name: string) =>
      name === 'readable' || name === 'data' || name === 'end' || name === 'keypress';

    // Listeners for events that are not related to this object being a readable
    // stream are also added to the wrapped object.
    this.on('removeListener', (name: string, handler: (...args: any[]) => void) => {
      if (!isReadableEvent(name)) {
        this._originalInput.removeListener(name, handler);
      }
    });
    this.on('newListener', (name: string, handler: (...args: any[]) => void) => {
      if (!isReadableEvent(name)) {
        this._originalInput.addListener(name, handler);
      }
    });

    const proxy = new Proxy(readable, {
      get: (target: NodeJS.ReadStream, property: string): any => {
        if (typeof property === 'string' &&
          !property.startsWith('_') &&
          typeof (this as any)[property] === 'function'
        ) {
          return (this as any)[property].bind(this);
        }

        return (target as any)[property];
      }
    });

    return (proxy as unknown) as LineByLineInput;
  }

  start(): void {
    this._originalInput.on('data', (chunk) => this._onData(chunk));
    this._originalInput.on('end', () => this._onData(null));
  }

  _read(): void {
  }

  nextLine(): void {
    this._resumeForwarding();
    this._flush();
  }

  enableBlockOnNewLine(): void {
    this._blockOnNewLineEnabled = true;
  }

  disableBlockOnNewline(): void {
    this._blockOnNewLineEnabled = false;
    this._flush();
  }

  private _onData = (chunk: Buffer | null): void => {
    if (this._blockOnNewLineEnabled) {
      return this._forwardAndBlockOnNewline(chunk);
    }

    return this._forwardWithoutBlocking(chunk);
  };

  private _forwardAndBlockOnNewline(chunk: Buffer | null): void {
    const chars = chunk === null ? [null] : this._decoder.write(chunk);
    for (const char of chars) {
      if (this._isCtrlC(char) || this._isCtrlD(char)) {
        this.push(char);
      } else {
        this._charQueue.push(char);
      }
    }
    this._flush();
  }

  private _forwardWithoutBlocking(chunk: Buffer | null): void {
    if (chunk !== null) {
      // keeps decoding state consistent
      this._decoder.write(chunk);
    }
    this.push(chunk);
  }

  private _pauseForwarding(): void {
    this._forwarding = false;
  }

  private _resumeForwarding(): void {
    this._forwarding = true;
  }

  private _shouldForward(): boolean {
    // If we are not blocking on new lines
    // we just forward everything as is,
    // otherwise we forward only if the forwarding
    // is not paused.

    return !this._blockOnNewLineEnabled || this._forwarding;
  }

  private _flush(): void {
    while (
      this._charQueue.length &&
      this._shouldForward() &&

      // We don't forward residual characters we could
      // have in the buffer if in the meanwhile something
      // downstream explicitly called pause(), as that may cause
      // unexpected behaviors.
      !this._originalInput.isPaused() &&

      // If we are already inside a push() call, then we do not need to flush
      // the queue again.
      this._insidePushCalls === 0
    ) {
      const char = this._charQueue.shift() as string | null;

      if (this._isLineEnding(char)) {
        this._pauseForwarding();
      }

      this.push(char);
    }
  }

  private _isLineEnding(char: string | null): boolean {
    return char !== null && LINE_ENDING_RE.test(char);
  }

  private _isCtrlD(char: string | null): boolean {
    return char === CTRL_D;
  }

  private _isCtrlC(char: string | null): boolean {
    return char === CTRL_C;
  }

  push(chunk: Buffer | string | null): boolean {
    this._insidePushCalls++;
    try {
      return super.push(chunk);
    } finally {
      this._insidePushCalls--;
    }
  }
}
