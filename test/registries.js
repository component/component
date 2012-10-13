
var exec = require('child_process').exec
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , express = require('express')
  , exists = fs.existsSync || path.existsSync;

describe('component install from private registries', function(){
  var app = express()
    , authapp = express();

  before(function(done){
    exec('mkdir -p test/private-registry/testcomponent/master', done);
  })

  before(function(done){
    fs.writeFile('test/private-registry/testcomponent/master/component.json', JSON.stringify({
      name: 'testcomponent',
      repo: 'private-registry/testcomponent'
    }), done);
  })

  before(function(done){
    app.use(express.static(__dirname));
    app.listen(3000, done);
  })

  before(function(done){
    authapp.use(
      express.basicAuth(function(user, pass){
        return (user === 'admin' && pass === '1234');
      })
    );
    authapp.use(express.static(__dirname));
    authapp.listen(3001, done);
  })

  describe('without authentication', function(){
    beforeEach(function(done){
      fs.writeFile('component.json', JSON.stringify({
        registries: [ 'http://localhost:3000' ]
      }), done);
    })

    it('should install private component', function(done){
      exec('bin/component install private-registry/testcomponent', function(err, stdout, stderr){
        if (err) return done(err);
        stdout.should.include('install');
        stdout.should.include('complete');
        var json = require(path.resolve('components/private-registry-testcomponent/component.json'));
        json.name.should.equal('testcomponent');
        json.repo.should.equal('private-registry/testcomponent');
        done();
      })
    })
  
    it('should fallback to github', function(done){
      exec('bin/component install component/emitter', function(err, stdout){
        if (err) return done(err);
        stdout.should.include('install');
        stdout.should.include('fetch');
        stdout.should.include('complete');
        stdout.should.include('warning');
        var json = require(path.resolve('components/component-emitter/component.json'));
        json.name.should.equal('emitter');
        done();
      })
    })
  })

  describe('with authentication', function(){

    describe('and verbose auth notation', function(){
      beforeEach(function(done){
        fs.writeFile('component.json', JSON.stringify({
          registries: [ {
            url: 'http://localhost:3001',
            auth: {
              user: 'admin',
              pass: '1234'
            }
          } ]
        }), done);
      })

      it('should support basic auth for each registry', function(done){
        exec('bin/component install private-registry/testcomponent', function(err, stdout){
          if (err) return done(err);
          var json = require(path.resolve('components/private-registry-testcomponent/component.json'));
          stdout.should.include('install');
          stdout.should.include('complete');
          json.name.should.equal('testcomponent');
          json.repo.should.equal('private-registry/testcomponent');
          done();
        })
      })
    })

    describe('and minimal notation', function(done){
      before(function(done){
        fs.writeFile('component.json', JSON.stringify({
          registries: [ {
            url: 'http://admin:1234@localhost:3001',
          } ]
        }), done);
      })

      it('should support basic auth embedded into the url for each registry', function(done){
        exec('bin/component install private-registry/testcomponent', function(err, stdout){
          if (err) return done(err);
          stdout.should.include('install');
          stdout.should.include('complete');
          var json = require(path.resolve('components/private-registry-testcomponent/component.json'));
          json.name.should.equal('testcomponent');
          json.repo.should.equal('private-registry/testcomponent');
          done();
        })
      })
    })

    describe('and bad credentials', function(){
      beforeEach(function(done){
        fs.writeFile('component.json', JSON.stringify({
          registries: [ 'http://admin:abcd@localhost:3001' ]
        }), done);
      })

      it('should fail when credentials are incorrect', function(done){
        exec('bin/component install private-registry/testcomponent', function(err, stdout){
          if (err) return done(err);
          stdout.should.include('warning');
          assert(!exists('components/private-registry-testcomponent/component.json'), 
            'component should not be installed');
          done();
        })
      })
    })

    describe('and global auth', function(){
      beforeEach(function(done){
        fs.writeFile('component.json', JSON.stringify({
          auth: {
            user: 'admin',
            pass: '1234'
          },
          registries: [ {
            url: 'http://localhost:3001',
          } ]
        }), done);
      })

      it('should not use the global basic auth reserved for github', function(done){
        exec('bin/component install private-registry/testcomponent', function(err, stdout){
          if (err) return done(err);
          stdout.should.include('warning');
          assert(!exists('components/private-registry-testcomponent/component.json'), 
            'component should not be installed');
          done();
        })
      })
    })
  })

  afterEach(function(done){
    exec('rm -fr components component.json', done);
  })

  afterEach(function(done){
    // Invalidating require's cache
    for (var key in require.cache) {
      require.cache[key] = undefined;
    }
    done();
  })

  after(function(done){
    exec('rm -fr test/private-registry', done);
  })
})

