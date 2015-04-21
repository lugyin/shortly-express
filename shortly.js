var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('./node_modules/body-parser/index.js');
var cookieParser = require('./node_modules/cookie-parser/index.js');///node_modules/body-parser/index.js
var session = require('express-session');
var bcrypt = require("./node_modules/bcrypt-nodejs/bCrypt.js");

var username;
var password;


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
app.use(cookieParser());
app.use(session({secret: 'ssshhhhh'}));



// function restrict(req, res, next) {
//   if (req.session.user) {
//     next();
//   } else {
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// }

// app.post('/signup', function(request, response) {

//     username = request.body.username;
//     password = request.body.password;
//     var salt = bcrypt.genSaltSync(10);

//     var hash = bcrypt.hashSync(password, salt);

//     var newUser = new User(username, hash, salt);

//     Users.add(newUser);

//     request.session.regenerate(function(){
//       request.session.user = username;
//       request.session.loggedIn = true;
//       response.end(username);
//       // response.redirect('/index');
//     });

// });



app.post('/login', function(request, response) {

    username = request.body.username;
    password = request.body.password;
    var salt = bcrypt.genSaltSync(10);

    var hash = bcrypt.hashSync(password, salt);

    if(username == 'LU' && hash == hash){
        request.session.regenerate(function(){
        request.session.user = username;
        request.session.loggedIn = true;
        response.redirect('/index');
        });
    }
    else {
       res.redirect('login');
    }
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
