/* --- General Query Structure and Logical Expression Trees --- */
query
  = expression

expression
  = begin_object clauses:clause_list end_object
    { return { pos: "expression", clauses: clauses !== null ? clauses : [] }; }

clause_list
  = (
      head:clause tail:(value_separator c:clause { return c; })*
      { return [head].concat(tail); }
    )?

clause
  = leaf_clause
  / expression_tree_clause
  / expression_clause
  / where_clause
  / text_clause
  // / comment_clause

text_clause
  = quotation_mark text_operator quotation_mark name_separator text_options:text_options
  {
    return { pos: "text-clause", search: text_options.search };
  }
text_options
  = begin_object quotation_mark search_operator quotation_mark name_separator search:string (value_separator text_options_optional)? end_object
  { return { search: search}; }

text_options_value
  = string / true / false

text_options_optional
  = (
    quotation_mark text_optional_operator quotation_mark name_separator value: text_options_value
    { return { value: value }; }
  )*

expression_tree_clause
  = quotation_mark operator:expression_tree_operator quotation_mark name_separator begin_array expressions:expression_list end_array
  { return { pos: "expression-tree-clause", operator: operator, expressions: expressions }; }

expression_tree_operator
  = "$or" / "$nor" / "$and"

expression_clause
  = quotation_mark expression_operator quotation_mark name_separator begin_object operator end_object
  { return { pos: "expression-clause" }; }

expression_operator
  = "$expr"

expression_list
  = expressions:(
      head:expression tail:(value_separator e:expression { return e; })*
      { return [head].concat(tail); }
    )?
    { return expressions !== null ? expressions : []; }

where_clause
  = quotation_mark where_operator quotation_mark name_separator value:string
  { return {pos: "where-clause", type: "string", value: value }; }

leaf_clause
  = key:key name_separator value:value
    { return { pos: "leaf-clause", key: key, value: value }; }

value
  = operator_expression
  / JSON


/* --- Operators --- */

value_operator
  = "$gte" /
    "$gt" /
    "$lte" /
    "$lt" /
    "$eq" /
    "$ne" /
    "$type" /
    "$size" /
    "$exists" /
    "$bitsAllClear" /
    "$bitsAllSet" /
    "$bitsAnyClear" /
    "$bitsAnySet"

list_operator
  = "$in" / "$nin" / "$all" / "$mod"

operator_expression_operator
  = "$not" / "$elemMatch"

operator_expression
  = begin_object operators:operator_list end_object
    { return { pos: "operator-expression", operators: operators !== null ? operators : [] }; }

operator_list
  = head:operator
    tail:(value_separator o:operator { return o; })*
    { return [head].concat(tail); }

operator
  // value-operator
  = quotation_mark operator:value_operator quotation_mark name_separator value:JSON
  { return { pos: "value-operator", operator: operator, value: value }; }
  // list-operator
  / quotation_mark operator:list_operator quotation_mark name_separator begin_array values:leaf_value_list end_array
  { return { pos: "list-operator", operator: operator, values: values }; }
  // elemmatch-expression-operator
  / quotation_mark "$elemMatch" quotation_mark name_separator expression:expression
  { return { pos: "elemmatch-expression-operator", expression: expression } }
  // operator-expression-operator
  / quotation_mark operator:operator_expression_operator quotation_mark name_separator opobject:operator_expression
  { return { pos: "operator-expression-operator", operator: operator, operators: opobject.operators } }
  // special case for $not accepting $regex
  / quotation_mark "$not" quotation_mark name_separator regexobject:ejson_regex
  { return { pos: "operator-expression-operator", operator: "$not", operators: regexobject } }
  // geo-within-operator
  / quotation_mark "$geoWithin" quotation_mark name_separator shape:shape
  { return { pos: "geo-within-operator", operator: "$geoWithin", shape: shape }; }
  // geo-intersects-operator
  / quotation_mark "$geoIntersects" quotation_mark name_separator geometry:geometry
  { return { pos: "geo-intersects-operator", operator: "$geoIntersects", geometry: geometry }; }
  // near-operator
  / quotation_mark near_operator:("$nearSphere" / "$near") quotation_mark name_separator value:(geometry_point / legacy_coordinates)
  { return { pos: "near-operator", operator: near_operator, value: value }; }
  // min-distance-operator
  / quotation_mark operator:distance_operator quotation_mark name_separator value:number_positive
  { return { pos: "distance-operator", operator: operator, value: value }; }

