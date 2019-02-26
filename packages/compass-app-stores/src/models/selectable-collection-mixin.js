/**
 * @todo: add `selected` as a session if this._definition.model does not
 * have it defined already.
 *
 * @example
 *   var assert = require('assert');
 *   var View = require('ampersand-view');
 *   var State = require('ampersand-state');
 *   var Collection = require('ampersand-collection');
 *   var selectableMixin = require('selectable-collection-mixin');
 *   var Pet = State.extend({
 *     props: {id: 'number', name: 'string'},
 *     session: {selected: 'boolean'}
 *   });
 *   var PetCollection = Collection.extend(selectableMixin, {model: Pet});
 *   var PetItemView = View.extend({
 *     bindings: {
 *       'model.name': 'name',
 *       'model.selected': {
 *         type: 'booleanClass',
 *         name: 'active'
 *       }
 *     },
 *     events: {
 *       'click': 'onClick'
 *     },
 *     template: '<a class="list-group-item" data-hook="name"></a>',
 *     onClick: function(){
 *       if (!this.model.collection.select(this.model)) {
 *         console.log('%j is already selected', this.model);
 *       }
 *       else {
 *         assert.equal(this.model.selected, true);
 *         console.log('%j is now the selected item!', this.model);
 *       }
 *     }
 *   });
 *   var PetListView = View.extend({
 *     initialize: function(){
 *       this.collection = new PetCollection([
 *         {id: 1, name: 'Kochka'},
 *         {id: 2, name: 'Basil'},
 *         {id: 3, name: 'Arlo'}
 *       ]);
 *     },
 *     template: '<h1>My Pets</h1><div class="list-group" data-hook="pet-list"></div>',
 *     render: function(){
 *       this.renderWithTemplate();
 *       this.renderCollection(this.collection, PetItemView, this.queryByHook('pet-list'));
 *     }
 *   });
 */
import raf from 'raf';
export default {
  /**
   * @param {Object} model you want to mark as selected.
   * @return {Boolean} false if model already selected, true if incoming
   * selected and previously selected toggled to true.
   */
  select: (model) => {
    if (model.selected) {
      return false;
    }
    raf(function selectableMarkModelSelected() {
      const current = this.selected;
      if (current) {
        current.selected = false;
      }
      model.selected = true;
      this.selected = model;
      this.trigger('change:selected', this.selected);
    }.bind(this));

    return true;
  },
  unselectAll: () => {
    if (this.selected) {
      this.selected.set({
        selected: false
      });
    }
    this.selected = null;
    this.trigger('change:selected', this.selected);
  }
};
