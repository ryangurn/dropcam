# dropcam
Unofficial Dropcam API Client

## Status
There's no public documentation for this API as most of it was reverse engineered from their private API.
There is a beta program available to access official API resources, however they are selective
towards who can use it. Consider this experimental until further notice as it can
break when their private API is updated. Report any bugs if you come across them.

This project is actively maintained as of 11/21/2014.

## Features
- Dropcam Scope
	- Search API - Find any camera publically accessable
	- Demos API - Access various demos available
	- Camera API - Access various functions of a camera
		- User Scope
			- User API
				- Notification Email Management - Manage email notifications
				- User Creation (new) - Create new users
		- Camera Scope
			- Settings - View, manage and modify various camera settings including visibility
			- Screenshots - Capture live screenshots of the camera
			- Clips - View, manage, and modify available clips (update, delete, and download)
			- Notification Devices - View and modify devices that receive notifications to this camera
			- Basic implementation of Events - Get any motion/sound events that occur with this camera
			- Basic implementation of Subscriptions - Get all current subscriptions to this camera
			- ~~Media Capture - Capture real time screenshots and live video streams (requires RTMPDUMP)~~

## TODO
- Subscriptions - Manage and modify subscriptions (partially implemented)
- Capture Video/Sound Streams with the ability to talkback 
- Meaningful Events
- Tests

## Live Video Streams
This is currently broken as they've moved to encrypted streaming. There will probably be a fix on v1.0.1.

~~This project depends on the use of rtmpdump to capture live video streams. Since there is no reliable
native functionality to capture RTMP streams at the moment (at least to my knowledge), 
you must download and have rtmpdump on your system PATH. To download, visit: http://rtmpdump.mplayerhq.hu/download
Tested with RTMPDUMP 2.4 on Win 8.1 64bit.~~

## Installation
    $ git clone https://github.com/opfl/dropcam.git

## Tests
    $ npm test

## Examples

```javascript
	'use strict';

	var dropcam = require('./lib/dropcam');
	var util = require('util');

	var credentials = {
		username: 'YOUR_DROPCAM_USERNAME',
		password: 'YOUR_DROPCAM_PASSWORD'
	};

	/*
	// Example of creating a new user
	var User = dropcam.User;
	User.Register('NEW_USERNAME', 'NEW_PASSWORD', 'NEW_EMAIL', 
		function(err, _user) {
			if(err) return console.error(err);
			console.log('New user: %s', util.inspect(_user));	
		}
	);*/

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
				screenshot.pipe(require('fs').createWriteStream(util.format('screenshot_%s.jpeg', Date.now())));
			});

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
			
			// Events - These are not considered real-time as any sort
			// of delay is expected (latency between you and dropcam's servers)

			// This event captures motion-only or motion w/sound events
			camera.on('motion', function(motion) {
				console.log('New motion event detected: %s', util.inspect(motion));
			});

			// This event captures sound-only events
			camera.on('sound', function(sound) {
				console.log('New sound event detected: %s', util.inspect(sound));
			});

			// This event captures any errors that take place
			camera.on('error', function(error) {
				console.log('Error: %s', error);
			});

			// This must be called in order to listen to any of events occuring. You
			// can optionally pass in a `timeout` param if you want to increase/decrease
			// the amount milliseconds to refresh events, default is 1000 ms
			camera.listen(100); 
		});
	});
```

## Dropcam API
### .login(username, password, callback)
This function will attempt to login into the private dropcam API 
and returns a user (you) with a valid session if successful. This function
takes three parameters, `username`, `password`, and `callback`. This is considered
the main entry function and must be called before accessing any other APIs.
See above for an example.

### .search(user, public_token, callback)
This function will attempt to search the dropcam API using the public 
token to find the camera that's associated with it. The function takes
a `user` and `public_token`. The callback returns a camera if successful. Login 
must be called before accessing the full camera API. Note: You will
not be able to modify camera settings (such as visibility) unless 
you own the camera. See above for an example.

### .demos(user, callback)
This function will attempt to search for available demos and return an 
array of cameras. Login must be called before accessing the full camera 
API. The function takes a `user`. Note: You will not be able to modify camera 
settings (such as visibility) unless you own the camera. See above for an example.

