(function() {
	'use strict';

	var assert = require('assert');
	var dropcam = require('dropcam');

	var credentials = {
		username: '',
		password: ''
	}

	describe('Logging into Dropcam API', function() {
		it('Should return a new user', function(done) {
			dropcam.login(credentials.username, credentials.password, function(err, user) {

				describe('User', function() {
					describe('#addNotificationEmail', function() {

					});
					describe('#removeNotificationEmail', function() {

					});
				}.bind(user));

				describe('Search Dropcam API by public token', function() {
					it('Should return an array of results', function() {

					});
				}.bind(user));

			});
		});
	});

})();
