## Lifecycle events [![Code Climate](https://codeclimate.com/github/dfcreative/lifecycle-events/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/lifecycle-events) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

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


[![NPM](https://nodei.co/npm/lifecycle-events.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/lifecycle-events/)