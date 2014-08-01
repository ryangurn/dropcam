module.exports = (function() {
	'use strict';

	// User specific endpoints
	var ENDPOINT = {
		API_GET_CURRENT: 'users.get_current',
		API_GET_SESSION_TOKEN: 'users.get_session_token',
		API_ADD_EMAIL_NOTIFICATION: 'users.add_email_notification_target',
		API_DELETE_EMAIL_NOTIFICATION: 'users.delete_notification_target',
	};

	var http = require('./http');

	function User(id, username, timezone, email, session) {
		this.id = id;
		this.username = username;
		this.timezone = timezone;
		this.email = email;
		this.session = session;

		Object.defineProperty(this, "id", {
  			configurable: false,
  			writable: false,
  			value: this.id
		});

		Object.defineProperty(this, "username", {
  			configurable: false,
  			writable: false,
  			value: this.username
		});

		Object.defineProperty(this, "timezone", {
  			configurable: false,
  			writable: false,
  			value: this.timezone
		});

		Object.defineProperty(this, "email", {
  			configurable: false,
  			writable: false,
  			value: this.email
		});

		Object.defineProperty(this, "session", {
  			enumerable: true,
  			configurable: false,
  			writable: false,
  			value: this.session
		});
	};

	// Returns this user's session token
	User.prototype.getSessionToken = function(callback) {
		http.get({ api: true, url: ENDPOINT.API_GET_SESSION_TOKEN, 
			headers: { 'Cookie': this.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					callback(null, data.items[0]);
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to retrieve session token'), null);
				}
			}
		);
	};

	// Adds a notification email to this user
	// Returns an object containing the email and id
	User.prototype.addNotificationEmail = function(email, callback) {
		http.get({ api: true, url: ENDPOINT.API_ADD_EMAIL_NOTIFICATION + '?email=' + email, 
			headers: { 'Cookie': this.session.cookies.join(',') } }, 
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					callback(null, data.items[0]);
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to add new notification email'), null);
				}
			}
		);
	};

	// Removes a notification email from this user by id
	// Returns a true/false depending on success
	User.prototype.removeNotificationEmail = function(id, callback) {
		http.get({ api: true, url: ENDPOINT.API_DELETE_EMAIL_NOTIFICATION + '?id=' + new String(id), 
			headers: { 'Cookie': this.session.cookies.join(',') } }, 
			function(err, data) {
				var result = false;
				
				if(err) {
					callback(err, result);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					result = true;
					callback(null, result); 
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to delete notification email'), result);
				}
			}
		);
	};

	// Creates a new user
	User.Create = function(session, callback) {
		http.get({ api: true, url: ENDPOINT.API_GET_CURRENT, 
			headers: { 'Cookie' : session.cookies.join(',') } }, 
			function(err, data) {
				if(err) {
					callback(err, null);
				}
				else if(data['status'] === 0 && data['status_description'] === 'ok') {
					var user = data.items[0];
					callback(null, new User(user['id'], user['username'], user['timezone'], user['email'], session));
				}
				else {
					callback(new Error(data['status_detail'] || 'Failed to create a new user'), null);
				}
			}
		);
	};

	return User;
})();