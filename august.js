// TODO
//   - remove clutter
//   - make variables/selector names unique to follow logic easier
//   - separate client and server code
//   - actual security
//   - persistent session information in localStorage

Users = new Meteor.Collection('users');
Threads = new Meteor.Collection('threads');

var day = 86400000;

function pad(num) {
  if (num < 10)
    return '0' + num;
  return String(num);
};

function toTimeString(date) {
  return String(date.getFullYear()) + '-' + pad(date.getMonth()+1) + '-' +
    pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' +
    pad(date.getMinutes());
}

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
    if (!Threads.findOne({topic: topic})) {
      var now = new Date(Date.now());
      var user = Users.findOne({username: Session.get('username')});
      var timestring = toTimeString(now);
      Threads.insert({username: user['username'], userstamp: user['timestamp'],
                      topic: topic, timestamp: now.getTime(),
                      timestring: timestring,
                      posts: [{username: user['username'], time: timestring,
                               text: topic, toppost: 1}]});
    }
    Session.set('thread', topic);
  }
}

function postReply(input) {
  var text = String(input || '');
  var now = new Date(Date.now());
  var timeString = toTimeString(now);
  Threads.update({topic: Session.get('thread')},
                 {$set: {timestamp: now.getTime(), timestring: timeString},
                  $push: {posts: {username: Session.get('username'),
                                  time: timeString, text: input}}});
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
    'click #forum': function(event) {
      Session.set('thread', '');
    },
    'click #logout': function(event) {
      Session.set('username', '');
      Session.set('thread', '');
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
        startThread(this.topic.value);
      };
    }
  });

  Template.thread.events({
    'click .btn': function(event) {
      postReply(this.post.value);
    }
  });

  Template.forum.helpers({
    'threads': function() {
      var user = Users.findOne({username: Session.get('username')},
                             {timestamp: 1});
      if (user) {
        join = new Date(user.timestamp).getTime();
        return Threads.find(
          {userstamp: {$lte: new Date(join + 40*day).getTime(),
                       $gte: new Date(join - 40*day).getTime()}},
          {fields:{topic:1, timestring:1}, sort:{timestamp: -1}});
      };
      return null;
    }
  });

  Template.thread.helpers({
    'posts': function() {
      var ps = Threads.findOne({topic: Session.get('thread')},
                          {posts:1});
      if (ps) return ps.posts;
      return null;
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
    Users.remove({});
    Threads.remove({});
    var users = [{username: "Early Adopter", timestamp: new Date(2012, 6, 1).getTime()},
                 {username: "A Month Later", timestamp: new Date(2012, 7, 1).getTime()},
                 {username: "Three Months Later", timestamp: new Date(2012, 9, 1).getTime()},
                 {username: "Fad Time", timestamp: new Date(2012, 11, 1).getTime()}];
    var dates = [new Date(2012, 6, 1), new Date(2012, 7, 30),
                 new Date(2012, 8, 1), new Date(2012, 9, 30),
                 new Date(2012, 12, 12)];
    var threads = [{user: users[0], text: "Welcome", time: dates[0]},
                    {user: users[0], text: "I'm back", time: dates[3]},
                    {user: users[3], text: "Hey guys", time: dates[3]},
                    {user: users[3], text: "This sucks", time: dates[4]}];

    _.map(users, function(user) { Users.insert(user); });
    _.map(threads, function(thread) { Threads.insert(
      {username: thread['user']['username'],
       userstamp: thread['user']['timestamp'],
       topic: thread.text,
       timestamp: thread.time.getTime(), timestring: toTimeString(thread.time),
       posts: [{username: thread.username, text: thread.text,
                time: toTimeString(thread.time), toppost: 1}]})});
    Session.set('username', '');
    Session.set('thread', '');
  });
}
