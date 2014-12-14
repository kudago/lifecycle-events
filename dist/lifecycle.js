!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.lifecycle=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var MO = require('mutation-observer');
var evt = require('emmy');
var matches = require('matches-selector');
var getElements = require('tiny-element');
var intersects = require('intersects');


var doc = document, win = window;


/**
 * @module lifecycle-events
 *
 * @todo  Work out tolerance issue (whether it needs to be passed as an option - sometimes useful, like to detect an element being fully visible)
 *
 * @todo  Optimize enabled selectors. For example, avoid extra enabling if you have '*' enabled. And so on.
 * @todo  Testling table.
 * @todo  Ignore native CustomElements lifecycle events
 *
 * @note  Nested queryselector ten times faster than doc.querySelector:
 *        http://jsperf.com/document-vs-element-queryselectorall-performance/2
 * @note  Multiple observations to an extent faster than one global observer:
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
	leftViewCallbackName: 'leftView'
};


/**
 * Lifecycle enabler
 * @main
 * @chainable
 */
function enableLifecycleEventsFor(query, within){
	enableViewportEventsFor(query);
	enableMutationEventsFor(query, within);
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
 * @param {Object} within Settings for observer
 */
function enableMutationEventsFor(query, within){
	within = getElements(within || doc);

	//save cached version of target
	mTargets.push(query);

	//make observer observe one more target
	observer.observe(within, {subtree: true, childList: true});

	//ignore not bound nodes
	if (query instanceof Node && !doc.contains(query)) return;

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
		var node = nodes[i];
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
function enableViewportEventsFor(target){
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
},{"emmy":4,"intersects":18,"matches-selector":19,"mutation-observer":20,"tiny-element":21}],2:[function(require,module,exports){
/**
 * Emitter class to mixin/inherit emitters
 * Just like node Emitter or component/emitter.
 *
 * @module emmy/Emitter
 */

module.exports = Emitter;


var on = require('./on');
var off = require('./off');
var emit = require('./emit');
var once = require('./once');
var listeners = require('./listeners');


/**
 * @constructor
 *
 * Main Emitter interface.
 */
function Emitter(target){
	if (!target) return;

	//create emitter methods on target
	for (var meth in proto){
		target[meth] = proto[meth];
	}

	return target;
}

var proto = Emitter.prototype;


/** Prototype methods are whapper so to return target for chaining calls */
proto['on'] = function(a,b){
	on(this, a,b);
	return this;
};

proto['once'] = function(a,b){
	once(this, a,b);
	return this;
};

proto['off'] = function(a,b){
	off(this, a,b);
	return this;
};

proto['emit'] = function(a,b,c){
	emit(this, a,b,c);
	return this;
};

proto['listeners'] = function(a){
	return listeners(this, a);
};

proto['hasListeners'] = function(a){
	return !!listeners(this, a).length;
};
},{"./emit":3,"./listeners":5,"./off":14,"./on":15,"./once":16}],3:[function(require,module,exports){
/**
 * @module emmy/emit
 */
var icicle = require('icicle');
var listeners = require('./listeners');
var slice = require('sliced');
var redirect = require('./src/redirect');


module.exports = emit;

//TODO: think to pass list of args to `emit`


/** detect env */
var $ = typeof jQuery === 'undefined' ? undefined : jQuery;
var doc = typeof document === 'undefined' ? undefined : document;
var win = typeof window === 'undefined' ? undefined : window;


/**
 * Emit an event, optionally with data or bubbling
 *
 * @param {string} eventName An event name, e. g. 'click'
 * @param {*} data Any data to pass to event.details (DOM) or event.data (elsewhere)
 * @param {bool} bubbles Whether to trigger bubbling event (DOM)
 *
 *
 * @return {target} a target
 */
function emit(target, eventName, data, bubbles){
	//parse args
	if (redirect(emit, arguments, true)) return;

	var emitMethod, evt = eventName;


	//Create proper event for DOM objects
	if (target.nodeType || target === doc || target === win) {
		//NOTE: this doesnot bubble on off-DOM elements

		if (eventName instanceof Event) {
			evt = eventName;
		} else {
			//IE9-compliant constructor
			evt = document.createEvent('CustomEvent');
			evt.initCustomEvent(eventName, bubbles, true, data);

			//a modern constructor would be:
			// var evt = new CustomEvent(eventName, { detail: data, bubbles: bubbles })
		}

		emitMethod = target.dispatchEvent;
	}

	//create event for jQuery object
	else if ($ && target instanceof $) {
		//TODO: decide how to pass data
		evt = $.Event( eventName, data );
		evt.detail = data;

		//FIXME: reference case where triggerHandler needed (something with multiple calls)
		emitMethod = bubbles ? targte.trigger : target.triggerHandler;
	}

	//detect target events
	else {
		emitMethod = target['emit'] || target['trigger'] || target['fire'] || target['dispatchEvent'];
	}


	//use locks to avoid self-recursion on objects wrapping this method
	if (emitMethod) {
		if (icicle.freeze(target, 'emit' + eventName)) {
			//use target event system, if possible
			emitMethod.call(target, evt, data, bubbles);
			icicle.unfreeze(target, 'emit' + eventName);

			return;
		}

		//if event was frozen - probably it is Emitter instance
		//so perform normal callback
	}


	//fall back to default event system
	//ignore if no event specified
	var evtCallbacks = listeners(target, evt);

	//copy callbacks to fire because list can be changed by some callback (like `off`)
	var fireList = slice(evtCallbacks);
	var args = slice(arguments, 2);
	for (var i = 0; i < fireList.length; i++ ) {
		fireList[i] && fireList[i].apply(target, args);
	}

	return;
}
},{"./listeners":5,"./src/redirect":17,"icicle":6,"sliced":12}],4:[function(require,module,exports){
/**
 * Export Emitter class with static API methods by default
 *
 * @module  emmy
 */

var Emmy = require('./Emitter');

var	on = require('./on'),
	off = require('./off'),
	once = require('./once'),
	emit = require('./emit'),
	listeners = require('./listeners');

//add static wrapper API
Emmy['on'] = function(a,b,c){
	on(a,b,c);
	return Emmy;
};
Emmy['once'] = function(a,b,c){
	once(a,b,c);
	return Emmy;
};
Emmy['off'] = function(a,b,c){
	off(a,b,c);
	return Emmy;
};
Emmy['emit'] = function(a,b,c,d){
	emit(a,b,c,d);
	return Emmy;
};
Emmy['listeners'] = listeners;
Emmy['hasListeners'] = function(a,b,c){
	return !!listeners(a,b,c).length;
};

module.exports = Emmy;
},{"./Emitter":2,"./emit":3,"./listeners":5,"./off":14,"./on":15,"./once":16}],5:[function(require,module,exports){
/**
 * A storage of per-target callbacks.
 * For now weakmap is used as the most safe solution.
 *
 * @module emmy/listeners
 */

var cache = new WeakMap;


module.exports = listeners;


/**
 * Get listeners for the target/evt (optionally)
 *
 * @param {object} target a target object
 * @param {string}? evt an evt name, if undefined - return object with events
 *
 * @return {(object|array)} List/set of listeners
 */
function listeners(target, evt){
	var listeners = cache.get(target);
	if (!evt) return listeners || {};
	return listeners && listeners[evt] || [];
}


/**
 * Save new listener
 */
listeners.add = function(target, evt, cb){
	//ensure set of callbacks for the target exists
	if (!cache.has(target)) cache.set(target, {});
	var targetCallbacks = cache.get(target);

	//save a new callback
	(targetCallbacks[evt] = targetCallbacks[evt] || []).push(cb);
};
},{}],6:[function(require,module,exports){
/**
 * @module Icicle
 */
module.exports = {
	freeze: lock,
	unfreeze: unlock,
	isFrozen: isLocked
};


/** Set of targets  */
var lockCache = new WeakMap;


/**
 * Set flag on target with the name passed
 *
 * @return {bool} Whether lock succeeded
 */
function lock(target, name){
	var locks = lockCache.get(target);
	if (locks && locks[name]) return false;

	//create lock set for a target, if none
	if (!locks) {
		locks = {};
		lockCache.set(target, locks);
	}

	//set a new lock
	locks[name] = true;

	//return success
	return true;
}


/**
 * Unset flag on the target with the name passed.
 *
 * Note that if to return new value from the lock/unlock,
 * then unlock will always return false and lock will always return true,
 * which is useless for the user, though maybe intuitive.
 *
 * @param {*} target Any object
 * @param {string} name A flag name
 *
 * @return {bool} Whether unlock failed.
 */
function unlock(target, name){
	var locks = lockCache.get(target);
	if (!locks || !locks[name]) return false;

	locks[name] = null;

	return true;
}


/**
 * Return whether flag is set
 *
 * @param {*} target Any object to associate lock with
 * @param {string} name A flag name
 *
 * @return {Boolean} Whether locked or not
 */
function isLocked(target, name){
	var locks = lockCache.get(target);
	return (locks && locks[name]);
}
},{}],7:[function(require,module,exports){
var isString = require('./is-string');
var isArray = require('./is-array');
var isFn = require('./is-fn');

//FIXME: add tests from http://jsfiddle.net/ku9LS/1/
module.exports = function (a){
	return isArray(a) || (a && !isString(a) && !a.nodeType && (typeof window != 'undefined' ? a != window : true) && !isFn(a) && typeof a.length === 'number');
}
},{"./is-array":8,"./is-fn":9,"./is-string":11}],8:[function(require,module,exports){
module.exports = function(a){
	return a instanceof Array;
}
},{}],9:[function(require,module,exports){
module.exports = function(a){
	return !!(a && a.apply);
}
},{}],10:[function(require,module,exports){
/**
 * @module mutype/is-object
 */

//TODO: add st8 tests

//isPlainObject indeed
module.exports = function(a){
	// return obj === Object(obj);
	return a && a.constructor && a.constructor.name === "Object";
};

},{}],11:[function(require,module,exports){
module.exports = function(a){
	return typeof a === 'string' || a instanceof String;
}
},{}],12:[function(require,module,exports){
module.exports = exports = require('./lib/sliced');

},{"./lib/sliced":13}],13:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],14:[function(require,module,exports){
/**
 * @module emmy/off
 */
module.exports = off;

var icicle = require('icicle');
var listeners = require('./listeners');
var redirect = require('./src/redirect');


/**
 * Remove listener[s] from the target
 *
 * @param {[type]} evt [description]
 * @param {Function} fn [description]
 *
 * @return {[type]} [description]
 */
function off(target, evt, fn){
	//parse args
	if (redirect(off, arguments)) return;

	var callbacks, i;

	//unbind all listeners if no fn specified
	if (fn === undefined) {
		//try to use target removeAll method, if any
		var allOff = target['removeAll'] || target['removeAllListeners'];

		//call target removeAll
		if (allOff) {
			allOff.call(target, evt, fn);
		}

		//then forget own callbacks, if any
		callbacks = listeners(target);

		//unbind all if no evtRef defined
		if (evt === undefined) {
			for (var evtName in callbacks) {
				off(target, evtName, callbacks[evtName]);
			}
		}
		else if (callbacks[evt]) {
			off(target, evt, callbacks[evt]);
		}

		return;
	}


	//target events (string notation to advanced_optimizations)
	var offMethod = target['off'] || target['removeEventListener'] || target['removeListener'];


	//use target `off`, if possible
	if (offMethod) {
		//avoid self-recursion from the outside
		if (icicle.freeze(target, 'off' + evt)){
			offMethod.call(target, evt, fn);
			icicle.unfreeze(target, 'off' + evt);
		}

		//if it’s frozen - ignore call
		else {
			return;
		}
	}


	//forget callback
	var evtCallbacks = listeners(target, evt);

	//remove specific handler
	for (i = 0; i < evtCallbacks.length; i++) {
		//once method has original callback in .fn
		if (evtCallbacks[i] === fn || evtCallbacks[i].fn === fn) {
			evtCallbacks.splice(i, 1);
			break;
		}
	}

	return;
}



},{"./listeners":5,"./src/redirect":17,"icicle":6}],15:[function(require,module,exports){
/**
 * @module emmy/on
 */
module.exports = on;


var icicle = require('icicle');
var listeners = require('./listeners');
var redirect = require('./src/redirect');


/**
 * Bind fn to the target
 *
 * @param {string} evt An event name
 * @param {Function} fn A callback
 * @param {Function}? condition An optional filtering fn for a callback
 *                              which accepts an event and returns callback
 *
 * @return {object} A target
 */
function on(target, evt, fn, condition){
	//parse args
	if (redirect(on, arguments)) return;

	//get target on method, if any
	var onMethod = target['on'] || target['addEventListener'] || target['addListener'];

	var cb;

	//apply condition wrapper
	if (condition) {
		cb = function(){
			if (condition.apply(this, arguments)) {
				return fn.apply(this, arguments);
			}
		};
		cb.fn = fn;
	} else {
		cb = fn;
	}

	//use target event system, if possible
	if (onMethod) {
		//avoid self-recursions
		//if it’s frozen - ignore call
		if (icicle.freeze(target, 'on' + evt)){
			onMethod.call(target, evt, cb);
			icicle.unfreeze(target, 'on' + evt);
		}
		else {
			return;
		}
	}

	//save the callback anyway
	listeners.add(target, evt, cb);


	return;
}
},{"./listeners":5,"./src/redirect":17,"icicle":6}],16:[function(require,module,exports){
/**
 * @module emmy/once
 */
module.exports = once;

var icicle = require('icicle');
var off = require('./off');
var on = require('./on');
var redirect = require('./src/redirect');


/**
 * Add an event listener that will be invoked once and then removed.
 *
 * @return {target}
 */
function once(target, evt, fn){
	//parse args
	if (redirect(once, arguments)) return;

	//get target once method, if any
	var onceMethod = target['once'] || target['one'] || target['addOnceEventListener'] || target['addOnceListener'];

	//use target event system, if possible
	if (onceMethod) {
		//avoid self-recursions
		if (icicle.freeze(target, 'one' + evt)){
			var res = onceMethod.call(target, evt, fn);

			//FIXME: save callback, just in case of removeListener
			// listeners.add(target, evt, fn);
			icicle.unfreeze(target, 'one' + evt);

			return res;
		}

		//if still called itself second time - do default routine
	}

	//use own events
	//wrap callback to once-call
	var cb = function() {
		off(target, evt, cb);
		fn.apply(target, arguments);
	};

	cb.fn = fn;

	//bind wrapper default way - in case of own emit method
	on(target, evt, cb);

	return cb;
}
},{"./off":14,"./on":15,"./src/redirect":17,"icicle":6}],17:[function(require,module,exports){
/**
 * Iterate method for args.
 * Ensure that final method is called with single arguments,
 * so that any list/object argument is iterated.
 *
 * Supposed to be used internally by emmy.
 *
 * @module emmy/redirect
 */


var isArrayLike = require('mutype/is-array-like');
var isObject = require('mutype/is-object');
var isFn = require('mutype/is-fn');
var slice = require('sliced');

module.exports = function(method, args, ignoreFn){
	var target = args[0], evt = args[1], fn = args[2], param = args[3];

	//batch events
	if (isObject(evt)){
		for (var evtName in evt){
			method(target, evtName, evt[evtName]);
		}
		return true;
	}

	//Swap params, if callback & param are changed places
	if (isFn(param) && !isFn(fn)) {
		method.apply(this, [target, evt, param, fn].concat(slice(args, 4)));
		return true;
	}

	//bind all callbacks, if passed a list (and no ignoreFn flag)
	if (isArrayLike(fn) && !ignoreFn){
		args = slice(args, 3);
		for (var i = fn.length; i--;){
			// method(target, evt, fn[i]);
			method.apply(this, [target, evt, fn[i]].concat(args));
		}
		return true;
	}

	//bind all events, if passed a list
	if (isArrayLike(evt)) {
		args = slice(args, 2);
		for (var i = evt.length; i--;){
			// method(target, evt[i], fn);
			method.apply(this, [target, evt[i]].concat(args));
		}
		return true;
	}

	//bind all targets, if passed a list
	if (isArrayLike(target)) {
		args = slice(args, 1);
		for (var i = target.length; i--;){
			// method(target[i], evt, fn);
			method.apply(this, [target[i]].concat(args));
		}
		return true;
	}
};
},{"mutype/is-array-like":7,"mutype/is-fn":9,"mutype/is-object":10,"sliced":12}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){

module.exports = window.MutationObserver
  || window.WebKitMutationObserver
  || window.MozMutationObserver;

},{}],21:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? (multiple ? [selector] : selector) : slice.call(selector, 0);
};
},{}]},{},[1])(1)
});