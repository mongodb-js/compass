/* eslint guard-for-in: 0 */

const { expect, assert } = require('chai');
const GridStore = require('../../../lib/stores/grid-store');

describe('GridStore', () => {
  const showing = {
    field1: 'Object', field2: 'Array', field3: 'Int32',
    field4: 'Binary', field5: 'Mixed'
  };
  const columns = {
    field1: { '1': 'Object', '2': 'Object', '3': 'Object' },
    field2: { '1': 'Array', '2': 'Array', '3': 'Array' },
    field3: { '1': 'Int32', '2': 'Int32', '3': 'Int32' },
    field4: { '1': 'Binary', '2': 'Binary', '3': 'Binary'},
    field5: { '1': 'Int32', '2': 'Int32', '3': 'String' }
  };
  const arrayCols = {
    0: {id1: 'String', id2: 'Int64'},
    1: {id1: 'Int64', id2: 'Double'},
    2: {id1: 'Int32' }
  };
  const arrayShowing = {
    0: 'Mixed', 1: 'Mixed', 2: 'Int32'
  };

  describe('#columns', () => {
    describe('adding an array column', () => {
      describe('editOnly=true', () => {
        before((done) => {
          GridStore.resetColumns(arrayCols);
          expect(GridStore.columns).to.deep.equal(arrayCols);
          expect(GridStore.showing).to.deep.equal(arrayShowing);
          done();
        });
        after((done) => {
          GridStore.resetColumns({});
          done();
        });
        it('does not trigger with add', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            expect(params).to.deep.equal({
              updateHeaders: {showing: {1: 'Int64', 2: 'Mixed'} },
              edit: {colId: 1, rowIndex: 3}
            });
            done();
          });
          GridStore.addColumn(1, 0, 3, ['array'], true, true, 'id2');
        });
        it('updates this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            0: {id1: 'String', id2: 'Int64'},
            1: {id1: 'Int64'},
            2: {id1: 'Int32', id2: 'Double'}
          });
        });
        it('updates this.showing correctly', () => {
          expect(GridStore.showing).to.deep.equal({
            0: 'Mixed', 1: 'Int64', 2: 'Mixed'
          });
        });
      });
      describe('editOnly=false', () => {
        before((done) => {
          GridStore.resetColumns(arrayCols);
          expect(GridStore.columns).to.deep.equal(arrayCols);
          expect(GridStore.showing).to.deep.equal(arrayShowing);
          done();
        });
        after((done) => {
          GridStore.resetColumns({});
          done();
        });
        it('does trigger with add', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            expect(params).to.deep.equal({
              updateHeaders: {showing: {
                1: 'Double', 2: 'Int64', 3: 'Int32'
              }},
              add: {
                newColId: 1, colIdBefore: 0, path: ['array'], isArray: true, colType: ''
              },
              edit: {
                colId: 1, rowIndex: 3
              }
            });
            done();
          });
          GridStore.addColumn(1, 0, 3, ['array'], true, false, 'id1');
        });
        it('updates this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            0: {id1: 'String', id2: 'Int64'},
            1: {id2: 'Double'},
            2: {id1: 'Int64'},
            3: {id1: 'Int32'}
          });
        });
        it('updates this.showing correctly', () => {
          expect(GridStore.showing).to.deep.equal({
            0: 'Mixed', 1: 'Double', 2: 'Int64', 3: 'Int32'
          });
        });
      });
      describe('with elements marked as removed', () => {
        describe('editOnly=false', () => {
          describe('mark removed is same element as added', () => {
            before((done) => {
              GridStore.resetColumns(arrayCols);
              GridStore.elementMarkRemoved(1, 'id1');
              expect(GridStore.columns).to.deep.equal({
                0: {id1: 'String', id2: 'Int64'},
                1: {id2: 'Double'},
                2: {id1: 'Int32' }
              });
              expect(GridStore.showing).to.deep.equal({
                0: 'Mixed', 1: 'Double', 2: 'Int32'
              });
              expect(GridStore.stageRemove).to.deep.equal({
                1: {id1: true}
              });
              done();
            });
            after((done) => {
              GridStore.resetColumns({});
              done();
            });
            it('does trigger with add', (done) => {
              const unsubscribe = GridStore.listen((params) => {
                unsubscribe();
                expect(params).to.deep.equal({
                  updateHeaders: {showing: {
                    1: 'Double', 3: 'Int32'
                  }},
                  add: {
                    newColId: 1, colIdBefore: 0, path: ['array'], isArray: true, colType: ''
                  },
                  edit: {
                    colId: 1, rowIndex: 3
                  }
                });
                done();
              });
              GridStore.addColumn(1, 0, 3, ['array'], true, false, 'id1');
            });
            it('updates this.columns correctly', () => {
              expect(GridStore.columns).to.deep.equal({
                0: {id1: 'String', id2: 'Int64'},
                1: {id2: 'Double'},
                3: {id1: 'Int32'}
              });
            });
            it('updates this.showing correctly', () => {
              expect(GridStore.showing).to.deep.equal({
                0: 'Mixed', 1: 'Double', 2: 'Int32', 3: 'Int32'
              });
            });
            it('updates this.stageRemoved correctly', () => {
              expect(GridStore.stageRemove).to.deep.equal({
                2: {id1: true}
              });
            });
          });
          describe('mark removed is before added', () => {
            before((done) => {
              GridStore.resetColumns(arrayCols);
              GridStore.elementMarkRemoved(0, 'id1');
              expect(GridStore.columns).to.deep.equal({
                0: {id2: 'Int64'},
                1: {id1: 'Int64', id2: 'Double'},
                2: {id1: 'Int32' }
              });
              expect(GridStore.showing).to.deep.equal({
                0: 'Int64', 1: 'Mixed', 2: 'Int32'
              });
              expect(GridStore.stageRemove).to.deep.equal({
                0: {id1: true}
              });
              done();
            });
            after((done) => {
              GridStore.resetColumns({});
              done();
            });
            it('does trigger with add', (done) => {
              const unsubscribe = GridStore.listen((params) => {
                unsubscribe();
                expect(params).to.deep.equal({
                  updateHeaders: {showing: {
                    1: 'Double', 2: 'Int64', 3: 'Int32'
                  }},
                  add: {
                    newColId: 1, colIdBefore: 0, path: ['array'], isArray: true, colType: ''
                  },
                  edit: {
                    colId: 1, rowIndex: 3
                  }
                });
                done();
              });
              GridStore.addColumn(1, 0, 3, ['array'], true, false, 'id1');
            });
            it('updates this.columns correctly', () => {
              expect(GridStore.columns).to.deep.equal({
                0: {id2: 'Int64'},
                1: {id2: 'Double'},
                2: {id1: 'Int64'},
                3: {id1: 'Int32'}
              });
            });
            it('updates this.showing correctly', () => {
              expect(GridStore.showing).to.deep.equal({
                0: 'Int64', 1: 'Double', 2: 'Int64', 3: 'Int32'
              });
            });
            it('updates this.stageRemoved correctly', () => {
              expect(GridStore.stageRemove).to.deep.equal({
                0: {id1: true}
              });
            });
          });
          describe('mark removed is after added', () => {
            before((done) => {
              GridStore.resetColumns(arrayCols);
              GridStore.elementMarkRemoved(2, 'id1');
              expect(GridStore.columns).to.deep.equal({
                0: {id1: 'String', id2: 'Int64'},
                1: {id1: 'Int64', id2: 'Double'}
              });
              expect(GridStore.showing).to.deep.equal({
                0: 'Mixed', 1: 'Mixed', 2: 'Int32'
              });
              expect(GridStore.stageRemove).to.deep.equal({
                2: {id1: true}
              });
              done();
            });
            after((done) => {
              GridStore.resetColumns({});
              done();
            });
            it('does trigger with add', (done) => {
              const unsubscribe = GridStore.listen((params) => {
                unsubscribe();
                expect(params).to.deep.equal({
                  updateHeaders: {showing: {
                    1: 'Double', 2: 'Int64'
                  }},
                  add: {
                    newColId: 1, colIdBefore: 0, path: ['array'], isArray: true, colType: ''
                  },
                  edit: {
                    colId: 1, rowIndex: 3
                  }
                });
                done();
              });
              GridStore.addColumn(1, 0, 3, ['array'], true, false, 'id1');
            });
            it('updates this.columns correctly', () => {
              expect(GridStore.columns).to.deep.equal({
                0: {id1: 'String', id2: 'Int64'},
                1: {id2: 'Double'},
                2: {id1: 'Int64'}
              });
            });
            it('updates this.showing correctly', () => {
              expect(GridStore.showing).to.deep.equal({
                0: 'Mixed', 1: 'Double', 2: 'Int64', 3: 'Int32'
              });
            });
            it('updates this.stageRemoved correctly', () => {
              expect(GridStore.stageRemove).to.deep.equal({
                3: {id1: true}
              });
            });
          });
        });
      });
    });
    describe('adding a non-array column', () => {
      before((done) => {
        GridStore.resetColumns({});
        done();
      });
      after((done) => {
        GridStore.resetColumns({});
        done();
      });
      it('triggers with correct params', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({
            edit: { colId: 'field3', rowIndex: 1},
            add: {
              newColId: 'field3', colIdBefore: 'field1',
              path: ['path'], isArray: false, colType: ''
            }
          });
          done();
        });
        GridStore.addColumn('field3', 'field1', 1, ['path'], false, false, 'id1');
      });
    });

    describe('removing a column', () => {
      it('triggers with correct params', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({remove: {colIds: ['field3']}});
          done();
        });
        GridStore.removeColumn('field3');
      });
    });
  });

  describe('#resetCols', () => {
    before((done) => {
      showing.field5 = 'Mixed';
      done();
    });
    after((done) => {
      showing.field5 = 'Int32';
      done();
    });
    it('resets columns to empty', () => {
      GridStore.resetColumns({});
      expect(GridStore.columns).to.deep.equal({});
      expect(GridStore.showing).to.deep.equal({});
      expect(GridStore.stageRemove).to.deep.equal({});
    });
    it('resets columns to values', () => {
      GridStore.resetColumns(columns);
      expect(GridStore.columns).to.deep.equal(columns);
      expect(GridStore.showing).to.deep.equal(showing);
      expect(GridStore.stageRemove).to.deep.equal({});
    });
  });

  describe('#elementAdded', () => {
    before((done) => {
      GridStore.resetColumns({});
      done();
    });
    describe('Adding a new column', () => {
      for (const key in columns) {
        it('triggers correctly', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            const show = {};
            show[key] = columns[key][1];
            expect(params).to.deep.equal({updateHeaders: {showing: show}});
            done();
          });
          GridStore.elementAdded(key, columns[key]['1'], '1');
        });
      }
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field1: {1: 'Object'},
          field2: {1: 'Array'},
          field3: {1: 'Int32'},
          field4: {1: 'Binary'},
          field5: {1: 'Int32'}
        });
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal(showing);
      });
    });

    describe('Adding to a column that already exists with the same type', () => {
      for (const key in columns) {
        it('does not trigger', () => {
          const unsubscribe = GridStore.listen(() => {
            assert.fail();
          });
          GridStore.elementAdded(key, columns[key]['2'], '2');
          if (key !== 'field5') {
            GridStore.elementAdded(key, columns[key]['3'], '3');
          }
          unsubscribe();
        });
      }
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field1: {1: 'Object', 2: 'Object', 3: 'Object'},
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'},
          field5: {1: 'Int32', 2: 'Int32'}
        });
      });
      it('sets this.showing correctly', () => {
        showing.field5 = 'Int32';
        expect(GridStore.showing).to.deep.equal(showing);
        showing.field5 = 'Mixed';
      });
    });
    describe('Adding to a column that already exists with a new type', () => {
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field5: 'Mixed'}}});
          done();
        });
        GridStore.elementAdded('field5', 'String', '3');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal(columns);
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal(showing);
      });
    });
  });

  describe('#elementRemoved', () => {
    describe('isArray=false', () => {
      before((done) => {
        GridStore.resetColumns(columns);
        done();
      });
      describe('Removing from a column that already exists with the same type', () => {
        for (const key in columns) {
          it('does not trigger', () => {
            const unsubscribe = GridStore.listen(() => {
              assert.fail();
            });
            GridStore.elementRemoved(key, '1', false);
            if (key !== 'field5') {
              GridStore.elementRemoved(key, '2', false);
            }
            unsubscribe();
          });
        }
        it('sets this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            field1: {3: 'Object'},
            field2: {3: 'Array'},
            field3: {3: 'Int32'},
            field4: {3: 'Binary'},
            field5: {2: 'Int32', 3: 'String'}
          });
        });
        it('sets this.showing correctly', () => {
          expect(GridStore.showing).to.deep.equal(showing);
        });
      });
      describe('Removing from a Mixed column', () => {
        it('triggers correctly', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            expect(params).to.deep.equal({updateHeaders: {showing: {field5: 'Int32'}}});
            done();
          });
          GridStore.elementRemoved('field5', '3', false);
        });
        it('sets this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            field1: {3: 'Object'},
            field2: {3: 'Array'},
            field3: {3: 'Int32'},
            field4: {3: 'Binary'},
            field5: {2: 'Int32'}
          });
        });
        it('sets this.showing correctly', () => {
          showing.field5 = 'Int32';
          expect(GridStore.showing).to.deep.equal(showing);
        });
      });
      describe('Removing the last item from a column', () => {
        it('triggers correctly', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            expect(params).to.deep.equal({remove: {colIds: ['field5']}});
            done();
          });
          GridStore.elementRemoved('field5', '2', false);
        });
        it('sets this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            field1: {3: 'Object'},
            field2: {3: 'Array'},
            field3: {3: 'Int32'},
            field4: {3: 'Binary'}
          });
        });
        it('sets this.showing correctly', () => {
          delete showing.field5;
          expect(GridStore.showing).to.deep.equal(showing);
        });
      });
    });
    describe('isArray=true', () => {
      describe('from middle of array', () => {
        describe('last column is now empty', () => {
          before((done) => {
            GridStore.resetColumns(arrayCols);
            expect(GridStore.columns).to.deep.equal(arrayCols);
            expect(GridStore.showing).to.deep.equal(arrayShowing);
            done();
          });
          after((done) => {
            GridStore.resetColumns({});
            done();
          });
          it('does trigger with remove', (done) => {
            const unsubscribe = GridStore.listen((params) => {
              unsubscribe();
              expect(params).to.deep.equal({
                updateHeaders: {showing: {1: 'Mixed'} },
                refresh: {oid: 'id1'},
                remove: {colIds: [2]}
              });
              done();
            });
            GridStore.elementRemoved(1, 'id1', true);
          });
          it('updates this.columns correctly', () => {
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Int64'},
              1: {id1: 'Int32', id2: 'Double'}
            });
          });
          it('updates this.showing correctly', () => {
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Mixed'
            });
          });
        });
        describe('last column is not empty', () => {
          before((done) => {
            GridStore.resetColumns(arrayCols);
            expect(GridStore.columns).to.deep.equal(arrayCols);
            expect(GridStore.showing).to.deep.equal(arrayShowing);
            done();
          });
          after((done) => {
            GridStore.resetColumns({});
            done();
          });
          it('does not trigger with remove', (done) => {
            const unsubscribe = GridStore.listen((params) => {
              unsubscribe();
              expect(params).to.deep.equal({
                updateHeaders: {showing: {0: 'Mixed', 1: 'Int64', 2: 'Int32'} },
                refresh: {oid: 'id2'}
              });
              done();
            });
            GridStore.elementRemoved(0, 'id2', true);
          });
          it('updates this.columns correctly', () => {
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Double'},
              1: {id1: 'Int64'},
              2: {id1: 'Int32'}
            });
          });
          it('updates this.showing correctly', () => {
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Int64', 2: 'Int32'
            });
          });
        });
      });
      describe('from end of array', () => {
        describe('last column is now empty', () => {
          before((done) => {
            GridStore.resetColumns(arrayCols);
            expect(GridStore.columns).to.deep.equal(arrayCols);
            expect(GridStore.showing).to.deep.equal(arrayShowing);
            done();
          });
          after((done) => {
            GridStore.resetColumns({});
            done();
          });
          it('does trigger with remove', (done) => {
            const unsubscribe = GridStore.listen((params) => {
              unsubscribe();
              expect(params).to.deep.equal({
                refresh: {oid: 'id1'},
                remove: {colIds: [2]}
              });
              done();
            });
            GridStore.elementRemoved(2, 'id1', true);
          });
          it('updates this.columns correctly', () => {
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Int64'},
              1: {id1: 'Int64', id2: 'Double'}
            });
          });
          it('updates this.showing correctly', () => {
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Mixed'
            });
          });
        });
        describe('last column is not empty', () => {
          before((done) => {
            GridStore.resetColumns(arrayCols);
            expect(GridStore.columns).to.deep.equal(arrayCols);
            expect(GridStore.showing).to.deep.equal(arrayShowing);
            done();
          });
          after((done) => {
            GridStore.resetColumns({});
            done();
          });
          it('does not trigger with remove', (done) => {
            const unsubscribe = GridStore.listen((params) => {
              unsubscribe();
              expect(params).to.deep.equal({
                updateHeaders: {showing: {1: 'Int64', 2: 'Int32'} },
                refresh: {oid: 'id2'}
              });
              done();
            });
            GridStore.elementRemoved(1, 'id2', true);
          });
          it('updates this.columns correctly', () => {
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Int64'},
              1: {id1: 'Int64'},
              2: {id1: 'Int32'}
            });
          });
          it('updates this.showing correctly', () => {
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Int64', 2: 'Int32'
            });
          });
        });
      });
    });
    describe('with staged elements', () => {
      describe('element being removed was staged', () => {
        before((done) => {
          GridStore.resetColumns(arrayCols);
          GridStore.elementMarkRemoved(1, 'id1');
          expect(GridStore.columns).to.deep.equal({
            0: {id1: 'String', id2: 'Int64'},
            1: {id2: 'Double'},
            2: {id1: 'Int32' }
          });
          expect(GridStore.showing).to.deep.equal({
            0: 'Mixed', 1: 'Double', 2: 'Int32'
          });
          expect(GridStore.stageRemove).to.deep.equal({
            1: {id1: true}
          });
          done();
        });
        after((done) => {
          GridStore.resetColumns({});
          done();
        });
        it('does trigger with remove', (done) => {
          const unsubscribe = GridStore.listen((params) => {
            unsubscribe();
            expect(params).to.deep.equal({
              updateHeaders: {showing: {
                1: 'Mixed'
              }},
              refresh: {oid: 'id1'},
              remove: {colIds: [2]}
            });
            done();
          });
          GridStore.elementRemoved(1, 'id1', true);
        });
        it('updates this.columns correctly', () => {
          expect(GridStore.columns).to.deep.equal({
            0: {id1: 'String', id2: 'Int64'},
            1: {id1: 'Int32', id2: 'Double'}
          });
        });
        it('updates this.showing correctly', () => {
          expect(GridStore.showing).to.deep.equal({
            0: 'Mixed', 1: 'Mixed'
          });
        });
        it('updates this.stageRemoved correctly', () => {
          expect(GridStore.stageRemove).to.deep.equal({});
        });
      });
      describe('element being removed was not staged', () => {
        describe('element marked as removed is after element removed', () => {
          before((done) => {
            GridStore.resetColumns(arrayCols);
            GridStore.elementMarkRemoved(2, 'id1');
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Int64'},
              1: {id1: 'Int64', id2: 'Double'}
            });
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Mixed', 2: 'Int32'
            });
            expect(GridStore.stageRemove).to.deep.equal({
              2: {id1: true}
            });
            done();
          });
          after((done) => {
            GridStore.resetColumns({});
            done();
          });
          it('does trigger with remove', (done) => {
            const unsubscribe = GridStore.listen((params) => {
              unsubscribe();
              expect(params).to.deep.equal({
                updateHeaders: {showing: {
                  1: 'Double'
                }},
                refresh: {oid: 'id1'},
                remove: {colIds: [2]}
              });
              done();
            });
            GridStore.elementRemoved(1, 'id1', true);
          });
          it('updates this.columns correctly', () => {
            expect(GridStore.columns).to.deep.equal({
              0: {id1: 'String', id2: 'Int64'},
              1: {id2: 'Double'}
            });
          });
          it('updates this.showing correctly', () => {
            expect(GridStore.showing).to.deep.equal({
              0: 'Mixed', 1: 'Double'
            });
          });
          it('updates this.stageRemoved correctly', () => {
            expect(GridStore.stageRemove).to.deep.equal({
              1: {id1: true}
            });
          });
        });
      });
    });
  });

  describe('#elementTypeChanged', () => {
    before((done) => {
      GridStore.resetColumns({field1: {3: 'Object'}});
      done();
    });
    describe('Changing the type of the last item', () => {
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field1: 'Date'}}});
          done();
        });
        GridStore.elementTypeChanged('field1', 'Date', '3');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({field1: {3: 'Date'}});
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({field1: 'Date'});
      });
    });
    describe('Casted to the same type', () => {
      it('does not trigger', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.elementTypeChanged('field1', 'Date', '3');
        unsubscribe();
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({field1: {3: 'Date'}});
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({field1: 'Date'});
      });
    });
    describe('Changing the type to Mixed', () => {
      before((done) => {
        GridStore.resetColumns({field1: {3: 'Date', 2: 'Date'}});
        done();
      });
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field1: 'Mixed'}}});
          done();
        });
        GridStore.elementTypeChanged('field1', 'Double', '3');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({field1: {3: 'Double', 2: 'Date'}});
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({field1: 'Mixed'});
      });
    });
    describe('Changing the type from Mixed', () => {
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field1: 'Double'}}});
          done();
        });
        GridStore.elementTypeChanged('field1', 'Double', '2');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({field1: {3: 'Double', 2: 'Double'}});
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({field1: 'Double'});
      });
    });
  });

  describe('#elementMarkRemoved', () => {
    before((done) => {
      GridStore.resetColumns(columns);
      showing.field1 = 'Object';
      showing.field5 = 'Mixed';
      expect(GridStore.columns).to.deep.equal(columns);
      expect(GridStore.showing).to.deep.equal(showing);
      expect(GridStore.stageRemove).to.deep.equal({});
      done();
    });
    describe('marking an element as removed with the same type', () => {
      it('does not trigger', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.elementMarkRemoved('field1', '1');
        GridStore.elementMarkRemoved('field1', '2');
        GridStore.elementMarkRemoved('field1', '3');
        unsubscribe();
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'},
          field5: {1: 'Int32', 2: 'Int32', 3: 'String'}
        });
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}});
      });
    });
    describe('marking an element as removed with a different type but still Mixed', () => {
      it('does not trigger', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.elementMarkRemoved('field5', '1');
        unsubscribe();
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'},
          field5: {2: 'Int32', 3: 'String'}
        });
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}, field5: {1: true}});
      });
    });
    describe('marking an element as removed with a different type no longer Mixed', () => {
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field5: 'Int32'}}});
          done();
        });
        GridStore.elementMarkRemoved('field5', '3');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'},
          field5: {2: 'Int32'}
        });
      });
      it('sets this.showing correctly', () => {
        showing.field5 = 'Int32';
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}, field5: {1: true, 3: true}});
      });
    });
    describe('marking the last element in a column as removed', () => {
      it('does not trigger', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.elementMarkRemoved('field5', '2');
        unsubscribe();
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'}
        });
      });
      it('sets this.showing correctly', () => {
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}, field5: {1: true, 2: true, 3: true}});
      });
    });
    describe('calling elementAdded for a marked removed element adds it back', () => {
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {field1: 'String'}}});
          done();
        });
        GridStore.elementAdded('field1', 'String', '1');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field1: {1: 'String'},
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'}
        });
      });
      it('sets this.showing correctly', () => {
        showing.field1 = 'String';
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {2: true, 3: true}, field5: {1: true, 2: true, 3: true}});
      });
    });
    describe('calling elementRemoved for a marked remove element removes it', () => {
      it('does not trigger if there are marked removed elements in the column', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.elementRemoved('field1', '1');
        GridStore.elementRemoved('field1', '2');
        unsubscribe();
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'}
        });
      });
      it('sets this.showing correctly', () => {
        showing.field5 = 'Int32';
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field1: {3: true}, field5: {1: true, 2: true, 3: true}});
      });
      it('triggers if there are no  more marked removed elements in the column', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({remove: {colIds: ['field1']}});
          done();
        });
        GridStore.elementRemoved('field1', '3');
      });
      it('sets this.columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          field2: {1: 'Array', 2: 'Array', 3: 'Array'},
          field3: {1: 'Int32', 2: 'Int32', 3: 'Int32'},
          field4: {1: 'Binary', 2: 'Binary', 3: 'Binary'}
        });
      });
      it('sets this.showing correctly', () => {
        delete showing.field1;
        expect(GridStore.showing).to.deep.equal(showing);
      });
      it('sets this.stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({field5: {1: true, 2: true, 3: true}});
      });
    });
  });

  describe('#cleanCols', () => {
    describe('columns have elements marked for deletion', () => {
      before((done) => {
        GridStore.resetColumns({field1: {1: 'Object', 2: 'Object', 3: 'Object'}});
        GridStore.elementMarkRemoved('field1', 1);
        GridStore.elementMarkRemoved('field1', 2);
        GridStore.elementMarkRemoved('field1', 3);
        expect(GridStore.columns).to.deep.equal({});
        expect(GridStore.showing).to.deep.equal({field1: 'Object'});
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}});
        done();
      });
      it('does not trigger', () => {
        const unsubscribe = GridStore.listen(() => {
          assert.fail();
        });
        GridStore.cleanCols();
        unsubscribe();
      });
      it('does not make internal changes', () => {
        expect(GridStore.columns).to.deep.equal({});
        expect(GridStore.showing).to.deep.equal({field1: 'Object'});
        expect(GridStore.stageRemove).to.deep.equal({field1: {1: true, 2: true, 3: true}});
      });
    });
    describe('all elements in column are removed', () => {
      before((done) => {
        GridStore.resetColumns({field1: {3: 'Object'}, field2: {3: 'Array'}});
        delete GridStore.columns.field1;
        delete GridStore.columns.field2;
        expect(GridStore.columns).to.deep.equal({});
        expect(GridStore.showing).to.deep.equal({field1: 'Object', field2: 'Array'});
        expect(GridStore.stageRemove).to.deep.equal({});
        done();
      });
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({remove: {colIds: ['field1', 'field2']}});
          done();
        });
        GridStore.cleanCols();
      });
      it('makes internal changes', () => {
        expect(GridStore.columns).to.deep.equal({});
        expect(GridStore.showing).to.deep.equal({});
        expect(GridStore.stageRemove).to.deep.equal({});
      });
    });
  });

  describe('#renameColumn', () => {
    before((done) => {
      GridStore.resetColumns({$new: {id1: 'Int32', id2: 'String'}});
      GridStore.elementMarkRemoved('$new', 'id2');
      done();
    });
    after((done) => {
      GridStore.resetColumns({});
      done();
    });
    it('updates objects', () => {
      GridStore.renameColumn('$new', 'fieldname');
      expect(GridStore.columns).to.deep.equal({fieldname: {id1: 'Int32'}});
      expect(GridStore.showing).to.deep.equal({fieldname: 'Int32'});
      expect(GridStore.stageRemove).to.deep.equal({fieldname: {id2: true}});
    });
  });

  describe('#replaceDoc', () => {
    describe('replacing a document with a smaller document', () => {
      before((done) => {
        GridStore.resetColumns({
          0: {id1: 'String', id2: 'Int32'},
          1: {id1: 'Int64', id2: 'Double'},
          2: {id1: 'Int32' }
        });
        GridStore.elementMarkRemoved(0, 'id1');
        done();
      });
      after((done) => {
        GridStore.resetColumns({});
        done();
      });
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {
            0: 'Int32', 1: 'Mixed', 2: 'Int32'
          }}});
          done();
        });
        GridStore.replaceDoc(
          'id1', 'id1', {0: 1, 1: 'a string'}
        );
      });
      it('updates columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          0: {id1: 'Int32', id2: 'Int32'},
          1: {id1: 'String', id2: 'Double'}
        });
      });
      it('updates showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({
          0: 'Int32',
          1: 'Mixed',
          2: 'Int32'
        });
      });
      it('updates stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({});
      });
    });
    describe('replacing a document with a larger document', () => {
      before((done) => {
        GridStore.resetColumns({
          0: {id1: 'String', id2: 'Int32'},
          1: {id1: 'Int64', id2: 'Double'},
          2: {id1: 'Int32' }
        });
        GridStore.elementMarkRemoved(1, 'id2');
        done();
      });
      after((done) => {
        GridStore.resetColumns({});
        done();
      });
      it('triggers correctly', (done) => {
        const unsubscribe = GridStore.listen((params) => {
          unsubscribe();
          expect(params).to.deep.equal({updateHeaders: {showing: {
            0: 'Int32', 1: 'String', 2: 'String', 3: 'Int32', 4: 'String'
          }}});
          done();
        });
        GridStore.replaceDoc(
          'id1', 'id1', {
            0: 1, 1: 'a string', 2: 'another string', 3: 1, 4: 'last string'
          }
        );
      });
      it('updates columns correctly', () => {
        expect(GridStore.columns).to.deep.equal({
          0: {id1: 'Int32', id2: 'Int32'},
          1: {id1: 'String'},
          2: {id1: 'String'},
          3: {id1: 'Int32'},
          4: {id1: 'String'}
        });
      });
      it('updates showing correctly', () => {
        expect(GridStore.showing).to.deep.equal({
          0: 'Int32',
          1: 'String',
          2: 'String',
          3: 'Int32',
          4: 'String'
        });
      });
      it('updates stageRemove correctly', () => {
        expect(GridStore.stageRemove).to.deep.equal({1: {id2: true}});
      });
    });
  });
});
