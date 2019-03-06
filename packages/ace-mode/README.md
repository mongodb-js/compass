# mongodb-ace-mode [![][npm_img]][npm_url]

MongoDB ACE mode

## Installation

```
npm install --save mongodb-ace-mode
```

## Highlighting

### Operators -> ace_function

Why? Mental model of operators to functions. (e.g. `$avg: 'a'`, `avg(a)`)

Given: 

```
max_cpi: {$max: "$trends.icecream_cpi"}
```

```html
<div class="ace_line" style="height:15px">
  <span class="ace_identifier">max_cpi</span>
  <span class="ace_punctuation ace_operator">:</span>
  <span class="ace_paren ace_lparen">{</span>
  <span class="ace_support ace_function">$max</span>
  <span class="ace_punctuation ace_operator">:</span>
  <span class="ace_string ace_quasi ace_start">"</span>
  <span class="ace_variable ace_language">$trends.icecream_cpi</span>
  <span class="ace_string ace_quasi ace_end">"</span>
  <span class="ace_paren ace_rparen">}</span>
</div>
```

### Field usage -> ace_variable

Why? Nothing worse than off by one typos... So now really easy to catch because `"field"` and `"$field"` will be styled differently.

Given: 

```
type: "$type"
```

```html
<div class="ace_line" style="height:15px">
  <span class="ace_identifier">type</span>
  <span class="ace_punctuation ace_operator">:</span> 
  <span class="ace_string ace_quasi ace_start">"</span>
  <span class="ace_variable ace_parameter">$type</span>
  <span class="ace_punctuation ace_operator">"</span>
</div>
```

<!-- ### Locally defined variable usage -> ace_variable ace_other

```
ace_other">$$localType</span>
``` -->


## Discovery


### Thinking

```javascript
/**
 * Gathering stats when items are in an array using 
 * $project accumulators.
 */

 /**
  * 1. Default JS highlighter 
  */
db.icecream_data.aggregate([
  {
    _id: 0,
    average_cpi: {
      $avg: "$trends.icecream_cpi"
    },
    max_cpi: {
      $max: "$trends.icecream_cpi"
    },
    min_cpi: {
      $min: "$trends.icecream_cpi"
    },
    cpi_deviation: {
      $stdDevPop: "$trends.icecream_cpi"
    }
  }
]);

/**
 * 2. What if `$` operators were JS functions
 *    like in various "aggy" helper experiments?
 */
db.icecream_data.aggregate([{
  _id: include(false),
  average_cpi: avg('trends.icecream_cpi'),
  max_cpi: max('trends.icecream_cpi'),
  min_cpi: min('trends.icecream_cpi'),
  cpi_deviation: stdDevPop('trends.icecream_cpi')
}]);

/**
 * 3. What if `$` operators same as 2 but with 
 *  "magic" template strings?
 */
db.icecream_data.aggregate([{
  _id: include(false),
  average_cpi: avg(`${trends.icecream_cpi}`),
  max_cpi: max(`${trends.icecream_cpi}`),
  min_cpi: min(`${trends.icecream_cpi}`),
  cpi_deviation: stdDevPop(`${trends.icecream_cpi}`)
}]);
```

There are 3 different ways I was thinking about this to get as close to what a developer would expect.  (Top left editor panel in screenshot).

