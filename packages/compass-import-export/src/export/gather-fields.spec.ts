import { promisify } from 'util';
import { ObjectId } from 'bson';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';

temp.track();

import { gatherFields } from './gather-fields';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testNS = 'gather-fields-test.test-col';

const testDoc = {
  _id: new ObjectId(),
  author: 'test-pineapple',
  content: 'Message-ID',
  date: new Date(),
  emailData: {
    bcc: [],
    cc: [],
    dateSent: new Date(),
    folderPath: 'notes_inbox',
    from: 'test@mongodb.com',
    relativeFilePath: 'test',
    subject: '3 - URGENT - TO PREVENT LOSS OF INFORMATION',
    to: ['test@mongodb.com'],
    username: 'test-pineapple',
  },
  name: '3 - URGENT - TO PREVENT LOSS OF INFORMATION',
  dataset: 'Test Email Corpus',
  analysis: {
    comprehend: {
      keyPhrases: [
        {
          beginOffset: 2,
          endOffset: 32,
          score: 0.9801133871078491,
          text: 'Critical Migration Information',
        },
        {
          beginOffset: 35,
          endOffset: 36,
          score: 0.9828231930732727,
          text: '1',
        },
        {
          beginOffset: 38,
          endOffset: 75,
          score: 0.9618716239929199,
          text: 'Your scheduled Outlook Migration Date',
        },
        {
          beginOffset: 79,
          endOffset: 90,
          score: 0.9782861471176147,
          text: 'THE EVENING',
        },
        {
          beginOffset: 96,
          endOffset: 106,
          score: 0.9138829708099365,
          text: 'May 15th 2',
        },
        {
          beginOffset: 126,
          endOffset: 143,
          score: 0.8311862349510193,
          text: 'the "Save My Data',
        },
        {
          beginOffset: 145,
          endOffset: 151,
          score: 0.9614133238792419,
          text: 'button',
        },
        {
          beginOffset: 153,
          endOffset: 162,
          score: 0.6064049601554871,
          text: 'only once',
        },
        {
          beginOffset: 175,
          endOffset: 206,
          score: 0.9907944798469543,
          text: 'your  pre-migration information',
        },
        {
          beginOffset: 208,
          endOffset: 209,
          score: 0.970913827419281,
          text: '3',
        },
        {
          beginOffset: 236,
          endOffset: 247,
          score: 0.9991198182106018,
          text: 'the network',
        },
        {
          beginOffset: 265,
          endOffset: 275,
          score: 0.9944455027580261,
          text: 'the button',
        },
        {
          beginOffset: 277,
          endOffset: 278,
          score: 0.9433309435844421,
          text: '4',
        },
        {
          beginOffset: 283,
          endOffset: 295,
          score: 0.9702776074409485,
          text: 'a POP-UP BOX',
        },
        {
          beginOffset: 322,
          endOffset: 352,
          score: 0.8611568808555603,
          text: '"ABORT, CANCEL OR TRUST SIGNER',
        },
        {
          beginOffset: 370,
          endOffset: 382,
          score: 0.9448421001434326,
          text: 'TRUST SIGNER',
        },
        {
          beginOffset: 384,
          endOffset: 385,
          score: 0.9619488716125488,
          text: '5',
        },
        {
          beginOffset: 387,
          endOffset: 402,
          score: 0.9868628978729248,
          text: 'Any information',
        },
        {
          beginOffset: 414,
          endOffset: 440,
          score: 0.9584202766418457,
          text: 'your Personal Address Book',
        },
        {
          beginOffset: 442,
          endOffset: 461,
          score: 0.820638120174408,
          text: 'Journal or calendar',
        },
        {
          beginOffset: 482,
          endOffset: 492,
          score: 0.9989721775054932,
          text: 'the button',
        },
        {
          beginOffset: 532,
          endOffset: 539,
          score: 0.9980337023735046,
          text: 'Outlook',
        },
        {
          beginOffset: 571,
          endOffset: 572,
          score: 0.9880209565162659,
          text: '6',
        },
        {
          beginOffset: 583,
          endOffset: 594,
          score: 0.9972444176673889,
          text: 'this button',
        },
        {
          beginOffset: 613,
          endOffset: 627,
          score: 0.9981719851493835,
          text: 'your migration',
        },
        {
          beginOffset: 631,
          endOffset: 638,
          score: 0.9910996556282043,
          text: 'Outlook',
        },
        {
          beginOffset: 640,
          endOffset: 655,
          score: 0.9995373487472534,
          text: 'Your  migration',
        },
        {
          beginOffset: 675,
          endOffset: 686,
          score: 0.9996880292892456,
          text: 'the evening',
        },
        {
          beginOffset: 690,
          endOffset: 709,
          score: 0.9982566237449646,
          text: 'your migration date',
        },
        {
          beginOffset: 718,
          endOffset: 725,
          score: 0.7851428389549255,
          text: 'Failure',
        },
        {
          beginOffset: 738,
          endOffset: 748,
          score: 0.9842444062232971,
          text: 'the button',
        },
        {
          beginOffset: 772,
          endOffset: 785,
          score: 0.8071909546852112,
          text: 'your Calendar',
        },
        {
          beginOffset: 788,
          endOffset: 796,
          score: 0.9351513981819153,
          text: 'Contacts',
        },
        {
          beginOffset: 798,
          endOffset: 805,
          score: 0.6346553564071655,
          text: 'Journal',
        },
        {
          beginOffset: 810,
          endOffset: 826,
          score: 0.9847718477249146,
          text: 'ToDo information',
        },
        {
          beginOffset: 841,
          endOffset: 848,
          score: 0.8981707096099854,
          text: 'Outlook',
        },
        {
          beginOffset: 849,
          endOffset: 856,
          score: 0.9995452761650085,
          text: 'the day',
        },
        {
          beginOffset: 860,
          endOffset: 875,
          score: 0.9979895949363708,
          text: 'your  migration',
        },
        {
          beginOffset: 896,
          endOffset: 916,
          score: 0.798109769821167,
          text: 'up to a 2 week delay',
        },
        {
          beginOffset: 928,
          endOffset: 945,
          score: 0.9976459741592407,
          text: 'this  information',
        },
        {
          beginOffset: 965,
          endOffset: 975,
          score: 0.9922436475753784,
          text: 'any errors',
        },
        {
          beginOffset: 991,
          endOffset: 1012,
          score: 0.793780505657196,
          text: 'the resolution center',
        },
        {
          beginOffset: 1013,
          endOffset: 1028,
          score: 0.850317120552063,
          text: '@  phone number',
        },
      ],
      entities: [
        {
          beginOffset: 96,
          endOffset: 104,
          score: 0.9771835207939148,
          text: 'May 15th',
          type: 'DATE',
        },
        {
          beginOffset: 532,
          endOffset: 539,
          score: 0.8434097170829773,
          text: 'Outlook',
          type: 'TITLE',
        },
        {
          beginOffset: 631,
          endOffset: 638,
          score: 0.9702088236808777,
          text: 'Outlook',
          type: 'TITLE',
        },
        {
          beginOffset: 841,
          endOffset: 848,
          score: 0.9701331257820129,
          text: 'Outlook',
          type: 'TITLE',
        },
        {
          beginOffset: 904,
          endOffset: 910,
          score: 0.9733402132987976,
          text: '2 week',
          type: 'QUANTITY',
        },
        {
          beginOffset: 1016,
          endOffset: 1028,
          score: 0.9999939799308777,
          text: 'phone number',
          type: 'OTHER',
        },
      ],
    },
  },
};