### .getVisibleCameras(user, callback)
This function will attempt to return an array of visible cameras associated 
with the `user`. Login must be called before accessing the full camera API.
See above for an example.  

## User API
You can access several user properties and session details with a user.

### .getSessionToken(callback)
This function will returns the current user's session token. Alternatively,
you can access the token by extending the user's session property without
needing to make an API call. See above for an example.

### .addNotificationEmail(email, callback)
This function will attempt to add a new `email` address for notifications and
return an object containing the new address and id. The id is important to have
in the case you wish to later remove the associated email. See above for an
example. 

### .removeNotificationEmail(email_id, callback)
This function will attempt to remove an associated email address with the `email_id` 
and return a true/false depending on success. You can only obtain the id when you create
a new notification email using the API, so it's important to save the id if you plan
on removing it later. See above for an example.

### .Register(username, password, email, callback)
This function registers a new user to dropcam. It takes three parameters, `username`,
`password`, and `email`. Email validation is not included.

## Camera API
Due to wide variety of properties and settings varying per camera, you can access 
all properties by extending the camera's properties, settings and user. You can see an 
example of this in the above example.

You can also call `.on(event, callback)` if you wish to receive the following
motion/sound events. 

### Event: 'motion'
This event receives any motion events detected by this camera
### Event: 'sound'
This event receives any sound events detected by this camera
### Event: 'error'
This event receives any error events that occur

### .toggle(visibility, callback)
This function will attempt to toggle the camera's visibility setting and return the resulting
new setting as `private` or `public`. You can pass in a string such as `private` or `public`
as the visibility parameter. Note: This function will not work on cameras not associated with 
the user. See above for an example.

### .update(keyvalue, callback)
This function will attempt to update a camera setting such as enabling audio, motion
detection, etc and returns a true/false depending on the success. You can see a full list 
of available settings by accessing the settings property on the camera including their values. 
Note: This function will not work on cameras not associated with the user. See above for 
an example.

### .capture(callback)
This function will attempt to capture a live screenshot of the camera and return a screenshot
object. This function should work on both user owned and public cameras. See above for an
example, and see below for object functions.

### .getNotificationDevices(callback)
This function will attempt to get all devices asssociated with this camera and return an array 
of devices that are currently recently notifications. Note: This function will not work on cameras 
not associated with the user. See above for an example.

### .getSubscriptions(callback)
This function will attempt to get any subscriptions associated with this camera and return an
array of subscriptions. Note: This function will not work on cameras not associated with 
the user. See above for an example.

### .getClips(callback)
This function will attempt to get any video clips saved on the cloud and return an array of
clips. See above for an example.

## Clips API
### .download(callback)
This function will attempt to download a video clip. Returns an object containing the
`filename` and `stream`. Stream contains video clip buffer. See above for an example.

### .update(keyvalue, callback)
This function will attempt to update any properties associated with the clip. The only
properties that seem to be modifiable are `title` and `description`. Returns a true/false
depending on success. See above for an example. 

### .delete(callback)
This function will attempt to delete the clip. Returns true/false depending on success. 
Clip will no longer be usable at this point, call `.getClips` to refresh available clips.
See above for an example.

## Devices API
### .enable(callback)
This function enables the device to begin receiving notifications. You will need to have
the device's `type` and `value` in order to create and enable the device. Returns a true/false 
value depending on success. See above for an example. 

### .disable(callback)
This function disables the device from receiving any notifications. If this function
is called, it will longer show up in the device list. Returns a true/false value depending 
on success. Tip: In order to enable, you should consider persisting the object's properties and 
create a new `Device` object. See above for an example.

## Screenshot
### .pipe(out)
You can call `.pipe` on the object and do what you wish with the buffer, such as writing 
to file. See above for an example.

## Deprecated 
### .getDevicesWithNotifications
This function has been renamed to `.getNotificationDevices`

## Bugs/Errors
If you come across any errors, feel free to submit a new issue or pull request.

## License
Copyright (c) 2014 OPFL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
