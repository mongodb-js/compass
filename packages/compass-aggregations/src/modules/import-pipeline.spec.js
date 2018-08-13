import reducer, {
  createPipeline,
  newPipelineFromText,
  closeImport,
  changeText,
  NEW_PIPELINE_FROM_TEXT,
  CLOSE_IMPORT,
  CHANGE_TEXT
} from 'modules/import-pipeline';

describe('import pipeline module', () => {
  describe('#newPipelineFromText', () => {
    it('returns the action', () => {
      expect(newPipelineFromText()).to.deep.equal({
        type: NEW_PIPELINE_FROM_TEXT
      });
    });
  });

  describe('#closeImport', () => {
    it('returns the action', () => {
      expect(closeImport()).to.deep.equal({
        type: CLOSE_IMPORT
      });
    });
  });

  describe('#changeText', () => {
    it('returns the action', () => {
      expect(changeText('testing')).to.deep.equal({
        type: CHANGE_TEXT,
        text: 'testing'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is new pipeline from text', () => {
      it('sets isOpen to true', () => {
        expect(reducer(undefined, newPipelineFromText())).to.deep.equal({
          isOpen: true,
          text: '',
          isConfirmationNeeded: false
        });
      });
    });

    context('when the action is close import', () => {
      it('sets isOpen to false', () => {
        expect(reducer({ isOpen: true }, closeImport())).to.deep.equal({
          isOpen: false
        });
      });
    });

    context('when the action is change text', () => {
      it('sets the text', () => {
        expect(reducer(undefined, changeText('testing'))).to.deep.equal({
          isOpen: false,
          text: 'testing',
          isConfirmationNeeded: false
        });
      });
    });
  });

  describe('#createPipeline', () => {
    context('when the pipeline is a valid single stage', () => {
      context('when there is only one value', () => {
        const text = '[{ $match: { name: "testing" }}]';
        let pipeline;

        before(() => {
          pipeline = createPipeline(text)[0];
        });

        it('generates an id', () => {
          expect(pipeline.id).to.not.equal(null);
        });

        it('sets the correct stage operator', () => {
          expect(pipeline.stageOperator).to.equal('$match');
        });

        it('sets the stage', () => {
          expect(pipeline.stage).to.equal('{\n  name: \'testing\'\n}');
        });

        it('sets if the pipeline is valid', () => {
          expect(pipeline.isValid).to.equal(true);
        });

        it('sets is expanded to true', () => {
          expect(pipeline.isExpanded).to.equal(true);
        });

        it('sets is loading to false', () => {
          expect(pipeline.isLoading).to.equal(false);
        });

        it('sets is complete to false', () => {
          expect(pipeline.isComplete).to.equal(false);
        });

        it('sets the empty preview documents', () => {
          expect(pipeline.previewDocuments).to.deep.equal([]);
        });

        it('sets the syntax error', () => {
          expect(pipeline.syntaxError).to.equal(null);
        });

        it('sets the error to null', () => {
          expect(pipeline.syntaxError).to.equal(null);
        });
      });

      context('when there are multiple values', () => {
        const text = '[{ $match: { name: "testing", value: { $gt: 5 }}}]';
        let pipeline;

        before(() => {
          pipeline = createPipeline(text)[0];
        });

        it('generates an id', () => {
          expect(pipeline.id).to.not.equal(null);
        });

        it('sets the correct stage operator', () => {
          expect(pipeline.stageOperator).to.equal('$match');
        });

        it('sets the stage', () => {
          expect(pipeline.stage).to.equal('{\n  name: \'testing\',\n  value: {\n    $gt: 5\n  }\n}');
        });
      });

      context('when there are custom BSON types', () => {
        context('when the stage contains a NumberDecimal', () => {
          const text = '[{ $match: { value: NumberDecimal(\'123.45\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: NumberDecimal(\'123.45\')\n}');
          });
        });

        context('when the stage contains a Regexp object', () => {
          const text = '[{ $match: { value: RegExp(\'[a]\', \'g\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: RegExp(\'[a]\', g)\n}');
          });
        });

        context('when the stage contains a Binary', () => {
          const text = '[{ $match: { value: BinData(\'test\', \'1\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('');
          });

          it('sets a syntax error', () => {
            expect(stage.syntaxError).to.equal('BinData type not supported');
          });
        });

        context('when the stage contains a Code object', () => {
          const text = '[{ $match: { value: Code(\'return true\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: Code(\'return true\')\n}');
          });
        });

        context('when the stage contains a NumberInt', () => {
          const text = '[{ $match: { value: NumberInt(5) }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it.skip('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: NumberInt(5)\n}');
          });
        });

        context('when the stage contains a NumberLong', () => {
          const text = '[{ $match: { value: NumberLong(5) }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: NumberLong(5)\n}');
          });
        });

        context('when the stage contains a DBRef object', () => {
          const text = '[{ $match: { value: DBRef(\'db.coll\', ObjectId(\'5b6833700633d61f36d3f09d\')) }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal(
              '{\n  value: DBRef(\'db.coll\', \'5b6833700633d61f36d3f09d\')\n}'
            );
          });
        });

        context('when the stage contains a MinKey', () => {
          const text = '[{ $match: { value: MinKey() }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: MinKey()\n}');
          });
        });

        context('when the stage contains a MaxKey', () => {
          const text = '[{ $match: { value: MaxKey() }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal('{\n  value: MaxKey()\n}');
          });
        });

        context('when the stage contains an object id', () => {
          const text = '[{ $match: { value: ObjectId(\'5b6833700633d61f36d3f09d\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal(
              '{\n  value: ObjectId(\'5b6833700633d61f36d3f09d\')\n}'
            );
          });
        });

        context('when the stage contains a timestamp', () => {
          const text = '[{ $match: { value: Timestamp(0, 10) }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal(
              '{\n  value: Timestamp(0, 10)\n}'
            );
          });
        });

        context('when the stage contains an iso date', () => {
          const text = '[{ $match: { value: ISODate(\'2004-01-01\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal(
              '{\n  value: ISODate(\'2004-01-01T00:00:00.000Z\')\n}'
            );
          });
        });

        context('when the stage contains a date', () => {
          const text = '[{ $match: { value: Date(\'2004-01-01\') }}]';
          let stage;

          before(() => {
            stage = createPipeline(text)[0];
          });

          it('sets the stage', () => {
            expect(stage.stage).to.equal(
              '{\n  value: ISODate(\'2004-01-01T00:00:00.000Z\')\n}'
            );
          });
        });
      });
    });
  });
});
