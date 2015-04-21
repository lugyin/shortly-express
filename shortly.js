var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('./node_modules/body-parser/index.js');
// var cookieParser = require('./node_modules/cookie-parser/index.js');///node_modules/body-parser/index.js
var session = require('express-session');
var bcrypt = require("./node_modules/bcrypt-nodejs/bCrypt.js");


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//Our Code
app.use(bodyParser());
// app.use(cookieParser());
app.use(session({secret: 'ssshhhhh'}));





app.post('/signup', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;

    var newUser = new User({
      username: username,
      password: password,
    });

    newUser.save().then(function(user) {
      Users.add(user);
      request.session.loggedIn = true;
      response.redirect('/');
    });

});



app.post('/login', function(request, response) {
    username = request.body.username;
    password = request.body.password;

    new User({username: username}).fetch().then(function(found) {
    console.log('found: ' + found);
    console.log('found: '  + JSON.stringify(found));
        console.log(found);
      if (found) {
        if (password === found.attributes.password) {
          request.session.loggedIn = true;
          response.redirect('/');
        }
      } else {
          console.log("Invalid account information!")
          response.redirect('/login');
        }

    });
});


app.get('/logout', function(request, response){
    request.session.destroy(function(){
        request.session.loggedIn = false;
        response.redirect('/');
    });
});





//End Our Code

app.get('/',
function(req, res) {
  if (req.session.loggedIn) {
    res.render('index');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/create',
function(req, res) {
  if (req.session.loggedIn) {
    res.render('index');
  }
  else {
    res.redirect('/login');
  }
});

app.get('/links',
function(req, res) {
  if (req.session.loggedIn) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.redirect('/login');
  }

});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login',
function(req, res) {
  res.render('login');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
