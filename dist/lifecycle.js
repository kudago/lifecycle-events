!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.lifecycle=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var extend = require('extend');
var viewport = require('./viewport');


var doc = document, win = window;


/**
 * @module elements-lifecycle
 *
 * @todo  Ignore native CustomElements lifecycle events
 * @todo  Nested queryselector ten times faster than doc.querySelector:
 *        http://jsperf.com/document-vs-element-queryselectorall-performance/2
 * @todo  Build standalone package
 * @todo  Multiple observations to an extent faster than one global observer:
 *        http://jsperf.com/mutation-observer-cases
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
},{"./viewport":6,"extend":2}],2:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	"use strict";
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	"use strict";
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if (typeof target !== "object" && typeof target !== "function" || target == undefined) {
			target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],3:[function(require,module,exports){
/** @module  intersects */
module.exports = intersects;


var min = Math.min, max = Math.max;


/** Default settings */
var defaults = {
	/** Target container to observe within */
	within: undefined,

	/** Offsets from container to provide gaps */
	offsets: 0,

	/** The amount of square to detect intersection.
	 * 0 - touches
	 * 1 - fits
	 * .5 - 50% square intersection
	 * @type {(Function|value)}
	 */
	tolerance: .5
};


/**
 * Main intersection detector.
 *
 * @param {Rectangle} a Target
 * @param {Rectangle} b Container
 *
 * @return {bool} Whether target is within the container
 */
function intersects (a, b, opts){
	//ignore definite disintersection
	if (a.right < b.left || a.left > b.right) return false;
	if (a.bottom < b.top || a.top > b.bottom) return false;

	//intersection values
	var iX = min(a.right - max(b.left, a.left), b.right - max(a.left, b.left));
	var iY = min(a.bottom - max(b.top, a.top), b.bottom - max(a.top, b.top));
	var iSquare = iX * iY;

	var bSquare = (b.bottom - b.top) * (b.right - b.left);
	var aSquare = (a.bottom - a.top) * (a.right - a.left);

	//measure square overlap relative to the min square
	var targetSquare = min(aSquare, bSquare);


	//minimal overlap ratio
	var minRatio = opts && opts.tolerance !== undefined ? opts.tolerance : defaults.tolerance;

	if (iSquare / targetSquare > minRatio) {
		return true;
	}

	return false;
}
},{}],4:[function(require,module,exports){
/** @module muevents */
module.exports = {
	on: bind,
	off: unbind,
	emit: fire
};


/** jquery guarant */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;


/** set of target callbacks, {target: [cb1, cb2, ...]} */
var targetCbCache = new WeakMap;


/**
* Bind fn to the target
* @todo  recognize jquery object
* @chainable
*/
function bind(target, evt, fn){
	//bind all listeners passed
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			bind(target, evt, fn[i]);
		}
		return;
	}

	//DOM events
	if (isEventTarget(target)) {
		//bind target fn
		if ($){
			//delegate to jquery
			$(target).on(evt, fn);
		} else {
			//listen element
			target.addEventListener(evt, fn);
		}
		//FIXME: old IE
	}

	//Non-DOM events
	//ensure callbacks array for target exist
	if (!targetCbCache.has(target)) targetCbCache.set(target, {});
	var targetCallbacks = targetCbCache.get(target);

	//save callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(fn);

	return this;
}



