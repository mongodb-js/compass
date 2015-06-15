# BNF for MongoDB Query Language

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
                  { <text-operator> : { <search-operator> : <string> , <language-operator> : <language> } }

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

<operator> ::= { <value-operator> : <leaf-value> } | 
               { <array-operator> : [ <leaf-value-list> ] } | 
               { <mod-operator> : [ <divisor> , <remainder> ] } | 
               { <not-operator> : <operator> } | 
               { <elemmatch-expression-operator> : <expression> } | 
               { <elemmatch-object-operator> : <operator-object> }

<value-operator> ::= <gt-operator> | 
                     <gte-operator> | 
                     <lt-operator> | 
                     <lte-operator> | 
                     <eq-operator> | 
                     <ne-operator> |
                     <type-operator> | 
                     <size-operator> |
                     <regex-operator> | 
                     <exists-operator>

<array-operator> ::= <in-operator> | 
                     <nin-operator> | 

<tree-operator> ::= <or-operator> | 
                    <and-operator> |
                    <nor-operator>

<leaf-value> ::= <string> | <number> | <date> | <boolean> | <date> | <min-key> | <max-key> | 
                 <null> | <regex> | <function> | <binary> | <document> | <array>

<document> ::= { <member-list> }

<member-list> ::= <member> | 
                  <member> , <member-list>

<member> ::= <key> : <leaf-value>

<array> ::= [ <leaf-value-list> ]

<leaf-value-list> ::= <leaf-value> | 
                      <leaf-value> , <leaf-value-list>

```