/* --- Geo Operators --- */
distance_operator
  = "$minDistance" / "$maxDistance"

shape
  = geometry
  / legacy_shape

geometry
  = begin_object
      quotation_mark "$geometry" quotation_mark name_separator
      begin_object
        members:(
          type:(
            quotation_mark "type" quotation_mark
            name_separator quotation_mark type:geometry_type quotation_mark
            { return type; }
          )
          coordinates:(
            value_separator quotation_mark "coordinates" quotation_mark
            name_separator coordinates:geometry_coordinates
            { return coordinates; }
          )
          { return { "type": type, "coordinates": coordinates }; }
        )
      end_object
    end_object
    { return { "$geometry": members }; }

geometry_point
  = begin_object
      quotation_mark "$geometry" quotation_mark name_separator
      begin_object
        geometry:(
          type:(
            quotation_mark "type" quotation_mark
            name_separator quotation_mark type:"Point" quotation_mark
            { return type; }
          )
          coordinates:(
            value_separator quotation_mark "coordinates" quotation_mark
            name_separator coordinates:legacy_coordinates
            { return coordinates; }
          )
          { return { "type": type, "coordinates": coordinates }; }
        )
      end_object
      distance:(
        value_separator quotation_mark operator:distance_operator quotation_mark
        name_separator value:number_positive
        { 
          var result = {};
          result[operator] = value;
          return result;
        }
      )*
    end_object
    {
      var result = distance || {};
      distance.$geometry = geometry;
      return result;
    }

geometry_type
  = "Polygon"
  / "MultiPolygon"

geometry_coordinates
  = begin_array
    values:(
      // number or "recursive" geometry_coordinates
      head:(number/geometry_coordinates) tail:(value_separator v:(number/geometry_coordinates) { return v; })*
      { return [head].concat(tail); }
    )?
    end_array

legacy_coordinates
  = begin_array
    number_longitude value_separator
    number_latitude
    end_array

legacy_shape
  = center_shape
  / polygon_shape
  / box_shape

center_shape
  = begin_object
    quotation_mark center_operator:("$centerSphere" / "$center") quotation_mark name_separator
    parameters:$(begin_array
      begin_array
        number value_separator number
        end_array
        value_separator
        number
    end_array)
    end_object
    {
      var res = {};
      res[center_operator] = JSON.parse(parameters);
      return res;
    }

box_shape
  = begin_object
    quotation_mark "$box" quotation_mark name_separator
    parameters:$(begin_array
      begin_array
          number value_separator number
        end_array
        value_separator
        begin_array
            number value_separator number
    end_array
    end_array)
    end_object
    { return {"$box": JSON.parse(parameters)}; }


polygon_shape
  = begin_object
    quotation_mark "$polygon" quotation_mark name_separator
    parameters:$(begin_array
      head:(begin_array
          number value_separator number
        end_array)
        tail:(value_separator
        begin_array
            number value_separator number
    end_array)*
    end_array
    { return [head].concat(tail); })
    end_object
    { return {"$polygon": JSON.parse(parameters)}; }

where_operator = "$where"

text_operator = "$text"

search_operator = "$search"

text_optional_operator = "$language" / "$caseSensitive" / "$diacriticSensitive"

case_sensitive_operator = "$caseSensitive"

diacritic_sensitive_operator = "$diacriticSensitive"

leaf_value_list
  = values:(
      head:JSON tail:(value_separator v:JSON { return v; })*
      { return [head].concat(tail); }
    )?
    { return values !== null ? values : []; }

