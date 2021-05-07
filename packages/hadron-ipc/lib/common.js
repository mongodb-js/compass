'use strict';


exports.getResponseChannel = (methodName) => `hadron-ipc-${methodName}-response`;
