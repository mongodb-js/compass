import generateStage from 'modules/stage';
import bson from 'bson';

describe('Stage module', () => {
  describe('invalid stage', () => {
    it('handles an empty stage', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: '$bucket',
        stage: '',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };
      expect(generateStage(stage)).to.deep.equal({});
    });
    it('ignores an invalid stage', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: null,
        stage: '{x: 1}',
        isValid: false,
        isEnabled: true,
        isExpanded: true
      };
      expect(generateStage(stage)).to.deep.equal({});
    });
    it('ignores a toggled stage', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: null,
        stage: '{x: 1}',
        isValid: true,
        isEnabled: false,
        isExpanded: true
      };
      expect(generateStage(stage)).to.deep.equal({});
    });
  });

  describe('#generateStage', () => {
    it('handles the default stage', () => {
      const stage = {
        id: new Date().getTime(),
        stageOperator: null,
        stage: '',
        isValid: true,
        isEnabled: true,
        isExpanded: true
      };
      expect(generateStage(stage)).to.deep.equal({});
    });
    it('handles a nested object', () => {
      const stage = {
        id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
        stageOperator: '$addFields',
        stage: '{\n       totalHomework: { $sum: "$homework" } ,\n       totalQuiz: { $sum: "$quiz" }\n  \n}'
      };
      expect(generateStage(stage)).to.deep.equal({
        '$addFields': {
          totalHomework: { $sum: '$homework' },
          totalQuiz: { $sum: '$quiz' }
        }
      });
    });
    it('handles multiple types', () => {
      const stage = {
        id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
        stageOperator: '$bucket',
        stage: '{\n     groupBy: "$price",\n     boundaries: [ 0, 200, 400 ],\n     default: "Other",\n     output: {\n       "count": { $sum: 1 },\n       "titles" : { $push: "$title" }\n     }\n   }'
      };
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
    it('handles constants', () => {
      const stage = {
        id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
        stageOperator: '$count',
        stage: '"fieldname"'
      };
      expect(generateStage(stage)).to.deep.equal({'$count': 'fieldname'});
    });
    it('handles BSON types', () => {
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
        '  minkey: MinKey(),\n' +
        '  maxkey: MaxKey(),\n' +
        '  isodate: ISODate(\'1999-01-01\'),\n' +
        '  regexp: RegExp(\'/^[a-z0-9_-]{3,16}$/\')\n' +
        '}'
      };
      expect(generateStage(stage)).to.deep.equal({
        '$match': {
          code: bson.Code('some code'),
          oid: bson.ObjectId('5a7382114ec1f67ae445f778'),
          bin: bson.Binary('aakjadfjadfldksjfadf', '1'),
          dbref: bson.DBRef('db.coll', '1'),
          nl: bson.Long('3'),
          nd: new bson.Decimal128.fromString('5.00000001'),
          minkey: bson.MinKey(),
          maxkey: bson.MaxKey(),
          isodate: new Date('1999-01-01'),
          regexp: new RegExp('/^[a-z0-9_-]{3,16}$/')
        }
      });
    });
    /* TODO: Problems
       Timestamp throws an error when not given arguments.
       NumberInt is just not implemented in query-parser
    */
    it('handles Timestamp', () => {
      // const stage = {
      //   id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
      //   stageOperator: '$match',
      //   stage: '"{\n' +
      //   '  ts: Timestamp(100)\n' +
      //   '}"'
      // };
      // expect(generateStage(stage)).to.deep.equal({
      //   '$match': {ts: bson.Timestamp(100)}
      // });
    });

    it('handles NumberInt', () => {
      // const stage = {
      //   id: 0, isEnabled: true, isExpanded: true, isValid: true, snippet: '',
      //   stageOperator: '$match',
      //   stage: '{\n  ni: NumberInt(1)\n}'
      // };
      // expect(generateStage(stage)).to.deep.equal({ni: 1});
    });
  });
});
