# reflux-state-mixin

Mixin for [reflux](https://www.npmjs.com/packages/reflux) stores to enable them to have `state`, `setState()`, and `getInitialState()`, similar to React components. 


## Usage

```javascript

// myStore.js
var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux); //call this mixin like that
var Actions = require('./../actions/AnimalsActions'); 

var AnimalStore = module.exports = Reflux.createStore({
  mixins: [StateMixin],
  listenables: Actions, //or any other way of listening... 

  getInitialState(){      
    return{
      dogs:5,
      cats:3
    }
  },

  onNewDogBorn: function() {
        this.setState({dogs:this.state.dogs+1})  
        //just like in a Component.
        //this will `trigger()` this state, similar to `render()` in a Component 
  }

});
```

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
        //this Component has no internest in `cats` or any other animal, so it listents to `dogs` changes only
        //of course it could have listen to the entire AnimalStore's state
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

## Installation

```bash
$ npm install reflux-state-mixin --save
```

## some details
`GetInitialState()` in store should have all of the states from the beginning.  
`setState()` is checking to see if there is a difference between new `state.key` from current `state.key`. If not, this specific `state.key` it's not triggering.
For any `setState()` the entire store is triggering (regardless of changes), allowing any Component or other Store to listen to the entire Store's state.

## acknowledgments
This mixin is combination of two other mixins - 
[triggerables-mixin](https://github.com/jesstelford/reflux-triggerable-mixin), a really useful mixin for controlling the trigger of the stores. Also see [this](https://github.com/spoike/refluxjs/issues/158) for details. 
And [state-mixin](https://github.com/spoike/refluxjs/issues/290) 

I thank @jehoshua02 and @jesstelford for their valuable code. 
