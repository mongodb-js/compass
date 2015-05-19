// var toTitleCase = require('titlecase'),

// function niceSubdomain(s){
//   try{
//     var host = s.split(':')[0],
//       sub = host.split('.')[0];

//     return toTitleCase(sub.replace(/-/g, ' '));
//   }
//   catch(e){
//     return s;
//   }
// }
// Deployment.prototype.generateNames = function(){
//   if(this.hasReplication()){
//     var shortened = namer(this.getInstanceIds()),
//       nice = niceSubdomain(shortened.sequence);

//     // Handle replicaset of 1
//     if(!nice) nice = this._id;

//     this.name = (this.sharding ? 'cluster' : 'replicaset') + ' on ' + nice;

//     var seenByType = {};

//     shortened.names.map(function(s, i){
//       var instance = this.instances[i],
//         type = instance.type || instance.shard || instance.state;

//       if(!seenByType[type]) seenByType[type] = 0;
//       seenByType[type]++;

//       this.instances[i].name = type +'.'+ seenByType[type].toString();
//     }.bind(this));
//   }
//   else {
//     this.name = niceSubdomain(this._id);
//     if(/^\d+$/.test(this.name)){
//       debug('just an ip address :(');
//         this.name = this._id;
//     }
//     this.instances[0].name = this.name;
//   }
// };

module.exports = function(names){
  var o = overlap(names);
  if(o.length === 0){
    return names;
  }

  o.names = names.map(function(name){
    return name.replace(o.sequence, '');
  });
  return o;
};

function longestCommonSubstring(str1, str2){
  if (!str1 || !str2){
    return {
      length: 0,
      sequence: "",
      offset: 0
    };
  }

  var sequence = "",
    str1Length = str1.length,
    str2Length = str2.length,
    num = new Array(str1Length),
    maxlen = 0,
    lastSubsBegin = 0;

  for (var i = 0; i < str1Length; i++){
    var subArray = new Array(str2Length);
    for (var j = 0; j < str2Length; j++){
      subArray[j] = 0;
    }
    num[i] = subArray;
  }
  var thisSubsBegin = null;
  for (var i = 0; i < str1Length; i++){
    for (var j = 0; j < str2Length; j++){
      if (str1[i] !== str2[j]){
        num[i][j] = 0;
      }
      else{
        if ((i === 0) || (j === 0)){
          num[i][j] = 1;
        }
        else {
          num[i][j] = 1 + num[i - 1][j - 1];
        }

        if (num[i][j] > maxlen){
          maxlen = num[i][j];
          thisSubsBegin = i - num[i][j] + 1;
          if (lastSubsBegin === thisSubsBegin){ //if the current LCS is the same as the last time this block ran
            sequence += str1[i];
          }
          //this block resets the string builder if a different LCS is found
          else {
            lastSubsBegin = thisSubsBegin;
            sequence= "";
            sequence += str1.substr(lastSubsBegin, (i + 1) - lastSubsBegin);
          }
        }
      }
    }
  }
  return {
    length: maxlen,
    sequence: sequence,
    offset: thisSubsBegin
  };
}

function overlap(names){
  var res = {length: 1000000};

  for(var i=0; i<names.length-1; i++){
    var r = longestCommonSubstring(names[i].split(':')[0], names[i+1].split(':')[0]);
    if(r.length === 0){
      res = null;
      break;
    }
    if(r.length < res.length){
      res = r;
    }
  }
  return res;
}
