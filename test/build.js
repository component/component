
/**
 * Module dependencies.
 */

var exec = require('child_process').exec
  , bin = __dirname + '/../bin/component'
  , path = require('path')
  , fs = require('fs')
  , vm = require('vm')

describe('component build', function(){

  afterEach(function(done) {
    // clean build output after each test
    exec('cd test/fixtures/path && rm -rf build', function(err, stdout) {
      if (err) return done(err);
    })
    done();
  })

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

  it('should build only css', function(done){
    exec('cd test/fixtures/path && ' + bin + '-build -v -m css', function(err, stdout){
      if (err) return done(err);
      stdout.should.not.include('build/build.js');
      stdout.should.include('duration');
      stdout.should.include('css');
      stdout.should.not.include('js');
      var css = fs.readFileSync('test/fixtures/path/build/build.css', 'utf8');
      css.should.include('body');
      css.should.include('color');
      css.should.include('red');
      done();
    })
  })

  it('should build only js', function(done){
    exec('cd test/fixtures/path && ' + bin + '-build -v -m js', function(err, stdout){
      if (err) return done(err);
      stdout.should.include('build/build.js');
      stdout.should.include('duration');
      stdout.should.not.include('css');
      stdout.should.include('js');
      var js = fs.readFileSync('test/fixtures/path/build/build.js', 'utf8');
      var ret = vm.runInNewContext(js + '; require("qux")');
      ret.should.equal('qux');
      done();
    })
  })

  it('should require middleware with relative path', function(done){
    exec('cd test/fixtures/path && ' + bin + '-build -v -u ../plugin', function(err, stdout){
      if (err) return done(err);
      stdout.should.include('middleware fired!');
      done();
    })
  })

  it('should require middleware with absolute path', function(done){
    var plugin = path.join(__dirname, 'fixtures', 'plugin');
    exec('cd test/fixtures/path && ' + bin + '-build -v -u ' + plugin, function(err, stdout){
      if (err) return done(err);
      stdout.should.include('middleware fired!');
      done();
    })
  })

  it('should exclude the js file if no scripts, and the css file if no styles', function(done){
    exec('cd test/fixtures/no-js-css && ' + bin + '-build -v', function(err, stdout){
      if (err) return done(err);
      stdout.should.not.include('js :');
      stdout.should.not.include('css :');
      done();
    });
  });
})
