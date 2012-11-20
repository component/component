
/**
 * Module dependencies.
 */

var exec = require('child_process').exec
  , bin = __dirname + '/../bin/component'
  , path = require('path')
  , fs = require('fs')
  , vm = require('vm')

describe('component build', function(){
  afterEach(function (done) {
    exec('cd test/fixtures/path && rm -rf build', done);
  });
  it('should build', function(done){
    exec('cd test/fixtures/path && ' + bin + '-build -v', function(err, stdout){
      if (err) return done(err);
      stdout.should.include('build/build.js');
      stdout.should.include('duration');
      stdout.should.include('css');
      stdout.should.include('js');

      var js = fs.readFileSync('test/fixtures/path/build/build.js', 'utf8');
      var ret = vm.runInNewContext(js + '; require("foo")');
      ret.should.equal('baz');

      var ret = vm.runInNewContext(js + '; require("baz")');
      ret.should.equal('baz');

      done();
    })
  })

  it('should build separate files with --separate', function(done){
    exec('cd test/fixtures/path && ' + bin + '-build -S -v', function(err, stdout){
      if (err) return done(err);
      stdout.should.include('build/0-require.js');
      stdout.should.include('build/0-path-index.css');
      stdout.should.include('duration');
      stdout.should.include('css');
      stdout.should.include('js');

      done();
    })
  })
})
