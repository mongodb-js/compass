Query
  = Expression

Expression
  = "{" _ Clause (_ "," Clause)* _ "}"

Clause
  = LeafClause
  // / WhereClause
  // / ExpressionTreeClause
  // / TextClause
  // / CommentClause

LeafClause
  = _ Key _ ":" _ Value _

Value "value"
  = OperatorObject
  / LeafValue

OperatorObject
  = "{" _ Operator (_ "," _ Operator)* _ "}"

Operator "operator"
  = "\"" _ ValueOperator _ "\"" _ ":" _ LeafValue
  / "\"" ListOperator _  "\"" _ ":" _ "[" _ LeafValueList _ "]"

ValueOperator "value-operator"
  = "$gt" / "$gte" / "$lt" / "$lte" / "$eq" / "$ne" / "$type" / "$size" / "$regex" / "$exists"

ListOperator
  = "$in" / "$nin"

Key
  = "\"" _ key:[a-zA-Z0-9]+ _ "\"" { return key.join(''); }

LeafValueList
  = LeafValue _ ( "," _ LeafValueList )*

LeafValue
  = String
  / Number
  / Boolean
  / Null
  / Document
  / Array
  //  / Date
  //  / MinKey
  //  / MaxKey
  //  / RegEx
  //  / Function
  //  / Binary

 String "string"
   = "\"" string:[^\"]* "\"" { return string.join(''); }

 Number "number"
   = digits:([+-]? [0-9]+ ("."[0-9]+)?) { return parseFloat(digits.join(''), 10); }

 Boolean "boolean"
   = "false"
   / "true"

 Null
   = "null"

 Document "document"
   = "{" _ MemberList _ "}"

 MemberList
   = Member _ ("," _ MemberList)*

 Member
   =  _ Key _ ":" _ LeafValue _

 Array "array"
   = "[" _ LeafValueList _ "]"

_ "whitespace"
  = [ \t\n\r]* { return undefined; }
