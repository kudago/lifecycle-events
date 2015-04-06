## Lifecycle events [![Code Climate](https://codeclimate.com/github/kudago/lifecycle-events/badges/gpa.svg)](https://codeclimate.com/github/kudago/lifecycle-events) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>


Enable lifecycle events for HTML elements: `attached`, `detached`.


## Usage

`$ npm install lifecycle-events`


```js
	var lifecycleEvents = require('lifecycle-events');

	//enable lifecycle events for all elements on the page
	lifecycleEvents.enable();
	$('.my-element').on('attached', function(){});
	$('.my-other-element').on('detached', function(){});

	//Disable all lifecycle events
	lifecycleEvents.disable();


	//Enable lifecycle events for a Node/NodeList
	lifecycleEvents.enable(element);
	element.addEventListener('attached', function(){});
	element.addEventListener('detached', function(){});

	//Disable lifecycle events for the previously added element/selector
	lifecycleEvents.disable(element);
```

## API

### lifecycleEvents.enable(selector, [container])

Enable lifecycle events for an Element, NodeList or selector. If no selector specified, `'*'` is used. An optional container element/selector may be specified in speed purpose.

### lifecycleEvents.disable(selector)

Disable lifecycle events for previously registered selector. If no selector specified, all lifecycle events are unbound.

### lifecycleEvents.attachedCallbackName

Callback name used for attaching lifecycle event. `attached` is used by default. Synomim: `DOMNodeInserted`.

### lifecycleEvents.detachedCallbackName

Callback name used for detaching lifecycle event. `detached` is used by default.Synomim: `DOMNodeRemoved`.


Also see [viewport-events](http://github.com/kudago/viewport-events) for `enteredView` and `leftView` events.


[![NPM](https://nodei.co/npm/lifecycle-events.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/lifecycle-events/)