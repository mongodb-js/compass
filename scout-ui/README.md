# scout-ui

The frontend for scout.


### Some Tips and Tricks using Ampersand.js 

##### Subviews vs. renderCollection() vs. renderSubview()

[Ampersand views](http://ampersandjs.com/docs#ampersand-view) offer a number of ways of rendering subviews inside of them, for modular view composition. Each have their own advantages for certain use cases.

**Subviews**

Subviews can be defined inside a `subviews` property when extending an AmpersandView, see [ampersand-view subviews](http://ampersandjs.com/docs#ampersand-view-subviews). An example would look like this: 

```js
var AmpersandView = require('ampersand-view');
var ControlPanelView = require('./controlpanel');

module.exports = AmpersandView.extend({
  template: require('./my-view.jade'),
  subviews: {
    controlpanel: { // just a name, choose something
      container: '[data-hook=controlpanel-subview]',  // use *-subiew hook
      waitFor: 'model.controls',  // use if view is conditioned on something else
      prepareView: function (el) {
        return new CollectionRenderer({  // return new view instance
          el: el,  // always pass in the element
          model: this.model.controls  // or pass in a collection
        });
      }
    }
});
```

Subviews defined this way in the `subviews` property **replace** the DOM element container. Keep this in mind when writing your .html or .jade templates. It makes no sense to add a class or id or any other attributes to the container element, as it will be removed and replaced with the root of the subview. 

**Pro Tip** A good convention is to always use a hook ending in `-subview`, as opposed to `-container` (see below), to make it easy to see which elements are replaced and which ones stay in the DOM.

