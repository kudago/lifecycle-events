var getElements = require('tiny-element');
var evt = require('muevents');


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
	vpTargets.push(target);
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