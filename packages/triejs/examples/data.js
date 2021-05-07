//test data for city autocomplete
var cities = [
  {city: 'New York', state: 'New York', pop: 8213839, popString: '8,213,839'}
, {city: 'Los Angeles', state: 'California', pop: 3794640, popString: '3,794,640'}
, {city: 'Chicago', state: 'Illinois', pop: 2824584, popString: '2,824,584'}
, {city: 'Houston', state: 'Texas', pop: 2076189, popString: '2,076,189'}
, {city: 'Philadelphia', state: 'Pennsylvania', pop: 1517628, popString: '1,517,628'}
, {city: 'Phoenix', state: 'Arizona', pop: 1476331, popString: '1,476,331'}
, {city: 'San Diego', state: 'California', pop: 1284347, popString: '1,284,347'}
, {city: 'San Antonio', state: 'Texas', pop: 1258733, popString: '1,258,733'}
, {city: 'Dallas', state: 'Texas', pop: 1246185, popString: '1,246,185'}
, {city: 'Detroit', state: 'Michigan', pop: 921147, popString: '921,147'}
, {city: 'San Jose', state: 'California', pop: 908870, popString: '908,870'}
, {city: 'Indianapolis', state: 'Indiana', pop: 789250, popString: '789,250'}
, {city: 'Jacksonville', state: 'Florida', pop: 786938, popString: '786,938'}
, {city: 'San Francisco', state: 'California', pop: 777660, popString: '777,660'}
, {city: 'Columbus', state: 'Ohio', pop: 738782, popString: '738,782'}
, {city: 'Austin', state: 'Texas', pop: 708293, popString: '708,293'}
, {city: 'Memphis', state: 'Tennessee', pop: 680515, popString: '680,515'}
, {city: 'Baltimore', state: 'Maryland', pop: 640064, popString: '640,064'}
, {city: 'Charlotte', state: 'North Carolina', pop: 634059, popString: '634,059'}
, {city: 'Fort Worth', state: 'Texas', pop: 622311, popString: '622,311'}
, {city: 'Boston', state: 'Massachusetts', pop: 609690, popString: '609,690'}
, {city: 'Milwaukee', state: 'Wisconsin', pop: 602057, popString: '602,057'}
, {city: 'El Paso', state: 'Texas', pop: 587400, popString: '587,400'}
, {city: 'Washington', state: 'District of Columbia', pop: 582049, popString: '582,049'}
, {city: 'Nashville-Davidson', state: 'Tennessee', pop: 579748, popString: '579,748'}
, {city: 'Seattle', state: 'Washington', pop: 575719, popString: '575,719'}
, {city: 'Denver', state: 'Colorado', pop: 561323, popString: '561,323'}
, {city: 'Las Vegas', state: 'Nevada', pop: 544806, popString: '544,806'}
, {city: 'Portland', state: 'Oregon', pop: 534093, popString: '534,093'}
, {city: 'Oklahoma City', state: 'Oklahoma', pop: 532006, popString: '532,006'}
, {city: 'Tucson', state: 'Arizona', pop: 528483, popString: '528,483'}
, {city: 'Albuquerque', state: 'New Mexico', pop: 496801, popString: '496,801'}
, {city: 'Atlanta', state: 'Georgia', pop: 483108, popString: '483,108'}
, {city: 'Long Beach', state: 'California', pop: 467851, popString: '467,851'}
, {city: 'Kansas City', state: 'Missouri', pop: 463985, popString: '463,985'}
, {city: 'Fresno', state: 'California', pop: 456574, popString: '456,574'}
, {city: 'New Orleans', state: 'Louisiana', pop: 455188, popString: '455,188'}
, {city: 'Cleveland', state: 'Ohio', pop: 449188, popString: '449,188'}
, {city: 'Sacramento', state: 'California', pop: 448842, popString: '448,842'}
, {city: 'Mesa', state: 'Arizona', pop: 448520, popString: '448,520'}
, {city: 'Virginia Beach', state: 'Virginia', pop: 437464, popString: '437,464'}
, {city: 'Omaha', state: 'Nebraska', pop: 432148, popString: '432,148'}
, {city: 'Colorado Springs', state: 'Colorado', pop: 393795, popString: '393,795'}
, {city: 'Oakland', state: 'California', pop: 392112, popString: '392,112'}
, {city: 'Miami', state: 'Florida', pop: 390768, popString: '390,768'}
, {city: 'Tulsa', state: 'Oklahoma', pop: 381017, popString: '381,017'}
, {city: 'Minneapolis', state: 'Minnesota', pop: 375641, popString: '375,641'}
, {city: 'Honolulu', state: 'Hawaii', pop: 375111, popString: '375,111'}
, {city: 'Arlington', state: 'Texas', pop: 361043, popString: '361,043'}
, {city: 'Wichita', state: 'Kansas', pop: 354524, popString: '354,524'}
, {city: 'St. Louis', state: 'Missouri', pop: 352572, popString: '352,572'}
, {city: 'Raleigh', state: 'North Carolina', pop: 348699, popString: '348,699'}
, {city: 'Santa Ana', state: 'California', pop: 337121, popString: '337,121'}
, {city: 'Cincinnati', state: 'Ohio', pop: 331310, popString: '331,310'}
, {city: 'Anaheim', state: 'California', pop: 329315, popString: '329,315'}
, {city: 'Tampa', state: 'Florida', pop: 325569, popString: '325,569'}
, {city: 'Toledo', state: 'Ohio', pop: 316970, popString: '316,970'}
, {city: 'Pittsburgh', state: 'Pennsylvania', pop: 316206, popString: '316,206'}
, {city: 'Aurora', state: 'Colorado', pop: 296681, popString: '296,681'}
, {city: 'Bakersfield', state: 'California', pop: 291553, popString: '291,553'}
, {city: 'Riverside', state: 'California', pop: 285615, popString: '285,615'}
, {city: 'Stockton', state: 'California', pop: 282015, popString: '282,015'}
, {city: 'Corpus Christi', state: 'Texas', pop: 281290, popString: '281,290'}
, {city: 'Lexington-Fayette', state: 'Kentucky', pop: 278313, popString: '278,313'}
, {city: 'Buffalo', state: 'New York', pop: 277998, popString: '277,998'}
, {city: 'St. Paul', state: 'Minnesota', pop: 276978, popString: '276,978'}
, {city: 'Anchorage', state: 'Alaska', pop: 276863, popString: '276,863'}
, {city: 'Newark', state: 'New Jersey', pop: 276200, popString: '276,200'}
, {city: 'Plano', state: 'Texas', pop: 250357, popString: '250,357'}
, {city: 'Fort Wayne', state: 'Indiana', pop: 249762, popString: '249,762'}
, {city: 'St. Petersburg', state: 'Florida', pop: 247936, popString: '247,936'}
, {city: 'Glendale', state: 'Arizona', pop: 242864, popString: '242,864'}
, {city: 'Lincoln', state: 'Nebraska', pop: 242009, popString: '242,009'}
, {city: 'Norfolk', state: 'Virginia', pop: 237487, popString: '237,487'}
, {city: 'Jersey City', state: 'New Jersey', pop: 236808, popString: '236,808'}
, {city: 'Greensboro', state: 'North Carolina', pop: 236449, popString: '236,449'}
, {city: 'Chandler', state: 'Arizona', pop: 236188, popString: '236,188'}
, {city: 'Birmingham', state: 'Alabama', pop: 232137, popString: '232,137'}
, {city: 'Henderson', state: 'Nevada', pop: 231787, popString: '231,787'}
, {city: 'Scottsdale', state: 'Arizona', pop: 228076, popString: '228,076'}
, {city: 'North Hempstead', state: 'New York', pop: 226669, popString: '226,669'}
, {city: 'Madison', state: 'Wisconsin', pop: 223807, popString: '223,807'}
, {city: 'Hialeah', state: 'Florida', pop: 223164, popString: '223,164'}
, {city: 'Baton Rouge', state: 'Louisiana', pop: 221997, popString: '221,997'}
, {city: 'Chesapeake', state: 'Virginia', pop: 216570, popString: '216,570'}
, {city: 'Orlando', state: 'Florida', pop: 216501, popString: '216,501'}
, {city: 'Lubbock', state: 'Texas', pop: 213089, popString: '213,089'}
, {city: 'Garland', state: 'Texas', pop: 212539, popString: '212,539'}
, {city: 'Akron', state: 'Ohio', pop: 210527, popString: '210,527'}
, {city: 'Rochester', state: 'New York', pop: 209781, popString: '209,781'}
, {city: 'Chula Vista', state: 'California', pop: 209483, popString: '209,483'}
, {city: 'Reno', state: 'Nevada', pop: 206109, popString: '206,109'}
, {city: 'Laredo', state: 'Texas', pop: 205770, popString: '205,770'}
, {city: 'Durham', state: 'North Carolina', pop: 205615, popString: '205,615'}
, {city: 'Modesto', state: 'California', pop: 204077, popString: '204,077'}
, {city: 'Huntington', state: 'New York', pop: 202606, popString: '202,606'}
, {city: 'Montgomery', state: 'Alabama', pop: 200537, popString: '200,537'}
, {city: 'Boise', state: 'Idaho', pop: 200163, popString: '200,163'}
, {city: 'Arlington', state: 'Virginia', pop: 199761, popString: '199,761'}
, {city: 'San Bernardino', state: 'California', pop: 198959, popString: '198,959'}
];

