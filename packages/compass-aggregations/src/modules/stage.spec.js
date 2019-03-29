import { generateStage, generateStageAsString} from 'modules/stage';
import bson from 'bson';

describe('Stage module', () => {
  describe('#generateStage + #generateStageAsString', () => {
    context('when the stage text is empty', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: '$bucket',
        stage: '',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };

      it('returns an empty object', () => {
        expect(generateStage(stage)).to.deep.equal({});
      });
      it('returns an empty object string', () => {
        expect(generateStageAsString(stage)).to.equal('{}');
      });
    });

    context('when the stage has no operator', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: null,
        stage: '{x: 1}',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };

      it('returns an empty object', () => {
        expect(generateStage(stage)).to.deep.equal({});
      });
      it('returns an empty object string', () => {
        expect(generateStageAsString(stage)).to.equal('{}');
      });
    });

    context('when the stage is not enabled', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: null,
        stage: '{x: 1}',
        isValid: true,
        isEnabled: false,
        isExpanded: true
      };

      it('returns an empty object', () => {
        expect(generateStage(stage)).to.deep.equal({});
      });
      it('returns an empty object string', () => {
        expect(generateStageAsString(stage)).to.equal('{}');
      });
    });

    context('when the stage syntax is invalid', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: '$match',
        stage: '{ query }',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };

      before(() => {
        generateStage(stage);
      });

      it('sets isValid to false', () => {
        expect(stage.isValid).to.equal(false);
      });

      it('sets the syntax error', () => {
        expect(stage.syntaxError).to.equal('Expected "[" or AggregationStage but "{" found.');
      });
    });

    context('when the stage syntax is invalid for #generateStageAsString', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: '$match',
        stage: '{ query }',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };

      before(() => {
        expect(generateStageAsString(stage)).to.equal('{}');
      });

      it('sets isValid to false', () => {
        expect(stage.isValid).to.equal(false);
      });

      it('sets the syntax error', () => {
        expect(stage.syntaxError).to.equal('Expected "[" or AggregationStage but "{" found.');
      });
    });

    context('when the stage contains comments', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: '$match',
        stage: '/* testing */{x: 1}',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };

      it('returns the decommented stage', () => {
        expect(generateStage(stage)).to.deep.equal({ '$match': { x: 1 }});
      });
      it('returns the decommented string', () => {
        expect(generateStageAsString(stage)).to.deep.equal('{$match: {x: 1}}');
      });
    });

    context('when the stage has an embedded document', () => {
      const stage = {
        id: 0,
        isEnabled: true,
        isExpanded: true,
        isValid: true,
        snippet: '',
        stageOperator: '$addFields',
        stage: '{\n       totalHomework: { $sum: "$homework" } ,\n       totalQuiz: { $sum: "$quiz" }\n  \n}'
      };

      it('returns the stage', () => {
        expect(generateStage(stage)).to.deep.equal({
          '$addFields': {
            totalHomework: { $sum: '$homework' },
            totalQuiz: { $sum: '$quiz' }
          }
        });
      });
      it('returns the stage string', () => {
        expect(generateStageAsString(stage)).to.deep.equal(`{$addFields: {
       totalHomework: { $sum: "$homework" } ,
       totalQuiz: { $sum: "$quiz" }

  }}`
        );
      });
    });

    describe('when the stage is $project', () => {
      const stage = {
        id: 0,
        isEnabled: true,
        isExpanded: true,
        isValid: true,
        snippet: '',
        stageOperator: '$project',
        stage: '{_id: 0, avg_price: {$avg: "$price"}}'
      };
      const res = generateStage(stage);
      it('returns the stage', () => {
        expect(res).to.deep.equal({
          '$project': {
            _id: 0,
            avg_price: {
              $avg: '$price'
            }
          }
        });
      });
      it('does not include dropped projections', () => {
        expect(stage.projections.length).to.equal(1);
      });
      it('detects the avg_price projection', () => {
        expect(stage.projections[0].name).to.equal('avg_price');
      });
    });

    context('when the stage has multiple types', () => {
      const stage = {
        id: 0,
        isEnabled: true,
        isExpanded: true,
        isValid: true,
        snippet: '',
        stageOperator: '$bucket',
        stage: '{\n     groupBy: "$price",\n     boundaries: [ 0, 200, 400 ],\n     default: "Other",\n     output: {\n       "count": { $sum: 1 },\n       "titles" : { $push: "$title" }\n     }\n   }'
      };

      it('returns the stage', () => {
        expect(generateStage(stage)).to.deep.equal({
          '$bucket': {
            groupBy: '$price',
            boundaries: [ 0, 200, 400 ],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              titles: { $push: '$title' }
            }
          }
        });
      });
      it('returns the stage string', () => {
        expect(generateStageAsString(stage)).to.deep.equal(`{$bucket: {
     groupBy: "$price",
     boundaries: [ 0, 200, 400 ],
     default: "Other",
     output: {
       "count": { $sum: 1 },
       "titles" : { $push: "$title" }
     }
   }}`);
      });
    });

    context('when the stage text is a string', () => {
      const stage = {
        id: 0,
        isEnabled: true,
        isExpanded: true,
        isValid: true,
        snippet: '',
        stageOperator: '$count',
        stage: '"fieldname"'
      };

      it('returns the stage', () => {
        expect(generateStage(stage)).to.deep.equal({'$count': 'fieldname'});
      });
      it('returns the stage string', () => {
        expect(generateStageAsString(stage)).to.deep.equal('{$count: "fieldname"}');
      });
    });

    context('when the stage has BSON types', () => {
      const stage = {
        id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
        stageOperator: '$match',
        stage: '{\n' +
        '  code: Code(\'some code\'),\n' +
        '  oid: ObjectId(\'5a7382114ec1f67ae445f778\'),\n' +
        '  bin: Binary(\'aakjadfjadfldksjfadf\', \'1\'),\n' +
        '  dbref: DBRef(\'db.coll\', \'1\'),\n' +
        '  nl: NumberLong(\'3\'),\n' +
        '  nd: NumberDecimal(\'5.00000001\'),\n' +
        '  ni: NumberInt(\'5\'),\n' +
        '  minkey: MinKey(),\n' +
        '  maxkey: MaxKey(),\n' +
        '  isodate: ISODate(\'1999-01-01\'),\n' +
        '  regexp: RegExp(\'/^[a-z0-9_-]{3,16}$/\'),\n' +
        '  ts: Timestamp(10, 100)\n' +
        '}'
      };
      let generated;

      before(() => {
        generated = generateStage(stage).$match;
      });

      it('generates code', () => {
        expect(generated.code.code).to.equal('some code');
      });

      it('generates object id', () => {
        expect(generated.oid.toString()).to.equal('5a7382114ec1f67ae445f778');
      });

      it('generates binary', () => {
        expect(generated.bin.sub_type).to.equal('1');
      });

      it('generates dbrefs', () => {
        expect(generated.dbref.namespace).to.equal('db.coll');
      });

      it('generates number long', () => {
        expect(generated.nl.toNumber()).to.equal(3);
      });

      it('generates number decimal', () => {
        expect(generated.nd.toString()).to.equal('5.00000001');
      });

      it('generates number int', () => {
        expect(generated.ni).to.equal(5);
      });

      it('generates min key', () => {
        expect(generated.minkey._bsontype).to.deep.equal(new bson.MinKey()._bsontype);
      });

      it('generates max key', () => {
        expect(generated.maxkey._bsontype).to.deep.equal(new bson.MaxKey()._bsontype);
      });

      it('generates isodate', () => {
        expect(generated.isodate).to.deep.equal(new Date('1999-01-01'));
      });

      it('generates regexp', () => {
        expect(generated.regexp).to.deep.equal(new RegExp('/^[a-z0-9_-]{3,16}$/'));
      });

      it('generates timestamp', () => {
        expect(generated.ts.low_).to.equal(10);
      });
      it('returns the stage string', () => {
        expect(generateStageAsString(stage)).to.deep.equal(`{$match: {
  code: Code('some code'),
  oid: ObjectId('5a7382114ec1f67ae445f778'),
  bin: Binary('aakjadfjadfldksjfadf', '1'),
  dbref: DBRef('db.coll', '1'),
  nl: NumberLong('3'),
  nd: NumberDecimal('5.00000001'),
  ni: NumberInt('5'),
  minkey: MinKey(),
  maxkey: MaxKey(),
  isodate: ISODate('1999-01-01'),
  regexp: RegExp('/^[a-z0-9_-]{3,16}$/'),
  ts: Timestamp(10, 100)
}}`);
      });
    });
  });
});