/**
* Bind fn to a target
* @chainable
*/
function unbind(target, evt, fn){
	//unbind all listeners passed
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			unbind(target, evt, fn[i]);
		}
		return;
	}

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		var callbacks = targetCbCache.get(target);
		if (!callbacks) return;
		//unbind all if no evtRef defined
		if (evt === undefined) {
			for (var evtName in callbacks) {
				unbind(target, evtName, callbacks[evtName]);
			}
		}
		else if (callbacks[evt]) {
			unbind(target, evt, callbacks[evt]);
		}
		return;
	}

	//DOM events on elements
	if (isEventTarget(target)) {
		//delegate to jquery
		if ($){
			$(target).off(evt, fn);
		}

		//listen element
		else {
			target.removeEventListener(evt, fn);
		}
	}

	//ignore if no event specified
	if (!targetCbCache.has(target)) return;

	var evtCallbacks = targetCbCache.get(target)[evt];

	if (!evtCallbacks) return;

	//remove specific handler
	for (var i = 0; i < evtCallbacks.length; i++) {
		if (evtCallbacks[i] === fn) {
			evtCallbacks.splice(i, 1);
			break;
		}
	}

	return this;
}



/**
* Event trigger
* @chainable
*/
function fire(target, eventName, data, bubbles){
	if (!target) return;

	//DOM events
	if (isEventTarget(target)) {
		if ($){
			//TODO: decide how to pass data
			var evt = $.Event( eventName, data );
			evt.detail = data;
			bubbles ? $(target).trigger(evt) : $(target).triggerHandler(evt);
		} else {
			//NOTE: this doesnot bubble on disattached elements
			var evt;

			if (eventName instanceof Event) {
				evt = eventName;
			} else {
				evt =  document.createEvent('CustomEvent');
				evt.initCustomEvent(eventName, bubbles, true, data);
			}

			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })

			target.dispatchEvent(evt);
		}
	}

	//no-DOM events
	else {
		//ignore if no event specified
		if (!targetCbCache.has(target)) return;

		var evtCallbacks = targetCbCache.get(target)[eventName];

		if (!evtCallbacks) return;

		//copy callbacks to fire because list can change in some handler
		var fireList = evtCallbacks.slice();
		for (var i = 0; i < fireList.length; i++ ) {
			fireList[i] && fireList[i].call(target, {
				detail: data,
				type: eventName
			});
		}
	}

	return this;
}




/**
 * detects whether element is able to emit/dispatch events
 * @todo detect eventful objects in a more wide way
 */
function isEventTarget (target){
	return target && (!!target.addEventListener || (target.on && target.off && target.trigger));
}
},{}],5:[function(require,module,exports){
var slice = [].slice;
var ctx = document;

module.exports = function (selector, multiple) {
  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector.length) ? slice.call(selector, 0) : selector;
};
},{}],6:[function(require,module,exports){
var getElements = require('tiny-element');
var evt = require('muevents');
var intersects = require('intersects');


/**
 * @module lifecycle-events/viewport
 *
 * @True {[type]}
 */
module.exports = enableViewportEventsFor;


var win = window, doc = document;

/**
 * List of observable viewport events targets/queries
 */
var vpTargets = [];


/**
 * Observe targets
 */
function enableViewportEventsFor(target, options){
	//append target to options
	options.query = target;

	//ensure tolerance
	options.tolerance = options.tolerance === undefined ? 0 : options.tolerance;

	vpTargets.push(options);
	checkViewport();
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



/** check elements need to be entered/left */
function checkViewport(){
	for (var i = 0; i < vpTargets.length; i++){
		var targetOptions = vpTargets[i];
		var query = targetOptions.query;

		var targets = getElements(query, true);

		for (var j = targets.length; j--;){
			var target = targets[j];
			var targetRect = target.getBoundingClientRect();

			//if item is entered - check to call entrance
			if (enteredItemsSet.has(target)){
				if (!intersects(targetRect, vpRect, targetOptions)) {
					enteredItemsSet.delete(target);
					evt.emit(target, targetOptions.leftViewCallbackName, null, true);
				}
			}

			//check to call leave
			else {
				if (intersects(targetRect, vpRect, targetOptions)) {
					enteredItemsSet.add(target);
					evt.emit(target, targetOptions.enteredViewCallbackName, null, true);
				}
			}
		}
	}
}
},{"intersects":3,"muevents":4,"tiny-element":5}]},{},[1])(1)
});