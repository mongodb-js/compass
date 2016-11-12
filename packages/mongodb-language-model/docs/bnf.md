# BNF for MongoDB Query Language 3.2

```
<query> ::= <expression>

<expression> ::= { <clause-list> }

<clause-list> ::= <clause> |
                  <clause> , <clause-list>

<clause> ::= <expression-tree-clause> |
             <leaf-clause> |
             <where-clause> |
             <text-clause> |
             <comment-clause>

<text-clause> ::= { <text-operator> : { <search-operator> : <string> } } |
                  { <text-operator> : {
                      <search-operator> : <string> ,
                      <language-operator> : <string>,
                      <case-sensitive-operator> : <boolean>,
                      <diacritic-sensitive-operator> : <boolean> } }


<where-clause> ::= { <where-operator> : <string> } |
                   { <where-operator> : <function> }

<comment-clause> ::= { <comment-operator> : <string> }

<expression-tree-clause> ::= { <tree-operator> : [ <expression-list> ] }

<expression-list> ::= <expression> |
                      <expression> , <expression-list>

<leaf-clause> ::= <key> : <value>

<key> ::= <string>

<value> ::= <operator-object> |
            <leaf-value>

<operator-object> ::= { <operator-list> }

<operator-list> ::= <operator> |
                    <operator> , <operator-list>

<operator> ::= <value-operator> : <leaf-value> |
               <array-operator> : [ <leaf-value-list> ] |
               <mod-operator> : [ <divisor> , <remainder> ] |
               <not-operator> : <operator> } |
               <elemmatch-expression-operator> : <expression> |
               <elemmatch-object-operator> : <operator-object>

<value-operator> ::= <gt-operator> |
                     <gte-operator> |
                     <lt-operator> |
                     <lte-operator> |
                     <eq-operator> |
                     <ne-operator> |
                     <type-operator> |
                     <size-operator> |
                     <exists-operator>

<array-operator> ::= <in-operator> |
                     <nin-operator> |

<tree-operator> ::= <or-operator> |
                    <and-operator> |
                    <nor-operator>

<text-operator> ::= "$text"

<search-operator> ::= "$search"

<language-operator> ::= "$language"

<case-sensitive-operator> ::= "$caseSensitive"

<diacritic-sensitive-operator> ::= "$diacriticSensitive"

<gt-operator> ::= "$gt"

<gte-operator> ::= "$gte"

<lt-operator> ::= "$lt"

<lte-operator> ::= "$lte"

<eq-operator> ::= "$eq"

<ne-operator> ::= "$ne"

<type-operator> ::= "$type"

<size-operator> ::= "$size"

<exists-operator> ::= "$exists"

<where-operator> ::= "$where"

<leaf-value> ::=  <double> | <string> | <object> | <array> | <binary> | <undefined> |
                  <object-id> | <boolean> | <date> | <null> | <regex> | <db-pointer> |
                  <javascript> | <symbol> | <javascript-with-scope> | <integer> |
                  <timestamp> | <long> | <min-key> | <max-key>


<document> ::= { <member-list> }

<member-list> ::= <member> |
                  <member> , <member-list>

<member> ::= <key> : <leaf-value>

<array> ::= [ <leaf-value-list> ]

<leaf-value-list> ::= <leaf-value> |
                      <leaf-value> , <leaf-value-list>

```
