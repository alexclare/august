// TODO
//   - remove clutter
//   - make variables/selector names unique to follow logic easier
//   - separate client and server code
//   - actual security
//   - persistent session information in localStorage

Users = new Meteor.Collection('users');
Threads = new Meteor.Collection('threads');

function login(input) {
  var user = String(input || '');
  if (user) {
    if (!Users.findOne({username:user})) {
      Users.insert({username:user,
                    timestamp:Date.now()});
    }
    Session.set('username', user);
  }
}

function startThread(input) {
  var topic = String(input || '');
  if (topic) {
    if (!Threads.findOne({topic:topic})) {
      var now = new Date(Date.now());
      // TODO Use lib/underscore.string.sprintf
      Threads.insert({topic:topic,
                      timestamp:now,
                      timestring:now.toUTCString()});
    }
    Session.set('thread', topic);
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

  Template.top.events({
    'click .brand': function(event) {
      Session.set('thread', '')
    },
    'click #logout': function(event) {
      Session.set('username', '');
    }
  });

  Template.forum.events({
    'click .thread': function(event) {
      startThread(event.target.text);
    },
    'click .add-on': function(event) {
      startThread(this.topic.value);
    },
    'keyup #topic': function(event) {
      if (event.which === 13) {
        startThread(this.topic.value)
      };
    }
  });

  Template.forum.helpers({
    'threads': function() {
      return Threads.find(
        {}, {fields:{topic:1, timestring:1},
             sort:{timestamp: -1}});
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
