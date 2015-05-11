# Dev Guide

## npm scripts

### Install

To install all dependencies for the server and the ui:

```
npm install
```

### Testing

> @todo: needs updated


### Distribution

> @todo: needs updated

### Deployment

> @todo: needs updated

## Common Questions

### How do I get setup?

- Install [nodejs][nodejs] and [mongodb][mongodb]
- `git clone git@github.com:10gen/scout.git`
- `npm npm install`
- Start the server `npm start`

### I edited a `.jade` file.  Now what?

@todo: needs updated

### How do I add a new page?

@todo: needs updated

### How do I change the color of that thing?

Please don't.  To keep things as consistent as possible, we use the
variables available to atom editor themes.  `less/variables.less`
maps the atom variables to bootstrap variables and a full list
is available in [the patternlib][less-variables].

### How do I add new features?

> @todo: needs update

### How do I edit copy?

> @todo: needs update

### How do I run the tests?

> @todo: needs update

### How do I add a new test?

> @todo: needs update

## Dev Dependencies

There are a few dev dependencies that will be installed you might be
interested that make developing mongoscope a complete joy.

### Gulp

[Gulp][gulp] is a build tool like grunt or
broccoli, or Make and scons if you don't usually work with JS. Gulp is
different from other JS tools in that it is streams centric and just
javascript. Unlike grunt, you don't have massive config objects you must
conform to; it takes a code over configuration approach much like Make.
If you're interested in learning more,
[here is a very detailed example][gulp-intro].

### Jade

[Jade][jade] is our templating language
of choice.  Jade is great because:

- light enough to use on the client via browserify
- robust enough to use on the server (e.g. support for layouts and blocks)
- whitespace significant -> no "I forgot to close a tag" bugs
- no clumsy separation and helper assignment like handlebars (<3 mixins!)

### LESS

CSS is compiled from [LESS][less] files, which is great because:

- Use real variables
- File imports
- Declarative property nesting
- Source map support
- Composable with other modules

Like MMS, mongoscope uses [bootstrap 3][bootstrap]
as the base for grid, components, and type and
[font awesome][font-awesome] as the base
for glyphs.

### Browserify

Javascript is compiled by [browserify][browserify] which works
kind of like this:

- given an entry point like `ui/app/index.js`
- follows the dependency graph opened from the entry point
- resolve dependencies from `node_modules/`
- puts all sources in one file
- each file of the graph in its own closure/scope

browserify is a huge win because we can write our client side code
exactly like our server code (minimized context switching cost) and
easily reuse modules between the server, the ui and other teams
(check out the
[mongodb.js keyword][mongodb.js] on npm).

For more details, here are some slides from a
[talk @ Mongodb][browserify talk]
on npm and browserify.


## Tools

### [iTerm2](http://www.iterm2.com/)

For a better terminal on OSX.  Have a look at the
[highlights for new users](http://www.iterm2.com/#/section/documentation)
for why.

### [Sublime Text](http://sublimetext.com/3)

The editor you're probably already using.  If you haven't yet,
you should also setup
[Sublime Package Control](https://sublime.wbond.net/installation)
to make your life much easier.  Some recommended packages to install:

- [better coffeescript](https://sublime.wbond.net/packages/Better%20CoffeeScript)
  syntax highlighting for coffeescript (what to write tests in)
- [hexviewer](https://sublime.wbond.net/packages/HexViewer) because you'll need
  to look at binaries from time to time to figure out how something works
- [guttercolor](https://sublime.wbond.net/packages/Gutter%20Color) adds a
  preview of hexcodes in LESS files, takes a bit to get running smoothly
- [jade](https://sublime.wbond.net/packages/Jade) syntax highlighting for
  the templating language scope uses
- [less](https://sublime.wbond.net/packages/LESS) syntax highlighting for css
  pre-processor scope uses
- [markdown preview](https://sublime.wbond.net/packages/Markdown%20Preview) use
  markdown for everything, check it looks right
- [wrap plus](https://sublime.wbond.net/packages/Wrap%20Plus) [super+alt+q]
  to make any code wrap at column 80
- [sublimelinter](https://sublime.wbond.net/packages/SublimeLinter) invaluable.
  lints your code in any language that cuts down on so many bugs it's silly.
- [sublimelinter - jshint](https://sublime.wbond.net/packages/SublimeLinter-jshint)
  extra package for linting js in sublimelinter
- [Table Editor](https://sublime.wbond.net/packages/Table%20Editor)
  [ctrl+shift+a] to align/format plain text tables, lots of other handy
  commands (add row, add column, next row, etc)
- [CheckBounce](https://sublime.wbond.net/packages/CheckBounce) well integrated
  spell checker because typos are embarassing
- [Theme - soda](https://sublime.wbond.net/packages/Theme%20-%20Soda) a smoother
  theme that's easier on the eyes

Recommended user preferences, particularly `ensure_newline_at_eof_on_save`,
`tab_size`, `rulers`, `translate_tabs_to_spaces`, and
`trim_trailing_white_space_on_save` have shown to result in better code:

```json
{
  "auto_find_in_selection": true,
  "auto_match_enabled": false,
  "bold_folder_labels": true,
  "caret_style": "phase",
  "color_scheme": "Packages/User/Monokai (SL).tmTheme",
  "ensure_newline_at_eof_on_save": true,
  "font_face": "Ubuntu Mono",
  "font_options":
  [
    "subpixel_antialias"
  ],
  "font_size": 17,
  "highlight_line": true,
  "highlight_modified_tabs": true,
  "ignored_packages":
  [
    "Vintage"
  ],
  "line_padding_bottom": 1,
  "line_padding_top": 1,
  "open_files_in_new_window": false,
  "rulers":
  [
    72,
    80
  ],
  "tab_size": 2,
  "theme": "Soda Dark 3.sublime-theme",
  "translate_tabs_to_spaces": true,
  "trim_trailing_white_space_on_save": true,
  "use_simple_full_screen": true,
  "word_wrap": true
}
```

[nodejs]: http://nodejs.org/
[mongodb]: http://www.mongodb.org/downloads
[less]: http://lesscss.org
[gulp]: http://gulpjs.com
[bootstrap]: http://getbootstrap.com
[coffeescript]: http://coffeescript.org
[mocha]: http://visionmedia.github.io/mocha/
[jade]: http://github.com/visionmedia/jade
[browserify]: http://browserify.org
[font-awesome]: http://fortawesome.github.io/Font-Awesome/

[mongodb.js]: https://www.npmjs.org/browse/keyword/mongodb.js
[browserify talk]: http://imlucas.github.io/talks/mongo_052014/static/index.html
[patternlib]: http://10gen.github.io/mongoscope/patternlib.html
[less-variables]: http://10gen.github.io/scout/patternlib.html#less-variables
[gulp-intro]: http://julienrenaux.fr/2014/05/25/introduction-to-gulp-js-with-practical-examples/
