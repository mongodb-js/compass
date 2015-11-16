---
title: ampersand.js Tips
tags:
  - help
  - ampersand
  - view
  - model
devOnly: true
---

<strong>Ampersand.js is the Model and View layer used by Compass.</strong>

## Some Tips and Tricks using Ampersand.js

### View Hierarchy

This diagram shows the view hierarchy of Compass and where the `.js` files and `.jade` templates for each view are.

![](./images/help/dev/view_hierarchy.png)

### Subviews vs. `renderCollection()` vs. `renderSubview()`

[Ampersand views](http://ampersandjs.com/docs#ampersand-view) offer a number of ways of rendering subviews inside of them, for modular view composition. Each have their own advantages for certain use cases.

#### Subviews

Subviews can be defined inside a `subviews` property when extending an AmpersandView, see [ampersand-view subviews](http://ampersandjs.com/docs#ampersand-view-subviews). An example would look like this:

```javascript
var AmpersandView = require('ampersand-view');
var ControlPanelView = require('./controlpanel');

module.exports = AmpersandView.extend({
  template: require('./my-view.jade'),
  subviews: {
    controlpanel: { // just a name, choose something
      container: '[data-hook=controlpanel-subview]',  // use *-subiew hook
      waitFor: 'model.controls',  // waits until model.controls becomes true-thy
      prepareView: function (el) {
        return new ControlPanelView({  // return new view instance
          el: el,  // always pass in the el element
          model: this.model.controls  // optionally pass in a model or collection
        });
      }
    }
});
```

Subviews defined this way in the `subviews` property **replace** the DOM element container. Keep this in mind when writing your .html or .jade templates. It makes no sense to add a class or id or any other attributes to the container element, as it will be removed and replaced with the root of the subview.

**Pro Tip:** A good convention is to always use a hook ending in `-subview`, as opposed to `-container` (see below), to make it easy to see which elements are replaced and which ones stay in the DOM.

#### renderCollection()

AmpersandView also has a [`.renderCollection()`](http://ampersandjs.com/docs#ampersand-view-rendercollection) method. It takes an AmpersandCollection, a view class, and a container selector and renders an instance of the view for each model in the collection inside the container. It also listens to changes in the collection and automatically removes or adds new views.

A typical example often uses `.renderCollection()` inside the `render()` method and could look like this:

```js
var AmpersandView = require('ampersand-view');
var MySingleItemView = require('./single-item');

module.exports = AmpersandView.extend({
  template: require('./my-view.jade'),
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, MySingleItemView, this.queryByHook('items-container'));
  }
}
```

**Pro Tip:** As a convention, here we use a hook ending in `-container`, because the container remains in the DOM.


#### renderSubview()

[`.renderSubview()`](http://ampersandjs.com/docs#ampersand-view-rendersubview) is like a manual version of the `subviews` property mentioned above. It is most often used if the subview is added dynamically at some later point, if you require the container to remain in the DOM, or if the `subviews` mechanism doesn't allow for your specific use case, e.g. the conditions when the subview needs to be rendered.  (Notice though that often this can be solved with a _derived property_, that the subview can `waitFor`).

Typical code could look like this:

```js
var AmpersandView = require('ampersand-view');
var MySpecialView = require('./my-special');

module.exports = AmpersandView.extend({
  template: require('./my-view.jade'),
  events: {
    'click .specialButton': 'onSpecialClicked'
  },
  onSpecialClicked: function (evt) {
    if (this.rendered) {
      var specialModel = ...; // compute special model here
      this.renderSubview(specialModel, MySpecialView, this.queryByHook('special-container'));
    }
  }
}
```

This is similar to the `.renderCollection()` example, except it applies to a single view instance instead of multiple views.

**Pro Tip:** As a convention, again we use a hook ending in `-container`, because the container remains in the DOM.