//test data for state autocomplete
var states = [
  "Alabama"
, "Alaska"
, "Arizona"
, "Arkansas"
, "California"
, "Colorado"
, "Connecticut"
, "Delaware"
, "District Of Columbia"
, "Florida"
, "Georgia"
, "Hawaii"
, "Idaho"
, "Illinois"
, "Indiana"
, "Iowa"
, "Kansas"
, "Kentucky"
, "Louisiana"
, "Maine"
, "Maryland"
, "Massachusetts"
, "Michigan"
, "Minnesota"
, "Mississippi"
, "Missouri"
, "Montana"
, "Nebraska"
, "Nevada"
, "New Hampshire"
, "New Jersey"
, "New Mexico"
, "New York"
, "North Carolina"
, "North Dakota"
, "Ohio"
, "Oklahoma"
, "Oregon"
, "Pennsylvania"
, "Rhode Island"
, "South Carolina"
, "South Dakota"
, "Tennessee"
, "Texas"
, "Utah"
, "Vermont"
, "Virginia"
, "Washington"
, "West Virginia"
, "Wisconsin"
, "Wyoming"
];

var names = [
"Jacob"
, "Isabella"
, "Ethan"
, "Sophia"
, "Michael"
, "Emma"
, "Jayden"
, "Olivia"
, "William"
, "Ava"
, "Alexander"
, "Emily"
, "Noah"
, "Abigail"
, "Daniel"
, "Madison"
, "Aiden"
, "Chloe"
, "Anthony"
, "Mia"
, "Joshua"
, "Addison"
, "Mason"
, "Elizabeth"
, "Christopher"
, "Ella"
, "Andrew"
, "Natalie"
, "David"
, "Samantha"
, "Matthew"
, "Alexis"
, "Logan"
, "Lily"
, "Elijah"
, "Grace"
, "James"
, "Hailey"
, "Joseph"
, "Alyssa"
, "Gabriel"
, "Lillian"
, "Benjamin"
, "Hannah"
, "Ryan"
, "Avery"
, "Samuel"
, "Leah"
, "Jackson"
, "Nevaeh"
, "John"
, "Sofia"
, "Nathan"
, "Ashley"
, "Jonathan"
, "Anna"
, "Christian"
, "Brianna"
, "Liam"
, "Sarah"
, "Dylan"
, "Zoe"
, "Landon"
, "Victoria"
, "Caleb"
, "Gabriella"
, "Tyler"
, "Brooklyn"
, "Lucas"
, "Kaylee"
, "Evan"
, "Taylor"
, "Gavin"
, "Layla"
, "Nicholas"
, "Allison"
, "Isaac"
, "Evelyn"
, "Brayden"
, "Riley"
, "Luke"
, "Amelia"
, "Angel"
, "Khloe"
, "Brandon"
, "Makayla"
, "Jack"
, "Aubrey"
, "Isaiah"
, "Charlotte"
, "Jordan"
, "Savannah"
, "Owen"
, "Zoey"
, "Carter"
, "Bella"
, "Connor"
, "Kayla"
, "Justin"
, "Alexa"
, "Jose"
, "Peyton"
, "Jeremiah"
, "Audrey"
, "Julian"
, "Claire"
, "Robert"
, "Arianna"
, "Aaron"
, "Julia"
, "Adrian"
, "Aaliyah"
, "Wyatt"
, "Kylie"
, "Kevin"
, "Lauren"
, "Hunter"
, "Sophie"
, "Cameron"
, "Sydney"
, "Zachary"
, "Camila"
, "Thomas"
, "Jasmine"
, "Charles"
, "Morgan"
, "Austin"
, "Alexandra"
, "Eli"
, "Jocelyn"
, "Chase"
, "Gianna"
, "Henry"
, "Maya"
, "Sebastian"
, "Kimberly"
, "Jason"
, "Mackenzie"
, "Levi"
, "Katherine"
, "Xavier"
, "Destiny"
, "Ian"
, "Brooke"
, "Colton"
, "Trinity"
, "Dominic"
, "Faith"
, "Juan"
, "Lucy"
, "Cooper"
, "Madelyn"
, "Josiah"
, "Madeline"
, "Luis"
, "Bailey"
, "Ayden"
, "Payton"
, "Carson"
, "Andrea"
, "Adam"
, "Autumn"
, "Nathaniel"
, "Melanie"
, "Brody"
, "Ariana"
, "Tristan"
, "Serenity"
, "Diego"
, "Stella"
, "Parker"
, "Maria"
, "Blake"
, "Molly"
, "Oliver"
, "Caroline"
, "Cole"
, "Genesis"
, "Carlos"
, "Kaitlyn"
, "Jaden"
, "Eva"
, "Jesus"
, "Jessica"
, "Alex"
, "Angelina"
, "Aidan"
, "Valeria"
, "Eric"
, "Gabrielle"
, "Hayden"
, "Naomi"
, "Bryan"
, "Mariah"
, "Max"
, "Natalia"
, "Jaxon"
, "Paige"
, "Brian"
, "Rachel"
];
