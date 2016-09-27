## reflux-state-mixin

A mixin to make Reflux Stores to have a state, similar to React components.

### Installation

```bash
$ npm install mongodb-js/reflux-state-mixin --save
```

### in store:

```javascript
// myStore.js
var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin');
var Actions = require('./../actions/AnimalsActions'); 

var AnimalStore = module.exports = Reflux.createStore({
  mixins: [StateMixin.store],
  listenables: Actions, //or any other way of listening... 

  getInitialState: function(){      //that's a must!
    return{
      dogs:5,
      cats:3
    }
  },

  onNewDogBorn: function() {
        this.setState({dogs: this.state.dogs + 1})  
        //just like in a Component.
        //this will `trigger()` this state, similar to `render()` in a Component 
  },
        
  //you can use storeDidUpdate lifecycle in the store, which will get called with every change to the state
  storeDidUpdate: function(prevState) {
      if(this.state.dogs !== prevState.dogs){
        console.log('number of dogs has changed!');
      }
  }
  

});
```


### in component:


#### 1. the easy way - connect, with mixin or decorator:

```javascript
// PetsComponent.js
var AnimalStore = require('./AnimalStore.js');
var StateMixin = require('reflux-state-mixin');

var PetsComponent = React.createClass({
    mixins:[
        StateMixin.connect(AnimalStore, 'dogs')
        StateMixin.connect(AnimalStore, 'cats')
        //OR
        StateMixin.connect(AnimalStore) //now PetsComponent.state includes AnimalStore.state
        ],

    render: function () {
        return (<div><p>We have {this.state.dogs + this.state.cats} pets</p></div>);
    }
})

```

and if you use React's es6 classes, use the es7 `connector` decorator:

```javascript
import {connector} from 'reflux-state-mixin';
import {AnimalStore} from './AnimalStore';

//@viewPortDecorator // make sure other decorators that returns a Component (usually those who provide props) are above `connector` (since it controls state).
@connector(AnimalStore, 'cats')
@connector(AnimalStore, 'dogs')
//or the entire store
@connector(AnimalStore)
//@autobind //other decorators could be anywhere
class PetsComponent extends React.Component {
    render(){
        let {dogs, cats} = this.state;
        return (<div>We have {dogs + cats} pets</div>);
        }
}

```


#### or if you want to take the long way:
##### listening to a specific property of Store's state

```javascript

var AnimalStore = require('./AnimalStore.js');

var DogsComponent = React.createClass({
    mixins:[Reflux.ListenerMixin],
    getInitialState: function (){
      return({
          dogs:AnimalStore.state.dogs 
          //Treat store.state as immutable data - same as you treat component.state - 
          //you could use it inside a component, but never change it's value - only with setState()    
      })
    },
    componentDidMount: function(){
        this.listenTo(AnimalStore.dogs,this.updateDogs); 
        //this Component has no interest in `cats` or any other animal, so it listens to `dogs` changes only
    },
    updateDogs: function(dogs){
        this.setState({dogs:dogs});
        //now we have auto-synchronization with `dogs`, with no need for specific logic for that
    },
    render: function () {
        return (<div><p>We have {this.state.dogs} dogs</p></div>);
    }
});

```
##### listen to an entire store:

```javascript
var AnimalStore = require('./AnimalStore.js');

var PetsComponent = React.createClass({
    mixins:[Reflux.ListenerMixin],
    getInitialState: function (){
      return({
          dogs: AnimalStore.state.dogs,
          cats: AnimalStore.state.cats
      })
    },
    componentDidMount: function(){
         this.listenTo(
            AnimalStore,
            (state)=>{
                this.setState({
                    dogs:state.dogs,
                    cats:state.cats
                })
            });
         //this way the component can easily decide what parts of the store-state are interesting
    },

    render: function () {
        return (<div><p>We have {this.state.dogs + this.state.cats} pets</p></div>);
    }
})
```


## some details
`GetInitialState()` in store should have all of the states from the beginning.
Store should not have any method that are declared in state, since you can listen to MyStore.dogs
`setState()` is checking to see if there is a difference between new `state.key` from current `state.key`. If not, this specific `state.key` it's not triggering.
For any `setState()` the entire store is triggering (regardless of changes), allowing any Component or other Store to listen to the entire Store's state.

## acknowledgments
Original source from [jonatanmn/Super-Simple-Reflux](https://github.com/yonatanmn/Super-Simple-Flux)
This mixin was inspired by (a.k.a shamelessly stole from) -
[triggerables-mixin](https://github.com/jesstelford/reflux-triggerable-mixin). Also see [this](https://github.com/spoike/refluxjs/issues/158) for details.
[reflux-provides-store](https://github.com/brigand/reflux-provides-store)
And [state-mixin](https://github.com/spoike/refluxjs/issues/290).

I thank @jehoshua02 @brigand and @jesstelford for their valuable code.
