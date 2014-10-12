## Lifecycle events

Polyfill-like lib enabling lifecycle events for HTML elements: `enteredView`, `leftView`, `attached` and `detached`.

_2.1 kB_ gzipped.


### A. Use as a polyfill:

Include [lifecycle.min.js](https://github.com/dfcreative/lifecycle/raw/master/dist/lifecycle.min.js):

```html
<script src="lifecycle.min.js"></script>
<script>lifecycle('*');</script>

<script>
  $('.my-element').on('attached', function(){});
  $('.my-other-element').on('enteredView', function(){});
</script>
```


### B. Use as a browserify module:

Install:

`$ npm install lifecycle-events`


Code:

```js
var lifecycle = require('lifecycle-events');


//Enable lifecycle events for the Node/NodeList passed
lifecycle.enable(element);
element.addEventListener('enteredView', function(){});
element.addEventListener('attached', function(){});


//Enable only viewport events
lifecycle.enableViewport('.item');


//Enable only mutation events within the container '.feed' (container is optional)
lifecycle.enableMutation('.item', '.feed');


//Disable lifecycle events for the previously added selector
lifecycle.disable('*');


//Disable all lifecycle events
lifecycle.disable();
```

### Customize callback names

By default, Polymer’s event names are used for events.
You can redefine event names via `lifecycle.defaults`:

```js
lifecycle.defaults.attachedCallbackName = 'appended';
lifecycle.defaults.detachedCallbackName = 'removed';
lifecycle.defaults.enteredViewCallbackName = 'appeared';
lifecycle.defaults.leftViewCallbackName = 'disappeared';
```


## TODO

* Optimize enabled selectors. For example, avoid extra enabling if you have '*' enabled. And so on.
* Testling table


## Unlicense

This is free and unencumbered software released into the public domain.

[![Unlicense](http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg)](http://unlicense.org/UNLICENSE)