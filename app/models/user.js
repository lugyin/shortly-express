var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({

  initialize: function(username, password, salt) {
    this.username = username;
    this.password = password;
    this.salt = salt;
  }

});

module.exports = User;