`Case #3` of js template strings: We can discriminate between `"|'` and `$field` in aggregation styling, just like \``\`, `${|}`, and `field` for a template string. The power here is:

- `field` links back visually to the property on the left
- Avoid typos of 'field' instead of '$field' (especially when creating a view!) by distinguishing those two.

![](https://www.dropbox.com/s/7soe72zzc062kfm/Screenshot%202019-03-01%2010.20.14.png?dl=1)

### Data

[The Best Visual Studio Code Dark and Light Themes (Updated Feb 2019)](https://medium.com/@chibicode/the-best-visual-studio-code-dark-and-light-themes-july-2018-edition-a9c2cc9548da)

[OneDark Pro](https://github.com/Binaryify/OneDark-Pro) Most installed by a giant margin 

Pertsonal preference: [Monokai](https://marketplace.visualstudio.com/items?itemName=gerane.Theme-Monokai) Used for more than a decade as Editor of choice has changed (TextMate :arrow_right: SublimeText :arrow_right: Atom :arrow_right: VSCode)


### Links

- https://github.com/ajaxorg/ace/blob/master/lib/ace/theme/monokai.css
- https://ace.c9.io/build/kitchen-sink.html
- https://github.com/ajaxorg/ace/wiki/Creating-or-Extending-an-Edit-Mode

### Basic 

Given:

```js
average_cpi: {$avg: "$trends.icecream_cpi" }
```

Want to highlight:

- `$trends.icecream_cpi`
- `$avg`
- `"` around `$trends.icecream_cpi` separated

See 

HTML we want looks something like:

```html
<div class="ace_line" style="height: 16px; top: 32px;">  
  <span class="ace_identifier">average_cpi</span>
  <span class="ace_punctuation ace_operator">:</span> 
  <span class="ace_paren ace_lparen">{</span>
  <span class="ace_identifier ace_support ace_function">$avg</span>
  <span class="ace_punctuation ace_operator">:</span>
  <span class="ace_string ace_quasi ace_start">"</span>
  <span class="ace_variable">$trends.icecream_cpi</span>
  <span class="ace_string ace_quasi ace_end">"</span>
  <span class="ace_paren ace_rparen">}</span>
</div>
```

`$avg` Agg Operator:
- ace_support.ace_function
- ace_keyword.ace_operator 
- ace_function

$trends.icecream_cpi Field:
- ace_variable
- ace_identifier -> nice as it links back to semantics of `average_cpi`

Base on interpolated strings. JSX mode kind of implements this:

