## Lifecycle events

Polyfill-like lib enabling lifecycle events for HTML elements: `enteredView`, `leftView`, `attached` and `detached`.

It is _2.1 kB_ gzipped.


### A. Use as polyfill:

Include [lifecycle.min.js](https://github.com/dfcreative/lifecycle/raw/master/dist/lifecycle.min.js):

```html
<script src="lifecycle.min.js"></script>
<script>lifecycle('*');</script>

<script>
  $('.my-element').on('attached', function(){});
  $('.my-other-element').on('enteredView', function(){});
</script>
```


### B. Custom use:

Install browserify module:

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


//Enable only mutation events within container passed
lifecycle.enableMutation('.item', '.feed');


//Disable lifecycle events for previously added selector
lifecycle.disable('*');


//Disable all lifecycle events
lifecycle.disable();
```

### Customize callback names

By default, Polymer’s event names are used for events.
You can redefine event names, defined in `lifecycle.defaults`:

```js
lifecycle.defaults.attachedCallbackName = 'appended';
lifecycle.defaults.detachedCallbackName = 'removed';
lifecycle.defaults.enteredViewCallbackName = 'appeared';
lifecycle.defaults.leftViewCallbackName = 'disappeared';
```


## TODO

* Optimize enabled selectors. For example, avoid extra enabling if you have '*' enabled. And so on.
* Testling table

## License

MIT
