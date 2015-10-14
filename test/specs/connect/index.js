var assert = require('assert');

function* connect(model){
  if(model.hostname){
    yield browser.setValue('[name=hostname]', model.hostname);
  }
  if(model.port){
    yield browser.setValue('[name=port]', model.port);
  }
  if(model.name){
    yield browser.setValue('[name=name]', model.name);
  }

  yield browser.click('[data-hook=submit-button]');
}

describe('Connect', function() {
  it('should open the connect dialog', function* () {
    var title = yield browser.getTitle();
    assert.equal(title, 'Connect to MongoDB');
  });

  it('should fail to connect to localhost:27017', function *(){
    yield connect({
      hostname: 'localhost',
      port: 27017,
      name: 'My MongoDB'
    });
    yield browser.pause(1000);
    var handles = yield browser.windowHandles();
    console.log('Window handles', handles);

    assert.equal(handles.value.length, 1);
    var isErrorVisible = yield browser.isVisible('.message.alert');
    assert.equal(isErrorVisible, true);
  });
});
