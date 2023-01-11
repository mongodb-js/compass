import sinon from 'sinon';
import bson from 'bson';
import { expect } from 'chai';
import { analyzeSchema } from './schema-analysis';

function schemaToPaths(fields, parent = []) {
  const paths = [];

  for (const field of fields) {
    const path = [...parent, field.name];
    paths.push(path);

    // recurse on doc
    const doc = field.types.find((f) => f.bsonType === 'Document');
    if (doc) {
      paths.push(...schemaToPaths(doc.fields, path));
    }

    // recurse on array
    const array = field.types.find((f) => f.bsonType === 'Array');
    if (array) {
      const arrayDoc = array.types.find((f) => f.bsonType === 'Document');
      if (arrayDoc) {
        //paths.push(...schemaToPaths(arrayDoc.fields, [...path, '*']));
        paths.push(...schemaToPaths(arrayDoc.fields, path));
      }
    }
  }

  return paths;
}

describe('schema-analyis', function () {
  describe('getResult', function () {
    it('returns the schema', async function () {
      const dataService = {
        sample: () =>
          Promise.resolve([
            { x: 1 },
            { y: 2, __safeContent__: [new bson.Binary('aaaa')] },
          ]),
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      );

      const expectedSchema = {
        fields: [
          {
            name: 'x',
            path: 'x',
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: 'x',
                count: 1,
                values: [1],
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
              {
                name: 'Undefined',
                type: 'Undefined',
                path: 'x',
                count: 1,
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
            ],
            total_count: 2,
            type: ['Number', 'Undefined'],
            has_duplicates: false,
            probability: 0.5,
          },
          {
            name: 'y',
            path: 'y',
            count: 1,
            types: [
              {
                name: 'Number',
                bsonType: 'Number',
                path: 'y',
                count: 1,
                values: [2],
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
              {
                name: 'Undefined',
                type: 'Undefined',
                path: 'y',
                count: 1,
                total_count: 0,
                probability: 0.5,
                unique: 1,
                has_duplicates: false,
              },
            ],
            total_count: 2,
            type: ['Number', 'Undefined'],
            has_duplicates: false,
            probability: 0.5,
          },
        ],
        count: 2,
      };

      expect(schema).to.deep.equal(expectedSchema);
    });

    it('adds promoteValues: false so the analyzer can report more accurate types', async function () {
      const dataService = {
        sample: sinon.spy(() => Promise.resolve([])),
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      await analyzeSchema(dataService, abortSignal, 'db.coll', {}, {});

      expect(dataService.sample).to.have.been.calledWith(
        'db.coll',
        {},
        { promoteValues: false }
      );
    });

    it('returns null if is cancelled', async function () {
      const dataService = {
        sample: () => {
          throw new Error();
        },
        isCancelError: () => true,
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const getResultPromise = analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      );

      expect(await getResultPromise).to.equal(null);
    });

    it('throws if sample throws', async function () {
      let rejectOnSample;
      const dataService = {
        sample: () =>
          new Promise((_, _reject) => {
            rejectOnSample = _reject;
          }),
        isCancelError: () => false,
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const getResultPromise = analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      ).catch((err) => err);

      const error = new Error('should have been thrown');
      error.name = 'MongoError';
      error.code = new bson.Int32(1000);

      rejectOnSample(error);

      expect((await getResultPromise).message).to.equal(
        'should have been thrown'
      );
      expect((await getResultPromise).code).to.equal(1000);
    });

    it.only('returns the schema for a complex example', async function () {
       const dataService = {
        sample: () =>
          Promise.resolve([
            { foo: 1 },
            { foo: [1, 2, 3] },
            { foo: { bar: 1 } },
            { foo: { bar: { baz: 1 } } },

            { array: [{ monkey: 1}, { banana: 1 }] }
          ]),
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      );

      console.dir(schema, { depth: Infinity });

      const paths = schemaToPaths(schema.fields);
      console.dir(paths, { depth: Infinity });

      /*
        [
          [ 'array' ],
          [ 'array', 'banana' ],
          [ 'array', 'monkey' ],
          [ 'foo' ],
          [ 'foo', 'bar' ],
          [ 'foo', 'bar', 'baz' ]
        ]
      */
    });

    it.only('returns the schema for a more complex example', async function () {
      const doc = {
        "_id": new bson.ObjectId(),
        "author": "arnold-j",
        "content": "Message-ID: <1304703.1075857631406.JavaMail.evans@thyme>\r\nDate: Fri, 11 May 2001 08:56:00 -0700 (PDT)\r\nFrom: outlook.team@enron.com\r\nTo: aimee.shek@enron.com, albino.lopez@enron.com, andrea.williams@enron.com, \r\n\tanitha.mathis@enron.com, antonette.concepcion@enron.com, \r\n\tbernard.rhoden@enron.com, deborah.kallus@enron.com, \r\n\tdiane.taylor@enron.com, gardenia.sullivan@enron.com, \r\n\tginger.sinclair@enron.com, janice.priddy@enron.com, \r\n\tjeanne.seward@enron.com, lloyd.whiteurst@enron.com, \r\n\tmonique.criswell@enron.com, monique.mcfarland@enron.com, \r\n\tpauline.sanchez@enron.com, rena.lo@enron.com, shawn.simon@enron.com, \r\n\tvalley.confer@enron.com, cynthia.barrow@enron.com, \r\n\tdeborah.guillory@enron.com, dinah.sultanik@enron.com, \r\n\tgeorgia.fogo@enron.com, ginger.mccain@enron.com, \r\n\tiris.jimenez@enron.com, jennifer.mendez@enron.com, \r\n\tjohn.cevilla@enron.com, joshua.wooten@enron.com, \r\n\tkarla.dobbs@enron.com, kayla.ruiz@enron.com, lee.wright@enron.com, \r\n\tmaria.mitchell@enron.com, mikie.rath@enron.com, \r\n\trobin.hosea@enron.com, sandy.huseman@enron.com, \r\n\tsheri.jordan@enron.com, tashia.hayes@enron.com, \r\n\tdonna.greif@enron.com, eric.gonzales@enron.com, \r\n\tjared.kaiser@enron.com, jonathan.whitehead@enron.com, \r\n\tomar.aboudaher@enron.com, paul.omasits@enron.com, \r\n\tshahnaz.lakho@enron.com, troy.denetsosie@enron.com, \r\n\twilliam.giuliani@enron.com, zionette.vincent@enron.com, \r\n\tadrial.boals@enron.com, albert.escamilla@enron.com, \r\n\tamber.ebow@enron.com, avril.forster@enron.com, \r\n\tbernice.rodriguez@enron.com, bill.hare@enron.com, \r\n\tbrian.heinrich@enron.com, cheryl.johnson@enron.com, \r\n\tchristopher.hargett@enron.com, dejoun.windless@enron.com, \r\n\tdonna.consemiu@enron.com, donna.everett@enron.com, \r\n\tgloria.roberson@enron.com, james.scribner@enron.com, \r\n\tjason.moore@enron.com, jean.killough@enron.com, jeff.klotz@enron.com, \r\n\tjenny.helton@enron.com, john.harrison@enron.com, \r\n\tjulissa.marron@enron.com, karen.lambert@enron.com, \r\n\tkathryn.pallant@enron.com, kelly.lombardi@enron.com, \r\n\tkevin.richardson@enron.com, lisa.woods@enron.com, \r\n\tmarilyn.colbert@enron.com, michelle.laurant@enron.com, \r\n\tremi.otegbola@enron.com, ruby.kyser@enron.com, \r\n\tsamuel.schott@enron.com, stacie.guidry@enron.com, \r\n\tsteve.venturatos@enron.com, suzanne.nicholie@enron.com, \r\n\ttammie.huthmacher@enron.com, willie.harrell@enron.com, \r\n\talexandra.villarreal@enron.com, daniel.quezada@enron.com, \r\n\tdutch.quigley@enron.com, ina.rangel@enron.com, jason.panos@enron.com, \r\n\tjesus.hernandez@enron.com, john.arnold@enron.com, \r\n\tjohn.griffith@enron.com, kimberly.hardy@enron.com, \r\n\tlarry.may@enron.com, mike.maggi@enron.com, steve.dailey@enron.com\r\nSubject: 3 - URGENT - TO PREVENT LOSS OF INFORMATION\r\nMime-Version: 1.0\r\nContent-Type: text/plain; charset=us-ascii\r\nContent-Transfer-Encoding: 7bit\r\nX-From: Outlook Migration Team\r\nX-To: Aimee Shek, Albino Lopez, Andrea Williams, Anitha Mathis, Antonette Concepcion, Bernard Rhoden, Deborah Kallus, Diane Taylor, Gardenia Sullivan, Ginger Sinclair, Janice Priddy, Jeanne Seward, Lloyd Whiteurst, Monique Criswell, Monique McFarland, Pauline Sanchez, Rena Lo, Shawn Simon, Valley Confer, Cynthia Barrow, Deborah Guillory, Dinah Sultanik, Georgia Fogo, Ginger McCain, Iris Jimenez, Jennifer Mendez, John Cevilla, Joshua Wooten, Karla Dobbs, Kayla Ruiz, Lee Wright, Maria Mitchell, Mikie Rath, Robin Hosea, Sandy Huseman, Sheri Jordan, Tashia Hayes, Donna Greif, Eric Gonzales, Jared Kaiser, Jonathan Whitehead, Omar Aboudaher, Paul Omasits, Shahnaz Lakho, Troy Denetsosie, William Giuliani, Zionette Vincent, Adrial Boals, Albert Escamilla, Amber Ebow, Avril Forster, Bernice Rodriguez, Bill D Hare, Brian Heinrich, Cheryl Johnson, Christopher Hargett, Dejoun Windless, Donna Consemiu, Donna Everett, Gloria Roberson, James Scribner, Jason Moore, Jean Killough, Jeff Klotz, Jenny Helton, John Howard Harrison, Julissa Marron, Karen Lambert, Kathryn Pallant, Kelly Lombardi, Kevin Richardson, Lisa Woods, Marilyn Colbert, Michelle Laurant, Remi Otegbola, Ruby Kyser, Samuel Schott, Stacie Guidry, Steve Venturatos, Suzanne Nicholie, Tammie Huthmacher, Willie Harrell, Alexandra Villarreal, Daniel Quezada, Dutch Quigley, Ina Rangel, Jason Panos, Jesus A Hernandez, John Arnold, John Griffith, Kimberly Hardy, Larry May, Mike Maggi, Steve Dailey\r\nX-cc: \r\nX-bcc: \r\nX-Folder: \\John_Arnold_Jun2001\\Notes Folders\\Notes inbox\r\nX-Origin: Arnold-J\r\nX-FileName: Jarnold.nsf\r\n\r\nCritical Migration Information:\n\n1. Your scheduled Outlook Migration Date is THE EVENING OF : May 15th\n2. You need to press the \"Save My Data\" button (only once) to send us your \npre-migration information.\n3. You must be connected to the network before you press the button.\n4. If a POP-UP BOX appears, prompting you to \"ABORT, CANCEL OR TRUST SIGNER\" \nplease  select TRUST SIGNER.\n5. Any information you Add to your Personal Address Book, Journal or calendar \nafter you click on the button will need to be manually re-added into Outlook \nafter you have been migrated.\n6. Clicking this button does not complete your migration to Outlook. Your \nmigration will be completed  the evening of your migration date.\n\n\n\n    Failure to click on the button means you WILL NOT get your Calendar, \nContacts, Journal and ToDo information imported into Outlook the day of your \nmigration and could result in up to a 2 week delay to restore this \ninformation.\n\nIf you encounter any errors please contact the resolution center @ \n713-853-1411 ",
        "date": new Date(),
        "emailData": {
          "bcc": [],
          "cc": [],
          "dateSent": new Date(),
          "folderPath": "notes_inbox",
          "from": "outlook.team@enron.com",
          "relativeFilePath": "arnold-j/notes_inbox/76.",
          "subject": "3 - URGENT - TO PREVENT LOSS OF INFORMATION",
          "to": [
            "aimee.shek@enron.com",
            "albino.lopez@enron.com",
            "andrea.williams@enron.com",
            "anitha.mathis@enron.com",
            "antonette.concepcion@enron.com",
            "bernard.rhoden@enron.com",
            "deborah.kallus@enron.com",
            "diane.taylor@enron.com",
            "gardenia.sullivan@enron.com",
            "ginger.sinclair@enron.com",
            "janice.priddy@enron.com",
            "jeanne.seward@enron.com",
            "lloyd.whiteurst@enron.com",
            "monique.criswell@enron.com",
            "monique.mcfarland@enron.com",
            "pauline.sanchez@enron.com",
            "rena.lo@enron.com",
            "shawn.simon@enron.com",
            "valley.confer@enron.com",
            "cynthia.barrow@enron.com",
            "deborah.guillory@enron.com",
            "dinah.sultanik@enron.com",
            "georgia.fogo@enron.com",
            "ginger.mccain@enron.com",
            "iris.jimenez@enron.com",
            "jennifer.mendez@enron.com",
            "john.cevilla@enron.com",
            "joshua.wooten@enron.com",
            "karla.dobbs@enron.com",
            "kayla.ruiz@enron.com",
            "lee.wright@enron.com",
            "maria.mitchell@enron.com",
            "mikie.rath@enron.com",
            "robin.hosea@enron.com",
            "sandy.huseman@enron.com",
            "sheri.jordan@enron.com",
            "tashia.hayes@enron.com",
            "donna.greif@enron.com",
            "eric.gonzales@enron.com",
            "jared.kaiser@enron.com",
            "jonathan.whitehead@enron.com",
            "omar.aboudaher@enron.com",
            "paul.omasits@enron.com",
            "shahnaz.lakho@enron.com",
            "troy.denetsosie@enron.com",
            "william.giuliani@enron.com",
            "zionette.vincent@enron.com",
            "adrial.boals@enron.com",
            "albert.escamilla@enron.com",
            "amber.ebow@enron.com",
            "avril.forster@enron.com",
            "bernice.rodriguez@enron.com",
            "bill.hare@enron.com",
            "brian.heinrich@enron.com",
            "cheryl.johnson@enron.com",
            "christopher.hargett@enron.com",
            "dejoun.windless@enron.com",
            "donna.consemiu@enron.com",
            "donna.everett@enron.com",
            "gloria.roberson@enron.com",
            "james.scribner@enron.com",
            "jason.moore@enron.com",
            "jean.killough@enron.com",
            "jeff.klotz@enron.com",
            "jenny.helton@enron.com",
            "john.harrison@enron.com",
            "julissa.marron@enron.com",
            "karen.lambert@enron.com",
            "kathryn.pallant@enron.com",
            "kelly.lombardi@enron.com",
            "kevin.richardson@enron.com",
            "lisa.woods@enron.com",
            "marilyn.colbert@enron.com",
            "michelle.laurant@enron.com",
            "remi.otegbola@enron.com",
            "ruby.kyser@enron.com",
            "samuel.schott@enron.com",
            "stacie.guidry@enron.com",
            "steve.venturatos@enron.com",
            "suzanne.nicholie@enron.com",
            "tammie.huthmacher@enron.com",
            "willie.harrell@enron.com",
            "alexandra.villarreal@enron.com",
            "daniel.quezada@enron.com",
            "dutch.quigley@enron.com",
            "ina.rangel@enron.com",
            "jason.panos@enron.com",
            "jesus.hernandez@enron.com",
            "john.arnold@enron.com",
            "john.griffith@enron.com",
            "kimberly.hardy@enron.com",
            "larry.may@enron.com",
            "mike.maggi@enron.com",
            "steve.dailey@enron.com"
          ],
          "username": "arnold-j"
        },
        "name": "3 - URGENT - TO PREVENT LOSS OF INFORMATION",
        "dataset": "Enron Email Corpus",
        "analysis": {
          "comprehend": {
            "keyPhrases": [
              {
                "beginOffset": 2,
                "endOffset": 32,
                "score": 0.9801133871078491,
                "text": "Critical Migration Information"
              },
              {
                "beginOffset": 35,
                "endOffset": 36,
                "score": 0.9828231930732727,
                "text": "1"
              },
              {
                "beginOffset": 38,
                "endOffset": 75,
                "score": 0.9618716239929199,
                "text": "Your scheduled Outlook Migration Date"
              },
              {
                "beginOffset": 79,
                "endOffset": 90,
                "score": 0.9782861471176147,
                "text": "THE EVENING"
              },
              {
                "beginOffset": 96,
                "endOffset": 106,
                "score": 0.9138829708099365,
                "text": "May 15th 2"
              },
              {
                "beginOffset": 126,
                "endOffset": 143,
                "score": 0.8311862349510193,
                "text": "the \"Save My Data"
              },
              {
                "beginOffset": 145,
                "endOffset": 151,
                "score": 0.9614133238792419,
                "text": "button"
              },
              {
                "beginOffset": 153,
                "endOffset": 162,
                "score": 0.6064049601554871,
                "text": "only once"
              },
              {
                "beginOffset": 175,
                "endOffset": 206,
                "score": 0.9907944798469543,
                "text": "your  pre-migration information"
              },
              {
                "beginOffset": 208,
                "endOffset": 209,
                "score": 0.970913827419281,
                "text": "3"
              },
              {
                "beginOffset": 236,
                "endOffset": 247,
                "score": 0.9991198182106018,
                "text": "the network"
              },
              {
                "beginOffset": 265,
                "endOffset": 275,
                "score": 0.9944455027580261,
                "text": "the button"
              },
              {
                "beginOffset": 277,
                "endOffset": 278,
                "score": 0.9433309435844421,
                "text": "4"
              },
              {
                "beginOffset": 283,
                "endOffset": 295,
                "score": 0.9702776074409485,
                "text": "a POP-UP BOX"
              },
              {
                "beginOffset": 322,
                "endOffset": 352,
                "score": 0.8611568808555603,
                "text": "\"ABORT, CANCEL OR TRUST SIGNER"
              },
              {
                "beginOffset": 370,
                "endOffset": 382,
                "score": 0.9448421001434326,
                "text": "TRUST SIGNER"
              },
              {
                "beginOffset": 384,
                "endOffset": 385,
                "score": 0.9619488716125488,
                "text": "5"
              },
              {
                "beginOffset": 387,
                "endOffset": 402,
                "score": 0.9868628978729248,
                "text": "Any information"
              },
              {
                "beginOffset": 414,
                "endOffset": 440,
                "score": 0.9584202766418457,
                "text": "your Personal Address Book"
              },
              {
                "beginOffset": 442,
                "endOffset": 461,
                "score": 0.820638120174408,
                "text": "Journal or calendar"
              },
              {
                "beginOffset": 482,
                "endOffset": 492,
                "score": 0.9989721775054932,
                "text": "the button"
              },
              {
                "beginOffset": 532,
                "endOffset": 539,
                "score": 0.9980337023735046,
                "text": "Outlook"
              },
              {
                "beginOffset": 571,
                "endOffset": 572,
                "score": 0.9880209565162659,
                "text": "6"
              },
              {
                "beginOffset": 583,
                "endOffset": 594,
                "score": 0.9972444176673889,
                "text": "this button"
              },
              {
                "beginOffset": 613,
                "endOffset": 627,
                "score": 0.9981719851493835,
                "text": "your migration"
              },
              {
                "beginOffset": 631,
                "endOffset": 638,
                "score": 0.9910996556282043,
                "text": "Outlook"
              },
              {
                "beginOffset": 640,
                "endOffset": 655,
                "score": 0.9995373487472534,
                "text": "Your  migration"
              },
              {
                "beginOffset": 675,
                "endOffset": 686,
                "score": 0.9996880292892456,
                "text": "the evening"
              },
              {
                "beginOffset": 690,
                "endOffset": 709,
                "score": 0.9982566237449646,
                "text": "your migration date"
              },
              {
                "beginOffset": 718,
                "endOffset": 725,
                "score": 0.7851428389549255,
                "text": "Failure"
              },
              {
                "beginOffset": 738,
                "endOffset": 748,
                "score": 0.9842444062232971,
                "text": "the button"
              },
              {
                "beginOffset": 772,
                "endOffset": 785,
                "score": 0.8071909546852112,
                "text": "your Calendar"
              },
              {
                "beginOffset": 788,
                "endOffset": 796,
                "score": 0.9351513981819153,
                "text": "Contacts"
              },
              {
                "beginOffset": 798,
                "endOffset": 805,
                "score": 0.6346553564071655,
                "text": "Journal"
              },
              {
                "beginOffset": 810,
                "endOffset": 826,
                "score": 0.9847718477249146,
                "text": "ToDo information"
              },
              {
                "beginOffset": 841,
                "endOffset": 848,
                "score": 0.8981707096099854,
                "text": "Outlook"
              },
              {
                "beginOffset": 849,
                "endOffset": 856,
                "score": 0.9995452761650085,
                "text": "the day"
              },
              {
                "beginOffset": 860,
                "endOffset": 875,
                "score": 0.9979895949363708,
                "text": "your  migration"
              },
              {
                "beginOffset": 896,
                "endOffset": 916,
                "score": 0.798109769821167,
                "text": "up to a 2 week delay"
              },
              {
                "beginOffset": 928,
                "endOffset": 945,
                "score": 0.9976459741592407,
                "text": "this  information"
              },
              {
                "beginOffset": 965,
                "endOffset": 975,
                "score": 0.9922436475753784,
                "text": "any errors"
              },
              {
                "beginOffset": 991,
                "endOffset": 1012,
                "score": 0.793780505657196,
                "text": "the resolution center"
              },
              {
                "beginOffset": 1013,
                "endOffset": 1028,
                "score": 0.850317120552063,
                "text": "@  713-853-1411"
              }
            ],
            "entities": [
              {
                "beginOffset": 96,
                "endOffset": 104,
                "score": 0.9771835207939148,
                "text": "May 15th",
                "type": "DATE"
              },
              {
                "beginOffset": 532,
                "endOffset": 539,
                "score": 0.8434097170829773,
                "text": "Outlook",
                "type": "TITLE"
              },
              {
                "beginOffset": 631,
                "endOffset": 638,
                "score": 0.9702088236808777,
                "text": "Outlook",
                "type": "TITLE"
              },
              {
                "beginOffset": 841,
                "endOffset": 848,
                "score": 0.9701331257820129,
                "text": "Outlook",
                "type": "TITLE"
              },
              {
                "beginOffset": 904,
                "endOffset": 910,
                "score": 0.9733402132987976,
                "text": "2 week",
                "type": "QUANTITY"
              },
              {
                "beginOffset": 1016,
                "endOffset": 1028,
                "score": 0.9999939799308777,
                "text": "713-853-1411",
                "type": "OTHER"
              }
            ]
          }
        }
      };

      const dataService = {
        sample: () =>
          Promise.resolve([
            doc
          ]),
      };

      const abortController = new AbortController();
      const abortSignal = abortController.signal;

      const schema = await analyzeSchema(
        dataService,
        abortSignal,
        'db.coll',
        {},
        {}
      );

      //console.dir(schema, { depth: Infinity });

      const paths = schemaToPaths(schema.fields);
      console.dir(paths, { depth: Infinity });

      /*
      [
        [ '_id' ],
        [ 'analysis' ],
        [ 'analysis', 'comprehend' ],
        [ 'analysis', 'comprehend', 'entities' ],
        [ 'analysis', 'comprehend', 'entities', 'beginOffset' ],
        [ 'analysis', 'comprehend', 'entities', 'endOffset' ],
        [ 'analysis', 'comprehend', 'entities', 'score' ],
        [ 'analysis', 'comprehend', 'entities', 'text' ],
        [ 'analysis', 'comprehend', 'entities', 'type' ],
        [ 'analysis', 'comprehend', 'keyPhrases' ],
        [ 'analysis', 'comprehend', 'keyPhrases', 'beginOffset' ],
        [ 'analysis', 'comprehend', 'keyPhrases', 'endOffset' ],
        [ 'analysis', 'comprehend', 'keyPhrases', 'score' ],
        [ 'analysis', 'comprehend', 'keyPhrases', 'text' ],
        [ 'author' ],
        [ 'content' ],
        [ 'dataset' ],
        [ 'date' ],
        [ 'emailData' ],
        [ 'emailData', 'bcc' ],
        [ 'emailData', 'cc' ],
        [ 'emailData', 'dateSent' ],
        [ 'emailData', 'folderPath' ],
        [ 'emailData', 'from' ],
        [ 'emailData', 'relativeFilePath' ],
        [ 'emailData', 'subject' ],
        [ 'emailData', 'to' ],
        [ 'emailData', 'username' ],
        [ 'name' ]
      ]
      */
    });
  });
});