// field name limitations: https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
// no "." no null character and does not start with "$"
// assuming at least 1 character
key
  = quotation_mark key:([^$] [^\x00"]*) quotation_mark { return key[0] + key[1].join(''); }


/*
 * JSON Grammar
 * ============
 *
 * Based on the grammar from RFC 7159 [1].
 *
 * Note that JSON is also specified in ECMA-262 [2], ECMA-404 [3], and on the
 * JSON website [4] (somewhat informally). The RFC seems the most authoritative
 * source, which is confirmed e.g. by [5].
 *
 * [1] http://tools.ietf.org/html/rfc7159
 * [2] http://www.ecma-international.org/publications/standards/Ecma-262.htm
 * [3] http://www.ecma-international.org/publications/standards/Ecma-404.htm
 * [4] http://json.org/
 * [5] https://www.tbray.org/ongoing/When/201x/2014/03/05/RFC7159-JSON
 */

/* ----- 2. JSON Grammar ----- */

JSON
  = _ value:leaf_value _
  { return { pos: 'leaf-value', value: value }; }

begin_array     = _ "[" _
begin_object    = _ "{" _
end_array       = _ "]" _
end_object      = _ "}" _
name_separator  = _ ":" _
value_separator = _ "," _

_ "whitespace" = [ \t\n\r]*

/* ----- 3. Values ----- */

leaf_value
  = false
  / null
  / true
  / object
  / array
  / number
  / string
  / extended_json_value

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }


extended_json_value
  = ejson_regex
  / ejson_objectid
  / ejson_minkey
  / ejson_maxkey
  / ejson_long
  / ejson_decimal
  / ejson_date
  / ejson_timestamp
  / ejson_binary
  / ejson_dbref
  / ejson_undefined

ejson_objectid
  = begin_object
    quotation_mark "$oid" quotation_mark
    name_separator quotation_mark string:hexdig24 quotation_mark
    end_object
    { return {"$oid": string }; }

hexdig24
  = digits:(HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG
            HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG
            HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG)
    { return digits.join(''); }

ejson_minkey
  = begin_object
    quotation_mark "$minKey" quotation_mark
    name_separator ("1" / "true")
    end_object
    { return {"$minKey": 1 }; }

ejson_maxkey
  = begin_object
    quotation_mark "$maxKey" quotation_mark
    name_separator ("1" / "true")
    end_object
    { return {"$maxKey": 1 }; }

ejson_long
  = begin_object
    quotation_mark "$numberLong" quotation_mark
    name_separator quotation_mark digits:((plus / minus / DIGIT)+) quotation_mark
    end_object
    { return {"$numberLong": digits.join('') }; }

ejson_decimal
  = begin_object
    quotation_mark "$numberDecimal" quotation_mark
    name_separator number:(quotation_mark number quotation_mark)
    end_object
    { return {"$numberDecimal": number }; }

ejson_date
  = begin_object
    quotation_mark "$date" quotation_mark name_separator
    date:(ejson_iso8601_date / ejson_numberlong_date)
    end_object
    { return {"$date": date }; }

ejson_iso8601_date
  = quotation_mark date:$(iso_date_time) quotation_mark
    { return date; }

ejson_numberlong_date
  = ejson_long

ejson_undefined
  = begin_object
    quotation_mark "$undefined" quotation_mark
    name_separator "true"
    end_object
    { return {"$undefined": true }; }

ejson_dbref
  = begin_object
    members:(
      ref:(
        quotation_mark "$ref" quotation_mark
        name_separator string:string
        { return string; }
      )
      id:(
        value_separator quotation_mark "$id" quotation_mark
        name_separator value:leaf_value
        {return value; }
      )
      db:(
        value_separator quotation_mark "$db" quotation_mark
        name_separator string:string
        {return string; }
      )?
      {
        var result = {"$ref": ref, "$id": id};
        if (db !== null) result["$db"] = db;
        return result;
      }
    )
    end_object
    { return members; }

ejson_regex
  = begin_object
    members:(
      regex:(
        quotation_mark "$regex" quotation_mark
        name_separator string:string
        { return string; }
      )
      options:(
        value_separator quotation_mark "$options" quotation_mark
        name_separator quotation_mark options:[gims]* quotation_mark
        {return options.join(''); }
      )?
      { return {"$regex": regex, "$options": options ? options : ""}; }
    )
    end_object
    { return members; }

ejson_binary
  = begin_object
    members:(
      binary:(
        quotation_mark "$binary" quotation_mark
        name_separator string:string
        { return string; }
      )
      type:(
        value_separator quotation_mark "$type" quotation_mark
        name_separator quotation_mark type:HEXDIG quotation_mark
        {return type; }
      )
      { return {"$binary": binary, "$type": type}; }
    )
    end_object
    { return members; }

ejson_timestamp
  = begin_object
      quotation_mark "$timestamp" quotation_mark name_separator
      object:(begin_object
        quotation_mark "t" quotation_mark name_separator t:number value_separator
        quotation_mark "i" quotation_mark name_separator i:number
      end_object
      { return {"t": t, "i": i}; })
    end_object
    { return {"$timestamp": object }; }


/* ----- 4. Objects ----- */

object
  = begin_object
    members:(
      head:member tail:(value_separator m:member { return m; })*
      {
        var result = {};
        [head].concat(tail).forEach(function(element) {
          result[element.name] = element.value;
        });
        return result;
      }
    )?
    end_object
    { return members !== null ? members : {}; }

member
  = name:key name_separator value:leaf_value {
      return { name: name, value: value };
    }

/* ----- 5. Arrays ----- */

array
  = begin_array
    values:(
      head:leaf_value tail:(value_separator v:leaf_value { return v; })*
      { return [head].concat(tail); }
    )?
    end_array
    { return values !== null ? values : []; }

array_number
  = begin_array
    values:(
      head:number tail:(value_separator v:number { return v; })*
      { return [head].concat(tail); }
    )?
    end_array
    { return values !== null ? values : []; }

/* ----- 6. Numbers ----- */

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

number_positive
  = int frac? exp? { return parseFloat(text()); }

// A numeric value that represents a longitude coordinate (to any precision between -180.0 and 180.0, inclusive)
// Converted to PEG syntax from this regex: ^-?(180(\.0)?|(1[0-7]\d|[1-9]?\d)(\.(0|\d*[1-9]))?)$
// Taking into account PEG's greedy behaviour and lack of backtracking.
number_longitude
  = minus? (
    "180"(decimal_point zero)?
    / (
        (("1" [0-7] DIGIT / digit1_9 DIGIT / DIGIT) decimal_point int*)
        / (("1" [0-7] DIGIT / digit1_9 DIGIT / DIGIT))
      )
  )

// A numeric value that represents a latitude coordinate (to any precision between -90.0 and 90.0, inclusive)
// Converted to PEG syntax from regex: ^-?(90(\.0)?|([1-8]?\d)(\.(0|\d*[1-9]))?)$
// Taking into account PEG's greedy behaviour and lack of backtracking.
number_latitude
  = minus? (
    "90"(decimal_point zero)?
    / (
        ((digit1_9 DIGIT / DIGIT) decimal_point int*)
        / ((digit1_9 DIGIT / DIGIT))
      )
  )

decimal_point = "."
digit1_9      = [1-9]
e             = [eE]
exp           = e (minus / plus)? DIGIT+
frac          = decimal_point DIGIT+
int           = zero / (digit1_9 DIGIT*)
minus         = "-"
plus          = "+"
zero          = "0"

/* ----- 7. Strings ----- */

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG)
      { return String.fromCharCode(parseInt(digits, 16)); }
    )
    { return sequence; }