https://github.com/ajaxorg/ace/blob/master/lib/ace/mode/javascript_highlight_rules.js#L375-L391
```js
{
  token : "string.quasi.start",
  regex : /`/,
  push  : [{
      token : "constant.language.escape",
      regex : escapedRe
  }, {
      token : "paren.quasi.start",
      regex : /\${/,
      push  : "start"
  }, {
      token : "string.quasi.end",
      regex : /`/,
      next  : "pop"
  }, {
      defaultToken: "string.quasi"
  }]
}
```

average_cpi
- ace_identifier
- ace_variable.ace_parameter?

### Advanced

$lookup:
- special props at top level: `from`, `let`, `pipeline`

```
...
stageOperator: '$lookup',
stage: `{
  from: "air_airlines",
  let: { maybe_name: "$airlines" },
  pipeline: [
    {
      $match: {
...
```

$and $or conditionals:
- ace_keyword.ace_operator
- ace_keyword.ace_control -> flow control keywords

https://codepen.io/imlucas/pen/eXJOrm

<style>
/**
 * Parens
 * {}[]()
 */
.ace-mongodb .ace_paren {
  font-weight: normal;
  color: blue;
}

/**
 * Quotes around a "field name"
 * "$trends.icecream_cpi"
 */
.ace_string.ace_quasi{
    color: magenta !important;
}

/**
 * Field names
 * _id, average_cpi, etc.
 */
.ace_identifier {
  color: green;
}

/**
 * Aggregation Operators
 * $avg $min $max
 */
.ace-mongodb .ace_support.ace_function {
  color: orange;
}

/**
 * BOILERPLATE BELOW
 */
.ace-mongodb .ace_gutter {
background: #f5f6f7;
color: #999999;
}
.ace-mongodb  {
  border: 1px solid #eee;
  padding: 10px;
  //background: #f5f6f7;
  color: #000;
  font-family: Monaco;
  
}
.ace-mongodb .ace_keyword {
color: #999999;
font-weight: normal;
}
.ace-mongodb .ace_gutter-cell {
padding-left: 5px;
padding-right: 10px;
}
.ace-mongodb .ace_string {
color: #5b81a9;
}
.ace-mongodb .ace_boolean {
color: #5b81a9;
font-weight: normal;
}
.ace-mongodb .ace_constant.ace_numeric {
color: #5b81a9;
}
.ace-mongodb .ace_string.ace_regexp {
color: #5b81a9;
}
.ace-mongodb .ace_variable.ace_class {
color: teal;
}
.ace-mongodb .ace_constant.ace_buildin {
color: #0086B3;
}

/*
.ace-mongodb .ace_support.ace_function {
  color: #0086B3;
}
*/
.ace-mongodb .ace_comment {
color: #998;
font-style: italic;
}
.ace-mongodb .ace_variable.ace_language  {
color: #0086B3;
}
</style>

```html
<div class="ace-mongodb">
  <div class="ace_layer ace_text-layer" style="padding: 0px 4px;">
    <div class="ace_line" style="height:15px">
      <span class="ace_paren ace_lparen">{</span>
    </div>
    <div class="ace_line" style="height:15px">&nbsp;&nbsp;<span class="ace_identifier">_id</span><span class="ace_punctuation ace_operator">:</span><span class="ace_constant ace_numeric"> 0</span><span class="ace_punctuation ace_operator">,</span></div>
    <div class="ace_line" style="height:15px">&nbsp;&nbsp;<span class="ace_identifier">average_cpi</span><span class="ace_punctuation ace_operator">:</span> <span class="ace_paren ace_lparen">{</span><span class="ace_support ace_function">$avg</span><span class="ace_punctuation ace_operator">:</span><span class="ace_string ace_quasi ace_start">"</span><span class="ace_variable ace_language">$trends.icecream_cpi</span><span class="ace_string ace_quasi ace_end">"</span><span class="ace_paren ace_rparen">}</span><span class="ace_punctuation ace_operator">,</span></div>
    <div class="ace_line" style="height:15px">&nbsp;&nbsp;<span class="ace_identifier">max_cpi</span><span class="ace_punctuation ace_operator">:</span><span class="ace_paren ace_lparen">{</span><span class="ace_support ace_function">$max</span><span class="ace_punctuation ace_operator">:</span><span class="ace_string ace_quasi ace_start">"</span><span class="ace_variable ace_language">$trends.icecream_cpi</span><span class="ace_string ace_quasi ace_end">"</span><span class="ace_paren ace_rparen">}</span><span class="ace_punctuation ace_operator">,</span>
      </div>
    <div class="ace_line" style="height:15px">
      &nbsp;&nbsp;<span class="ace_identifier">min_cpi</span><span class="ace_punctuation ace_operator">:</span><span class="ace_paren ace_lparen">{</span><span class="ace_support ace_function">$min</span><span class="ace_punctuation ace_operator">:</span><span class="ace_string ace_quasi ace_start">"</span><span class="ace_variable ace_language">$trends.icecream_cpi</span><span class="ace_string ace_quasi ace_end">"</span><span class="ace_paren ace_rparen">}</span><span class="ace_punctuation ace_operator">,</span></div>
    <div class="ace_line" style="height:15px">
      &nbsp;&nbsp;<span class="ace_identifier">cpi_deviation</span><span class="ace_punctuation ace_operator">:</span><span class="ace_paren ace_lparen">{</span><span class="ace_support ace_function">$stdDevPop</span><span class="ace_punctuation ace_operator">:</span><span class="ace_string ace_quasi ace_start">"</span><span class="ace_variable ace_language">$trends.icecream_cpi</span><span class="ace_string ace_quasi ace_end">"</span><span class="ace_paren ace_rparen">}</span></div>
    <div class="ace_line" style="height:15px"><span class="ace_paren ace_rparen">}</span>
    </div>
  </div>
</div>
```

## License

Apache 2.0

[npm_img]: https://img.shields.io/npm/v/mongodb-ace-mode.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-ace-mode
