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