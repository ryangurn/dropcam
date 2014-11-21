'use strict';

var EVENT = {
	mave1: 'Motion/Sound',
	me1: 'Motion',
	ave1: 'Sound'
};

// TODO: Implement
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

Event.prototype.view = function() {

};

module.exports = Event;