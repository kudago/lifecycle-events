## Lifecycle-events

Polyfill-like lib providing lifecycle events for HTML elements: `enteredView`, `leftView`, `attached` and `detached`.

It is _2.1 kB_ gzipped.


## Use as polyfill

Include [lifecycle.min.js](https://github.com/dfcreative/lifecycle/raw/master/dist/lifecycle.min.js):

```html
<script src="lifecycle.min.js"></script>
<script>lifecycle('*');</script>
```


## Use customly:

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


## TODO

* Optimize enabled selectors. For example, avoid extra enable if you have '*' enabled. And so on.


## License

MIT