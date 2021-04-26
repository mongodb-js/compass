import { expect } from 'chai';
import { StringDecoder } from 'string_decoder';
import { EventEmitter } from 'events';
import { LineByLineInput } from './line-by-line-input';

describe('LineByLineInput', () => {
  let stdinMock: NodeJS.ReadStream;
  let decoder: StringDecoder;
  let forwardedChunks: string[];
  let lineByLineInput: LineByLineInput;

  beforeEach(() => {
    stdinMock = new EventEmitter() as NodeJS.ReadStream;
    stdinMock.isPaused = (): boolean => false;
    decoder = new StringDecoder();
    forwardedChunks = [];
    lineByLineInput = new LineByLineInput(stdinMock);
    lineByLineInput.start();
    lineByLineInput.on('data', (chunk) => {
      const decoded = decoder.write(chunk);
      if (decoded) {
        forwardedChunks.push(decoded);
      }
    });
  });

  context('when block on newline is enabled (default)', () => {
    it('does not forward characters after newline', () => {
      stdinMock.emit('data', Buffer.from('ab\nc'));
      expect(forwardedChunks).to.deep.equal(['a', 'b', '\n']);
    });

    it('forwards CTRL-C anyway and as soon as is received', () => {
      stdinMock.emit('data', Buffer.from('\n\u0003'));
      expect(forwardedChunks).to.contain('\u0003');
    });

    it('forwards CTRL-D anyway and as soon as is received', () => {
      stdinMock.emit('data', Buffer.from('\n\u0004'));
      expect(forwardedChunks).to.contain('\u0004');
    });

    it('unblocks on nextline', () => {
      stdinMock.emit('data', Buffer.from('ab\nc'));
      lineByLineInput.nextLine();
      expect(forwardedChunks).to.deep.equal(['a', 'b', '\n', 'c']);
    });
  });

  context('when block on newline is disabled', () => {
    it('does forwards all the characters', () => {
      lineByLineInput.disableBlockOnNewline();
      stdinMock.emit('data', Buffer.from('ab\nc'));
      expect(forwardedChunks).to.deep.equal(['ab\nc']);
    });
  });

  context('when block on newline is disabled and re-enabled', () => {
    it('does forwards all the characters', () => {
      lineByLineInput.disableBlockOnNewline();
      lineByLineInput.enableBlockOnNewLine();
      stdinMock.emit('data', Buffer.from('ab\nc'));
      expect(forwardedChunks).to.deep.equal(['a', 'b', '\n']);
    });
  });

  context('when a data listener calls nextLine() itself after Ctrl+C', () => {
    it('does not emit data while already emitting data', () => {
      let dataCalls = 0;
      let insideDataCalls = 0;
      lineByLineInput.on('data', () => {
        expect(insideDataCalls).to.equal(0);
        insideDataCalls++;
        if (dataCalls++ === 0) {
          lineByLineInput.nextLine();
        }
        insideDataCalls--;
      });
      stdinMock.emit('data', Buffer.from('foo\n\u0003'));
      expect(dataCalls).to.equal(5);
      expect(forwardedChunks).to.deep.equal(['\u0003', 'f', 'o', 'o', '\n']);
    });
  });
});
