var MO = require('mutation-observer');
var on = require('emmy/on');
var emit = require('emmy/emit');
var off = require('emmy/off');
var matches = require('matches-selector');
var getElements = require('tiny-element');
var contains = require('contains');


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
var lifecycle = module.exports = enable;
lifecycle.enable = enable;
lifecycle.disable = disable;


/** Defaults can be changed outside */
lifecycle.attachedCallbackName = 'attached';
lifecycle.detachedCallbackName = 'detached';


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
function enable(query, within) {
	if (!query) query = '*';

	within = getElements(within || doc);

	//save cached version of target
	mTargets.push(query);

	//make observer observe one more target
	observer.observe(within, {subtree: true, childList: true});

	//ignore not bound nodes
	if (query instanceof Node && !contains(doc, query)) return;

	//check initial nodes
	checkAddedNodes(getElements.call(within, query, true));
}


/**
 * Stop observing items
 */
function disable(target) {
	var idx = mTargets.indexOf(target);
	if (idx >= 0) {
		mTargets.splice(idx,1);
	}
}


/**
 * Handle a mutation passed
 */
function mutationHandler(mutations) {
	mutations.forEach(function(mutation) {
		checkAddedNodes(mutation.addedNodes);
		checkRemovedNodes(mutation.removedNodes);
	});
}


/**
 * Check nodes list to call attached
 */
function checkAddedNodes(nodes) {
	var newItems = false, node;

	//find attached evt targets
	for (var i = nodes.length; i--;) {
		node = nodes[i];
		if (node.nodeType !== 1) continue;

		//find options corresponding to the node
		if (!attachedItemsSet.has(node)) {
			node = getObservee(node);
			//if observee found within attached items - add it to set
			if (node) {
				if (!newItems) {
					newItems = true;
				}
				attachedItemsSet.add(node);
				emit(node, lifecycle.attachedCallbackName, null, true);
			}
		}
	}
}


/**
 * Check nodes list to call detached
 */
function checkRemovedNodes(nodes) {
	//handle detached evt
	for (var i = nodes.length; i--;) {
		var node = nodes[i];
		if (node.nodeType !== 1) continue;

		//find options corresponding to the node
		if (attachedItemsSet.has(node)) {
			emit(node, lifecycle.detachedCallbackName, null, true);
			attachedItemsSet.delete(node);
		}
	}
}


/**
 * Check whether node is observing
 *
 * @param {Node} node An element to check on inclusion to target list
 */
function getObservee(node) {
	//check queries
	for (var i = mTargets.length, target; i--;) {
		target = mTargets[i];
		if (node === target) return node;
		if (typeof target === 'string' && matches(node, target)) return node;

		//return innermost target
		if (contains(node, target)) return target;
	}
}