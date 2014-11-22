'use strict';

// Known motion/sound event aliases
var EVENT = {
	mave1: 'motion',
	me1: 'motion',
	ave1: 'sound'
};

// TODO: Make more meaningful
function Event(properties) {
	this.properties = properties;

	Object.defineProperty(this, 'type', {
		value: EVENT[this.properties.type]
	});

	Object.defineProperty(this, 'id', {
		value: this.properties.id
	});

	Object.defineProperty(this, 'note', {
		value: this.properties.note
	});
}

// TODO: View the snapshot taken of the event
Event.prototype.view = function() {
	throw new Error('Function not implemented');
};

module.exports = Event;