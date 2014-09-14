var extend = require('extend');
var intersects = require('intersects');
var viewport = require('./viewport');


var doc = document, win = window;


/**
 * @module elements-lifecycle
 * @todo  Ignore native CustomElements lifecycle events
 */
var lifecycle = module.exports = enableLifecycleEvents;
lifecycle.enable = enableLifecycleEvents;
lifecycle.disable = disableLifecycleEvents;


/** Default options */
var defaults = {
	/** element to specify selector */
	container: document,
	/** enteredView & leftView events */
	viewport: true,
	/** attached & detached events */
	mutations: true,
	/** attributeChanged */
	attributes: false,

	/** Callback names */
	enteredViewCallbackName: 'enteredView',
	leftViewCallbackName: 'leftView',
	attachedCallbackName: 'attached',
	detachedCallbackName: 'detached'
};


/**
 * Lifecycle enabler
 * @main
 * @chainable
 */
function enableLifecycleEvents(query, options){
	//if no target passed - find target within options
	if (type.isObject(query)) {
		options = query;
	}

	options = extend({}, defaults, options);

	if (options.viewport) viewport(query, options);
	// if (options.mutations) enableMutationEvents(query, options);
	// if (options.attributes) enableAttributesEvents(query, options);
}


/**
 * Lifecycle disabler
 */
function disableLifecycleEvents(){

}