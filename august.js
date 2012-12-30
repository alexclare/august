// TODO
//   - remove clutter
//   - separate client and server code
//   - actual security
//   - persistent session information in localStorage

Users = new Meteor.Collection('users');
//Threads = new Meteor.Collection('threads');

function login(input) {
  var user = String(input || '');
  if (user) {
    if (Users.findOne({username:user})) {
      Session.set('username', user);
    } else {
      Users.insert({username:user,
                    timestamp:(new Date).getTime()});
      Session.set('username', user);
    }
  }
}

if (Meteor.isClient) {
  Template.login.events({
    'click .btn': function(event) {
        login(this.username.value);
    },
    'keyup #username, keyup #password': function(event) {
        if (event.which === 13) {
            login(this.username.value);
        }
    }
  });

  // TODO Remember to add "click on top nav -> return to default page" here
  Template.top.events({
    'click #logout': function(event) {
      Session.set('username', '');
    }
  });

  // Global helpers
  _.map({
    'user': function() {
      return Session.get('username');
    },
    'thread': function() {
        return Session.get('thread');
    }
    }, function(k, v) { Handlebars.registerHelper(v, k); });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
          // pass
  });
}
