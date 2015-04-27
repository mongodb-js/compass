module.exports = {
  select: function(model) {
    // @todo: add `selected` as a session if this._definition.model does not
    // have it defined already.
    if (model.selected) {
      return false;
    }
    var current = this.find({
      selected: true
    });
    if (current) current.toggle('selected');
    model.toggle('selected');
    this.selected = model;

    return true;
  }
};
