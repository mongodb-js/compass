describe('Connect', function() {
  it('should work', function(done) {
    return browser
      .getTitle().then(function(v) {
      console.log('title', v);
    })
      .call(function() {
        console.log('done', arguments);
        done();
      });
  });
});
