// command dontCheckValue
ISODate()
// command dontCheckValue
new ISODate()
// command checkResultClass
new ISODate(1)
// command checkResultClass
new ISODate(1970, 2)
// command checkResultClass
new ISODate(1970, 2, 3, 4, 5)
// command checkResultClass
new ISODate('2012-12-19')
// command checkResultClass
new ISODate('2012-12-19').getTime()
// command checkResultClass
ISODate('2012-12-19T14:00:00+14')
// command checkResultClass
ISODate('2012-12-19T14:05:00+14:05')
// command checkResultClass
ISODate('2012-12-19T14:05:05+14:05:05')
// command checkResultClass
ISODate('20121219')
// command checkResultClass
ISODate('20121219T14:05:05')
// command checkResultClass
ISODate('20121219T140505')
// command checkResultClass
ISODate('2012-12-19T140505')