escape         = "\\"
quotation_mark = '"'
unescaped      = [^\0-\x1F\x22\x5C]

/* ----- Core ABNF Rules ----- */

/* See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4627). */
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i


/*
 * Data elements and interchange formats – Information interchange – Representation of dates and times
 *
 * https://en.wikipedia.org/wiki/ISO_8601
 * http://tools.ietf.org/html/rfc3339
 *
 * @append ietf/rfc5234-core-abnf.pegjs
 */

 /* http://tools.ietf.org/html/rfc3339#appendix-A ISO 8601 Collected ABNF */
 /* Date */
 date_century
   // 00-99
   = $(DIGIT DIGIT)

 date_decade
   // 0-9
   = DIGIT

 date_subdecade
   // 0-9
   = DIGIT

 date_year
   = date_decade date_subdecade

 date_fullyear
   = date_century date_year

 date_month
   // 01-12
   = $(DIGIT DIGIT)

 date_wday
   // 1-7
   // 1 is Monday, 7 is Sunday
   = DIGIT

 date_mday
   // 01-28, 01-29, 01-30, 01-31 based on
   // month/year
   = $(DIGIT DIGIT)

 date_yday
   // 001-365, 001-366 based on year
   = $(DIGIT DIGIT DIGIT)

 date_week
   // 01-52, 01-53 based on year
   = $(DIGIT DIGIT)

 datepart_fullyear
   = date_century? date_year "-"?

 datepart_ptyear
   = "-" (date_subdecade "-"?)?

 datepart_wkyear
   = datepart_ptyear
   / datepart_fullyear

 dateopt_century
   = "-"
   / date_century

 dateopt_fullyear
   = "-"
   / datepart_fullyear

 dateopt_year
   = "-"
   / date_year "-"?

 dateopt_month
   = "-"
   / date_month "-"?

 dateopt_week
   = "-"
   / date_week "-"?

 datespec_full
   = datepart_fullyear date_month "-"? date_mday

 datespec_year
   = date_century
   / dateopt_century date_year

 datespec_month
   = "-" dateopt_year date_month ("-"? date_mday)

 datespec_mday
   = "--" dateopt_month date_mday

 datespec_week
   = datepart_wkyear "W" (date_week / dateopt_week date_wday)

 datespec_wday
   = "---" date_wday

 datespec_yday
   = dateopt_fullyear date_yday

 date
   = datespec_full
   / datespec_year
   / datespec_month
   / datespec_mday
   / datespec_week
   / datespec_wday
   / datespec_yday


 /* Time */
 time_hour
   // 00-24
   = $(DIGIT DIGIT)

 time_minute
   // 00-59
   = $(DIGIT DIGIT)

 time_second
   // 00-58, 00-59, 00-60 based on
   // leap-second rules
   = $(DIGIT DIGIT)

 time_fraction
   = ("," / ".") $(DIGIT+)

 time_numoffset
   = ("+" / "-") time_hour (":"? time_minute)?

 time_zone
   = "Z"
   / time_numoffset

 timeopt_hour
   = "-"
   / time_hour ":"?

 timeopt_minute
   = "-"
   / time_minute ":"?

 timespec_hour
   = time_hour (":"? time_minute (":"? time_second)?)?

 timespec_minute
   = timeopt_hour time_minute (":"? time_second)?

 timespec_second
   = "-" timeopt_minute time_second

 timespec_base
   = timespec_hour
   / timespec_minute
   / timespec_second

 time
   = timespec_base time_fraction? time_zone?

 iso_date_time
   = date "T" time


 /* Durations */
 dur_second
   = DIGIT+ "S"

 dur_minute
   = DIGIT+ "M" dur_second?

 dur_hour
   = DIGIT+ "H" dur_minute?

 dur_time
   = "T" (dur_hour / dur_minute / dur_second)

 dur_day
   = DIGIT+ "D"
 dur_week
   = DIGIT+ "W"
 dur_month
   = DIGIT+ "M" dur_day?

 dur_year
   = DIGIT+ "Y" dur_month?

 dur_date
   = (dur_day / dur_month / dur_year) dur_time?

 duration
   = "P" (dur_date / dur_time / dur_week)


 /* Periods */
 period_explicit
   = iso_date_time "/" iso_date_time

 period_start
   = iso_date_time "/" duration

 period_end
   = duration "/" iso_date_time

 period
   = period_explicit
   / period_start
   / period_end
