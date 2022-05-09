/* eslint-disable @mongodb-js/compass/unique-mongodb-log-id */
/* global mongoLogId */
mongoLogId(1);
mongoLogId(2);
mongoLogId(3);
mongoLogId(3); // !dupedLogId
