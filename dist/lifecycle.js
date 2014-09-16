!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.lifecycle=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var MO = require('mutation-observer');
var evt = require('muevents');
var matches = require('matches-selector');
var getElements = require('tiny-element');
var intersects = require('intersects');


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
var lifecycle = module.exports = enableLifecycleEventsFor;
lifecycle.enable = enableLifecycleEventsFor;
lifecycle.disable = disableLifecycleEventsFor;
lifecycle.enableViewport = enableViewportEventsFor;
lifecycle.disableViewport = disableViewportEventsFor;
lifecycle.enableMutations = enableMutationEventsFor;
lifecycle.disableMutations = disableMutationEventsFor;


/** Defaults can be changed outside */
var defaults = lifecycle.defaults = {
	attachedCallbackName: 'attached',
	detachedCallbackName: 'detached',
	enteredViewCallbackName: 'enteredView',
	leftViewCallbackName: 'leftView',
	checkViewportCallbackName: 'checkViewport'
};


/**
 * Lifecycle enabler
 * @main
 * @chainable
 */
function enableLifecycleEventsFor(query, options){
	enableViewportEventsFor(query, options.tolerance || options);
	enableMutationEventsFor(query, options.within || options);
}


/**
 * Lifecycle disabler
 */
function disableLifecycleEventsFor(query){
	disableViewportEventsFor(query);
	disableMutationEventsFor(query);
}



/*  -------------------------  M  U  T  A  T  I  O  N  S  ---------------------------  */


/** One observer to observe a lot of nodes  */
var observer = new MO(mutationHandler);


/** Set of targets to observe */
var mTargets = [];


/** Attached items set */
var attachedItemsSet = new WeakSet;


/**
 * Observer targets
 *
 * @param {(string|Node|NodeList|document)} query Target pointer
 * @param {Object} options Settings for observer
 */
function enableMutationEventsFor(query, within){
	within = getElements(within || doc);

	//save cached version of target
	mTargets.push(query);

	//make observer observe one more target
	observer.observe(within, {subtree: true, childList: true});

	//check initial nodes
	checkAddedNodes(getElements.call(within, query, true));
}


/**
 * Stop observing items
 */
function disableMutationEventsFor(target){
	var idx = mTargets.indexOf(target);
	if (idx >= 0) {
		mTargets.splice(idx,1);
	}
}


/**
 * Handle a mutation passed
 */
function mutationHandler(mutations){
	mutations.forEach(function(mutation){
		checkAddedNodes(mutation.addedNodes);
		checkRemovedNodes(mutation.removedNodes);
	});
}


/**
 * Check nodes list to call attached
 */
function checkAddedNodes(nodes){
	var newItems = false;

	//find attached evt targets
	for (var i = nodes.length; i--;){
		var node = nodes[i];
		if (node.nodeType !== 1) continue;

		//find options corresponding to the node
		if (!attachedItemsSet.has(node)){
			if (isObservable(node)) {
				if (!newItems) {
					newItems = true;
					checkViewport();
				}
				attachedItemsSet.add(node);
				evt.emit(node, defaults.attachedCallbackName, null, true);
			}
		}
	}
}


/**
 * Check nodes list to call detached
 */
function checkRemovedNodes(nodes){
	//handle detached evt
	for (var i = nodes.length; i--;){
		var node = node[i];
		if (node.nodeType !== 1) continue;

		//find options corresponding to the node
		if (attachedItemsSet.has(node)){
			evt.emit(node, defaults.detachedCallbackName, null, true);
			attachedItemsSet.delete(node);
		}
	}
}


/**
 * Try to retrieve an options according to the target passed
 *
 * @param {Node} node An element to oppose options to
 *
 * @return {bool} true, if node is found
 */
function isObservable(node){
	//check queries
	for (var i = mTargets.length, target; i--;) {
		target = mTargets[i];
		if (node === target) return true;
		if (typeof target === 'string' && matches(node, target)) return true;
	}
}



/*  ---------------------------  V  I  E  W  P  O  R  T  ----------------------------  */


/**
 * List of observable viewport events targets/queries
 */
var vpTargets = [];


/** Set of entered viewport items */
var enteredItemsSet = new WeakSet;


/**
 * Observe targets
 */
function enableViewportEventsFor(target, tolerance){
	vpTargets.push(target);
	checkViewport();
}


/**
 * Remove targets from observation list
 */
function disableViewportEventsFor(target){
	var idx = vpTargets.indexOf(target);
	if (idx >= 0) {
		vpTargets.splice(idx,1);
	}
}


/** viewport sizes */
var vpRect = {
	top:0,
	left:0,
	bottom: win.innerHeight,
	right: win.innerWidth,
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



/** add scroll handler for the doc */
evt
.on(doc, 'scroll', checkViewport)
.on(doc, 'DOMContentLoaded', checkViewport);



/** check elements need to be entered/left */
function checkViewport(){
	for (var i = vpTargets.length; i--;){
		var query = vpTargets[i];

		var targets = getElements(query, true);

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
},{"intersects":2,"matches-selector":3,"muevents":4,"mutation-observer":5,"tiny-element":6}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
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
	//walk by list of instances
	if (fn instanceof Array){
		for (var i = fn.length; i--;){
			bind(target, evt, fn[i]);
		}
		return;
	}


	//DOM events
	if (isDOMEventTarget(target)) {
		//bind target fn
		if ($){
			//delegate to jquery
			$(target).on(evt, fn);
		} else {
			//listen to element
			target.addEventListener(evt, fn);
		}
		//FIXME: old IE
	}

	//target events
	else {
		var onMethod = getOn(target);

		//use target event system, if possible
		if (onMethod) {
			onMethod.call(target, evt, fn);
		}
	}


	//Save callback
	//ensure callbacks array for target exist
	if (!targetCbCache.has(target)) targetCbCache.set(target, {});
	var targetCallbacks = targetCbCache.get(target);

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


	//DOM events
	if (isDOMEventTarget(target)) {
		//delegate to jquery
		if ($){
			$(target).off(evt, fn);
		}

		//listen to element
		else {
			target.removeEventListener(evt, fn);
		}
	}

	//target events
	else {
		var offMethod = getOff(target);

		//use target event system, if possible
		if (offMethod) {
			offMethod.call(target, evt, fn);
		}
	}


	//Forget callback
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
	if (isDOMEventTarget(target)) {
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
		//Target events
		var emitMethod = getEmit(target);

		//use target event system, if possible
		if (emitMethod) {
			return emitMethod.call(target, eventName, data);
		}


		//fall back to default event system
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
 * detect whether DOM element implements EventTarget interface
 * @todo detect eventful objects in a more wide way
 */
function isDOMEventTarget (target){
	return target && (!!target.addEventListener);
}


/**
 * Return target’s `on` method, if it is eventable
 */
function getOn (target){
	return target.on || target.bind || target.addEventListener || target.addListener;
}


/**
 * Return target’s `off` method, if it is eventable
 */
function getOff (target){
	return target.off || target.unbind || target.removeEventListener || target.removeListener;
}


/**
 * Return target’s `emit` method, if it is eventable
 */
function getEmit (target){
	return target.emit || target.trigger || target.fire || target.dispatchEvent || target.dispatch;
}
},{}],5:[function(require,module,exports){

module.exports = window.MutationObserver
  || window.WebKitMutationObserver
  || window.MozMutationObserver;

},{}],6:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? selector : slice.call(selector, 0);
};
},{}]},{},[1])(1)
});