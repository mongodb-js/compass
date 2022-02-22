import reducer, {
  createPipeline,
  newPipelineFromText,
  closeImport,
  changeText,
  createNew,
  NEW_PIPELINE_FROM_TEXT,
  CLOSE_IMPORT,
  CHANGE_TEXT,
  CREATE_NEW
} from './import-pipeline';
import { expect } from 'chai';

describe('import pipeline module', function() {
  describe('#newPipelineFromText', function() {
    it('returns the action', function() {
      expect(newPipelineFromText()).to.deep.equal({
        type: NEW_PIPELINE_FROM_TEXT
      });
    });
  });

  describe('#closeImport', function() {
    it('returns the action', function() {
      expect(closeImport()).to.deep.equal({
        type: CLOSE_IMPORT
      });
    });
  });

  describe('#createNew', function() {
    it('returns the action', function() {
      expect(createNew()).to.deep.equal({
        type: CREATE_NEW
      });
    });
  });

  describe('#changeText', function() {
    it('returns the action', function() {
      expect(changeText('testing')).to.deep.equal({
        type: CHANGE_TEXT,
        text: 'testing'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is new pipeline from text', function() {
      it('sets isOpen to true', function() {
        expect(reducer(undefined, newPipelineFromText())).to.deep.equal({
          isOpen: true,
          text: '',
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is close import', function() {
      it('sets isOpen to false', function() {
        expect(reducer({ isOpen: true }, closeImport())).to.deep.equal({
          isOpen: false,
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is change text', function() {
      it('sets the text', function() {
        expect(reducer(undefined, changeText('testing'))).to.deep.equal({
          isOpen: false,
          text: 'testing',
          isConfirmationNeeded: false,
          syntaxError: null
        });
      });
    });

    context('when the action is create new', function() {
      it('sets the confirmation needed', function() {
        expect(reducer({ isOpen: true, text: '' }, createNew())).to.deep.equal({
          isOpen: false,
          text: '',
          isConfirmationNeeded: true
        });
      });
    });
  });

  describe('#createPipeline', function() {
    context('when the pipeline is a valid single stage', function() {
      context('when there is only one value', function() {
        const text = '[{ $match: { name: "testing" }}]';
        let pipeline;

        before(function() {
          pipeline = createPipeline(text)[0];
        });

        it('generates an id', function() {
          expect(pipeline.id).to.not.equal(null);
        });

        it('sets the correct stage operator', function() {
          expect(pipeline.stageOperator).to.equal('$match');
        });

        it('sets the stage', function() {
          expect(pipeline.stage).to.equal('{\n  name: "testing"\n}');
        });

        it('sets if the pipeline is valid', function() {
          expect(pipeline.isValid).to.equal(true);
        });

        it('sets is expanded to true', function() {
          expect(pipeline.isExpanded).to.equal(true);
        });

        it('sets is loading to false', function() {
          expect(pipeline.isLoading).to.equal(false);
        });

        it('sets is complete to false', function() {
          expect(pipeline.isComplete).to.equal(false);
        });

        it('sets the empty preview documents', function() {
          expect(pipeline.previewDocuments).to.deep.equal([]);
        });

        it('sets the syntax error', function() {
          expect(pipeline.syntaxError).to.equal(null);
        });

        it('sets the error to null', function() {
          expect(pipeline.syntaxError).to.equal(null);
        });
      });

      context('when there are multiple values', function() {
        const text = '[{ $match: { name: "testing", value: { $gt: 5 }}}]';
        let pipeline;

        before(function() {
          pipeline = createPipeline(text)[0];
        });

        it('generates an id', function() {
          expect(pipeline.id).to.not.equal(null);
        });

        it('sets the correct stage operator', function() {
          expect(pipeline.stageOperator).to.equal('$match');
        });

        it('sets the stage', function() {
          expect(pipeline.stage).to.equal('{\n  name: "testing",\n  value: {\n    $gt: 5\n  }\n}');
        });
      });

      context('when there are custom BSON types', function() {
        context('when the stage contains a NumberDecimal', function() {
          const text = '[{ $match: { value: NumberDecimal(\'123.45\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: NumberDecimal(\'123.45\')\n}');
          });
        });

        context('when the stage contains a Regexp object', function() {
          const text = '[{ $match: { value: RegExp(\'[a]\', \'g\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: RegExp(\'[a]\', \'g\')\n}');
          });
        });

        context('when the stage contains a Code object', function() {
          const text = '[{ $match: { value: Code(\'return true\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: Code(\'return true\')\n}');
          });
        });

        context('when the stage contains a NumberInt', function() {
          const text = '[{ $match: { value: NumberInt(5) }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: NumberInt(5)\n}');
          });
        });

        context('when the stage contains a NumberLong', function() {
          const text = '[{ $match: { value: NumberLong(5) }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: NumberLong(5)\n}');
          });
        });

        context('when the stage contains a DBRef object', function() {
          const text = '[{ $match: { value: DBRef(\'coll\', ObjectId(\'5b6833700633d61f36d3f09d\')) }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal(
              '{\n  value: DBRef(\'coll\', ObjectId(\'5b6833700633d61f36d3f09d\'))\n}'
            );
          });
        });

        context('when the stage contains a MinKey', function() {
          const text = '[{ $match: { value: MinKey() }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: MinKey()\n}');
          });
        });

        context('when the stage contains a MaxKey', function() {
          const text = '[{ $match: { value: MaxKey() }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  value: MaxKey()\n}');
          });
        });

        context('when the stage contains an object id', function() {
          const text = '[{ $match: { value: ObjectId(\'5b6833700633d61f36d3f09d\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal(
              '{\n  value: ObjectId(\'5b6833700633d61f36d3f09d\')\n}'
            );
          });
        });

        context('when the stage contains an iso date', function() {
          const text = '[{ $match: { value: ISODate(\'2004-01-01\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal(
              '{\n  value: ISODate(\'2004-01-01\')\n}'
            );
          });
        });

        context('when the stage contains a date', function() {
          const text = '[{ $match: { value: Date(\'2004-01-01\') }}]';
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal(
              '{\n  value: Date(\'2004-01-01\')\n}'
            );
          });
        });

        context('when the stages contain string keys with special characters', function() {
          const text = "[{$project: { 'COUNT(*)': '$COUNT(*)', 'MAX(age)': '$MAX(age)', 'MIN(age)': '$MIN(age)', _id: 0 }}]";
          let stage;

          before(function() {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', function() {
            expect(stage.stage).to.equal('{\n  \'COUNT(*)\': \'$COUNT(*)\',\n  \'MAX(age)\': \'$MAX(age)\',\n  \'MIN(age)\': \'$MIN(age)\',\n  _id: 0\n}');
          });
        });
      });
    });
  });
});
