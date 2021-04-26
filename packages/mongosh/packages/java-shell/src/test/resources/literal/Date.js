// command dontCheckValue
new Date()
// command dontCheckValue
Date()
// command checkResultClass
new Date(1)
// command dontCheckValue
Date(1)
// command checkResultClass
new Date(1970, 2)
// command checkResultClass
new Date(1970, 2, 3, 4, 5)
// command checkResultClass
new Date("2012-12-19T06:01:17.171Z")
// command checkResultClass
new Date("2012-12-19")
// command dontCheckValue
Date("2012-12-19")
// command checkResultClass
new Date({})
// command checkResultClass
new Date("2012-12-19").getTime()