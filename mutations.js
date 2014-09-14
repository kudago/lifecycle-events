module.exports = enableMutationEvents;


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