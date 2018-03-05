# BSON-Compilers
Transpilers for building BSON documents in any language.

* https://github.com/antlr/antlr4/blob/master/doc/javascript-target.md
* https://github.com/antlr/grammars-v4

## Environment Setup via Homebrew

* `$ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
* `$ brew install nvm`
* `$ nvm install 8.2.1 && nvm alias default 8.2.1`

## ANTLR4 Setup

* `$ brew cask install java`
* `$ cd /usr/local/lib`
* `$ curl -O http://www.antlr.org/download/antlr-4.7.1-complete.jar`
* `$ export CLASSPATH=".:/usr/local/lib/antlr-4.7.1-complete.jar:$CLASSPATH"`
* `$ alias antlr4='java -Xmx500M -cp "/usr/local/lib/antlr-4.7.1-complete.jar:$CLASSPATH" org.antlr.v4.Tool'`
* `$ alias grun='java org.antlr.v4.gui.TestRig'`

## Testing the installation

* `$ java org.antlr.v4.Tool`

## Generating Lexer, Parser and Listener

* `$ antlr4 <FileName>.g4`

## App Start

* `$ npm run compile && npm start`