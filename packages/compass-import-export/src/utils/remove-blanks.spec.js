import removeBlanks, { removeBlanksStream } from './remove-blanks';
import stream from 'stream';
import { Stream } from 'mongodb-stitch-browser-sdk';

describe('remove-blanks', () => {
  it('should remove empty strings', () => {
    const source = {
      _id: 1,
      empty: ''
    };
    const result = removeBlanks(source);
    expect(result).to.deep.equal({ _id: 1 });
  });

  it('should remove empty strings but leave falsy values', () => {
    const source = {
      _id: 1,
      empty: '',
      nulled: null,
      falsed: false,
      undef: undefined
    };
    const result = removeBlanks(source);
    expect(result).to.deep.equal({
      _id: 1,
      nulled: null,
      falsed: false,
      undef: undefined
    });
  });
  it('should tolerate empty docs if a bad projection was specified', () => {
    expect(removeBlanks({})).to.deep.equal({});
  });
  it('should tolerate arrays', () => {
    expect(removeBlanks([{}])).to.deep.equal([{}]);
  });
  describe('stream', () => {
    it('should return a passthrough if not ignoring blanks', () => {
      const transform = removeBlanksStream(false);
      expect(transform).to.be.instanceOf(stream.PassThrough);
    });
    it('should remove blanks via a transform', (done) => {
      const src = stream.Readable.from([{
        _id: 1,
        empty: '',
        nulled: null,
        falsed: false,
        undef: undefined
      }]);
      const transform = removeBlanksStream(true);
      let result;
      const dest = new stream.Writable({
        objectMode: true,
        write: function(doc, encoding, next) {
          result = doc;
          return next(null);
        }
      });
      stream.pipeline(src, transform, dest, function(err) {
        if (err) {
          return done(err);
        }

        expect(result).to.deep.equal({
          _id: 1,
          nulled: null,
          falsed: false,
          undef: undefined
        });
        done();
      });
    });
  });
});
