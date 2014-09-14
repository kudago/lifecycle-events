var matchesSelector = require('matches-selector');
var type = require('mutypes');
var evt = require('muevents');
var SelectorObserver = require('selector-observer');
var extend = require('extend');
var intersects = require('intersects');


var doc = document, win = window;


/**
 * @module elements-lifecycle
 */
var lifecycle = module.exports = enableLifecycleEvents;
lifecycle.on = enableLifecycleEvents;
lifecycle.off = disableLifecycleEvents;


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

	if (options.viewport) enableViewportEventsFor(query, options);
	// if (options.mutations) enableMutationEvents(query, options);
	// if (options.attributes) enableAttributesEvents(query, options);
}


/**
 * Lifecycle disabler
 */
function disableLifecycleEvents(){

}



/* ---------------------------  V  I  E  W  P  O  R  T  ------------------------------ */


/**
 * List of observable viewport events targets/queries
 */
var vpTargets = [];


/**
 * Observe targets
 */
function enableViewportEventsFor(target, options){
	vpTargets.push(target);
}


/** viewport sizes */
var vpRect = {
	top:0,
	left:0,
	bottom:win.innerHeight,
	right:win.innerWidth,
	width: win.innerWidth,
	height: win.innerHeight
};


/** keep viewport updated */
evt.on(win, 'resize', function(){
	vpRect.bottom = win.innerHeight;
	vpRect.right = win.innerWidth;
	vpRect.width = win.innerWidth;
	vpRect.height = win.innerHeight;
});



/** Set of entered viewport items */
var enteredItemsSet = new WeakSet;


/** add scroll handler for the doc */
evt
.on(doc, 'scroll', checkViewport)
.on(doc, 'DOMContentLoaded', checkViewport);

checkViewport();


/** check elements need to be entered/left */
function checkViewport(){
	for (var i = 0; i < vpTargets.length; i++){
		var query = vpTargets[i];

		var targets = queryTargets(query, document);

		for (var j = targets.length; j--;){
			var target = targets[j];
			var targetRect = target.getBoundingClientRect();

			//if item is entered - check to call entrance
			if (enteredItemsSet.has(target)){
				if (!intersects(targetRect, vpRect, {tolerance: 0})) {
					enteredItemsSet.delete(target);
					evt.emit(target, defaults.leftViewCallbackName, null, true);
				}
			}

			//check to call leave
			else {
				if (intersects(targetRect, vpRect, {tolerance: 0})) {
					enteredItemsSet.add(target);
					evt.emit(target, defaults.enteredViewCallbackName, null, true);
				}
			}
		}
	}
}



/* ------------------------  M  U  T  A  T  I  O  N  S  ------------------------------ */


/** Set of mutation observers */
var observers = new WeakSet;


function enableMutationEvents(query, options){
	var observer = new SelectorObserver(
		options.container,
		query,
		attachedCaller,
		detachedCaller);

	if (options.mutations) {
		observer.observe(query);
	}
}



/**
 * Call attached for the target
 */
function attachedCaller(){
	evt.emit(this, 'attached');
}


/**
 * Call detached for the target
 */
function detachedCaller(){
	evt.emit(this, 'detached');
}




/**
 * Return NodeList from the any kind of query passed
 *
 * @param {(string|Element|NodeList)} query Any kind of query
 *
 * @return {NodeList} list of queried elements
 */
function queryTargets(query, container){
	if (type.isString(query)) {
		return container.querySelectorAll(query);
	}

	else if (type.isElement(query)) {
		return [query];
	}

	else if (query instanceof NodeList) {
		return query;
	}
}