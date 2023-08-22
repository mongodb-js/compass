import { expect } from 'chai';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';

import { DocStatsStream } from './import-utils';

const SIMPLE_DOC_1 = {
  name: 'Compass',
  version: '1.38',
  mode: 'Standalone',
};

const SIMPLE_DOC_2 = {
  _id: { $oid: '5d94d618857bd7924fdcfd15' },
  uuid: {
    $binary: { base64: 'ACY24RDNTIuppwG3v9OJnA==', subType: '04' },
  },
  name: 'Arlo',
};

const COMPLEX_DOC = {
  author: 'arnold-j',
  content:
    'Message-ID: <17334447.1075857585446.JavaMail.evans@thyme>\r\nDate: Thu, 16 Nov 2000 09:30:00 -0800 (PST)\r\nFrom: msagel@home.com\r\nTo: jarnold@enron.com\r\nSubject: Status\r\nMime-Version: 1.0\r\nContent-Type: text/plain; charset=ANSI_X3.4-1968\r\nContent-Transfer-Encoding: 7bit\r\nX-From: "Mark Sagel" <msagel@home.com>\r\nX-To: "John Arnold" <jarnold@enron.com>\r\nX-cc: \r\nX-bcc: \r\nX-Folder: \\John_Arnold_Dec2000\\Notes Folders\\Notes inbox\r\nX-Origin: Arnold-J\r\nX-FileName: Jarnold.nsf\r\n\r\nJohn:\n?\nI\'m not really sure what happened between us.? I was  under the impression \nafter my visit to Houston that we were about to enter into  a trial agreement \nfor my advisory work.? Somehow,?this never  occurred.? Did I say or do \nsomething wrong to screw this  up???\n?\nI don\'t know if you\'ve blown this whole thing off, but I still  hope you are \ninterested in trying?to create an arrangement.? As a  courtesy, here is my \nreport from this past weekend.? If you are no longer  interested in my work, \nplease tell me so.??Best wishes,\n?\nMark Sagel\nPsytech Analytics\n(410)308-0245? \n - energy2000-1112.doc',
  date: {
    $date: '2000-11-16T17:30:00.000Z',
  },
  emailData: {
    bcc: [],
    cc: [],
    dateSent: {
      $date: '2000-11-16T17:30:00.000Z',
    },
    folderPath: 'notes_inbox',
    from: 'msagel@home.com',
    relativeFilePath: 'arnold-j/notes_inbox/36.',
    subject: 'Status',
    to: ['jarnold@enron.com'],
    username: 'arnold-j',
  },
  entities: [
    {
      beginOffset: 2,
      endOffset: 6,
      score: 0.9987344145774841,
      text: 'John',
      type: 'PERSON',
    },
    {
      beginOffset: 104,
      endOffset: 111,
      score: 0.9976434111595154,
      text: 'Houston',
      type: 'LOCATION',
    },
  ],
};

const createMockReadable = (readFn?: (readable: Readable) => void) => {
  let readCount = 0;
  return new Readable({
    objectMode: true,
    read: readFn
      ? function () {
          readFn(this);
        }
      : function () {
          if (readCount === 0) {
            this.push(SIMPLE_DOC_1);
          } else if (readCount === 1) {
            this.push(COMPLEX_DOC);
          } else if (readCount === 2) {
            this.push(SIMPLE_DOC_2);
          } else {
            this.push(null);
          }
          readCount++;
        },
  });
};

const createMockWritable = (
  writeFn = (
    c: any,
    e: string,
    callback: (error?: Error, chunk?: any) => void
  ) => callback()
) =>
  new Writable({
    objectMode: true,
    write: writeFn,
  });

describe('import-utils', function () {
  describe('DocStatsStream', function () {
    it('should track the size of biggest doc encountered', async function () {
      const docStatsStream = new DocStatsStream();
      await pipeline([
        createMockReadable(),
        docStatsStream,
        createMockWritable(),
      ]);

      expect(docStatsStream.getStats().biggestDocSize).to.equal(
        JSON.stringify(COMPLEX_DOC).length
      );
    });

    it('should pass through the input unaltered', async function () {
      const mockReadableStream = createMockReadable(function (
        readable: Readable
      ) {
        readable.push(COMPLEX_DOC);
        readable.push(null);
      });

      const docStatsStream = new DocStatsStream();

      const mockWritableStream = createMockWritable(function (
        chunk,
        encoding,
        callback
      ) {
        expect(chunk).to.deep.equal(COMPLEX_DOC);
        callback();
      });

      await pipeline([mockReadableStream, docStatsStream, mockWritableStream]);
    });

    context('when there is an error while calculating doc stats', function () {
      it('should pass through the doc without throwing an error', async function () {
        // Circular reference will fail JSON.stringify
        const CIRCULAR_REF_DOC: any = {
          ...SIMPLE_DOC_1,
        };
        CIRCULAR_REF_DOC.refDoc = CIRCULAR_REF_DOC;

        const mockReadableStream = createMockReadable(function (
          readable: Readable
        ) {
          readable.push(CIRCULAR_REF_DOC);
          readable.push(null);
        });

        const docStatsStream = new DocStatsStream();

        const mockWritableStream = createMockWritable(function (
          chunk,
          encoding,
          callback
        ) {
          expect(chunk).to.deep.equal(CIRCULAR_REF_DOC);
          callback();
        });

        await pipeline([
          mockReadableStream,
          docStatsStream,
          mockWritableStream,
        ]);

        // Since the stringify will fail we will always have doc size set to 0
        expect(docStatsStream.getStats().biggestDocSize).to.equal(0);
      });
    });
  });
});