// TODO(COMPASS-6426): Add more tests.
describe('gatherFields', function () {
  let dataService: DataService;
  let insertOne;

  // We insert documents only once for all of the tests.
  before(async function () {
    dataService = await connect({
      connectionString: 'mongodb://localhost:27018/local',
    });

    insertOne = promisify(dataService.insertOne.bind(dataService));

    try {
      await dataService.dropCollection(testNS);
    } catch (err) {
      // ignore
    }
    await dataService.createCollection(testNS, {});

    await insertOne(testNS, testDoc, {});
  });

  after(async function () {
    await dataService.disconnect();
  });

  it('returns the schema for a more complex example', async function () {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const paths = await gatherFields({
      abortSignal,
      progressCallback: () => {},
      ns: testNS,
      filter: {},
      sampleSize: 1000,
      dataService,
    });

    const expectedPaths = [
      ['_id'],
      ['analysis'],
      ['analysis', 'comprehend'],
      ['analysis', 'comprehend', 'entities'],
      ['analysis', 'comprehend', 'entities', 'beginOffset'],
      ['analysis', 'comprehend', 'entities', 'endOffset'],
      ['analysis', 'comprehend', 'entities', 'score'],
      ['analysis', 'comprehend', 'entities', 'text'],
      ['analysis', 'comprehend', 'entities', 'type'],
      ['analysis', 'comprehend', 'keyPhrases'],
      ['analysis', 'comprehend', 'keyPhrases', 'beginOffset'],
      ['analysis', 'comprehend', 'keyPhrases', 'endOffset'],
      ['analysis', 'comprehend', 'keyPhrases', 'score'],
      ['analysis', 'comprehend', 'keyPhrases', 'text'],
      ['author'],
      ['content'],
      ['dataset'],
      ['date'],
      ['emailData'],
      ['emailData', 'bcc'],
      ['emailData', 'cc'],
      ['emailData', 'dateSent'],
      ['emailData', 'folderPath'],
      ['emailData', 'from'],
      ['emailData', 'relativeFilePath'],
      ['emailData', 'subject'],
      ['emailData', 'to'],
      ['emailData', 'username'],
      ['name'],
    ];

    expect(paths).to.deep.equal(expectedPaths);
  });
});
