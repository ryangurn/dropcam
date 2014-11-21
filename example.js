(function() {
	'use strict';

	var dropcam = require('./lib/dropcam');
	var util = require('util');

	var credentials = {
		username: 'YOUR_DROPCAM_USERNAME',
		password: 'YOUR_DROPCAM_PASSWORD'
	};

	// Example of creating a new user
	var User = dropcam.User;
	User.Register('NEW_USERNAME', 'NEW_PASSWORD', 'NEW_EMAIL', 
		function(err, _user) {
			if(err) return console.error(err);
			console.log('New user: %s', util.inspect(_user));	
		}
	);

	// You must always call the login function before accessing the entire API
	dropcam.login(credentials.username, credentials.password, function(err, user) {
		if(err) return console.error(err);

		// Logs out the user's properties
		console.log('Username: %s', user.properties.username);
		console.log('ID: %s', user.properties.id);
		console.log('Email: %s', user.properties.email);
		console.log('Timezone: %s', user.properties.timezone);
		
		// Returns the current session token
		user.getSessionToken(function(err, token) {
			if(err) console.error(err);
			console.log('Token on demand: %s', token); // prints out this user's token
		});

		// You could also access it in the user's session 
		// without needing to make an additional API call
		console.log('Session token: %s', user.session.token); 

		// Adds a new notification email address to the user
		user.addNotificationEmail('bobthebuilder@gmail.com', function(err, result) {
			if(err) return console.error(err);
			console.log('New email: %s', result); // This object holds the id necessary to remove the email

			// Removes a notification email address from the user
			user.removeNotificationEmail(result.id, function(err, deleted) {
				if(err) console.error(err);
				console.log('Notification email %s', (deleted ? 'has been deleted' : 'failed to delete')); // This is either true or false
			}); 
		});
		
		// Searchs the API for a camera associated with the public token
		// Returns the camera associated with the public id
		dropcam.search(user, '4fTZwY', function(err, camera) {
			if(err) return console.error(err);
			
			// Entire camera (user, properties and settings)
			console.log('Public camera: %s', camera);

			// Captures a screenshot of this camera
			camera.capture(function(err, screenshot) {
				screenshot.pipe(require('fs').createWriteStream('pub_cam_snapshot.jpeg'));
			});
		});
	
		// Returns an array of demo cameras
		// You can use them as you would any other camera
		dropcam.getDemos(user, function(err, cameras) {
			if(err) return console.error(err);
			console.log('Demos: %s', util.inspect(cameras));
		}); 
		
		// Query for visible cameras associated with this user
		dropcam.getVisibleCameras(user, function(err, cameras) {
			if(err) return console.error(err);
			
			console.log('Cameras: %s', util.inspect(cameras));

			// Pick a camera
			var camera = cameras.filter(function(camera) {
				return camera.properties['id'] === 536231; // Example ID
			})[0]; 
			
			// View camera settings
			console.log('Settings for Camera #1: %s', util.inspect(camera.settings));

			// Toggles the camera's visibility (public/private)
			camera.toggle('private', function(err, result) { 
				if(err) return console.error(err);
				console.log('Camera %s', (result ? ('visibility updated' : 'could not update visibility')); // returns public or private
			});
			
			// Updates a camera setting for this camera (such as disabling audio)
			camera.update({ key: 'audio.enabled', value: true }, function(err, result) { 
				if(err) return console.error(err);
				console.log('Value %s', (result ? 'has updated successfully' : 'was not updated')); // This is either true or false, depending on success
			});
			
			// Takes a screenshot 
			camera.capture(function(err, screenshot) { 
				if(err) return console.error(err);
				// You can also get the image type. It's usually a jpeg
				console.log(screenshot.type);
				// Writes the screenshot to file
				screenshot.pipe(require('fs').createWriteStream('screenshot.jpeg'));
			}); 
			
			/* This function has been temporarily disabled
			// Record your camera locally (in seconds)
			// This example shows to record for 10 seconds
			camera.record(10, function(err, stream) { // 0 means don't stop recording
				if(err) throw err;
				// Listen for events
				stream.on('data', function(data) {
					console.log(data);
				});
				stream.on('error', function(error) {
					console.log(error);
				});
				// Writes the stream to file
				stream.pipe(require('fs').createWriteStream('out.flv')); 
			});*/
			
			// Find devices setup with notifications about this camera
			camera.getNotificationDevices(function(err, devices) {
				if(err) return console.error(err);
				console.log(util.inspect(devices));
				// Each device has the ability to toggle whether you want to
				// receive or not receive any notifications simply by calling
				// the following:
				var device = devices.filter(function(device) {
					return device.properties['name'] === 'motorola XT1028'; // example device
				})[0]; 
				if(device) {
					// Be aware if you disable the device will no longer show up on the device list
					device.disable(function(err, success) {
						if(err) return console.error(err);
						console.log('Device %s', (success ? 'is now disabled' : 'failed to update'));
					});
					// In order to change this programatically, you'll need to persist the device's 
					// information elsewhere, you need the `type`, `value`, and `name` properties
					// then call the following
					/*
					var Device = dropcam.Device;
						
					device = Device.Create(camera, device.properties); // or persisted { type: 'gsm', value: 'value', name: 'My device' }
					device.enable(function(err, success) {
						if(err) return console.error(err);
						console.log('Device %s', (success ? 'is now enabled' : 'failed to update'));
					}); */
				}
			});
		
			// Clips API
			// Returns an array of video clips from this camera 
			camera.getClips(function(err, clips) {
				if(err) return console.error(err);
				console.log('Found %s clips', clips.length);
				// All clips
				console.log(util.inspect(clips));
				// Download each clip found
				clips.forEach(function(clip) {
					console.log('Title: %s', clip.properties.title);
					console.log('Length: %s', clip.properties.length_in_seconds);
					console.log('Description: %s', clip.properties.description);
					clip.download(function(err, data) { // { filename: 'j9edhdksku1y7373.mp4', stream: Stream, type: 'video/mp4' }
						if(err) return console.error(err);
						data.stream.pipe(require('fs').createWriteStream(data.filename));
					});
				});
				// Example of updating clip properties or deleting clips
				if(clips.length > 0) {
					var selected = clips[0];
					var pair = { key: 'description', value: 'This is not my room' };
					// From what I can tell, you can only change 'description' and 'title' values
					selected.update(pair, function(err, result) {
						if(err) return console.error(err);
						console.log('%s clip property `%s` = `%s`', (result ? 'Updated' : 'Failed to update'), pair['key'], pair['value']);
						console.log('Calling description as property reveals new value as `%s`', selected.properties.description);
					});
					/*
					// Example of deleting an existing clip  
					selected.delete(function(err, result) {
						if(err) return console.error(err);
						// From here on, all properties of this object are now undefined and ready for GC
						// You would want to update your collection to reflect those changes (simply recall getClips)
						console.log('%s clip', (result ? 'Successfully deleted' : 'Unable to delete'));
					}); */
				}
			}); 

			// Subscriptions API
			// Returns an array of subscriptions the camera has
			camera.getSubscriptions(function(err, results) {
				if(err) return console.error(err);
				console.log(util.inspect(results));
			});
		});
	});
})();