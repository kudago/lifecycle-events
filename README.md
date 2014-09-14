## Lifecycle-events

Polyfill-like lib providing lifecycle events for HTML elements: `enteredView`, `leftView`, `attached`, `detached` and `attributeChanged`.


## Use

Install:

`$ npm install lifecycle-events`


Code:

```js
var lifecycle = require('lifecycle-events');

//Enable lifecycle events for all elements matching the selector
lifecycle.enable('*');

//Enable lifecycle events for the Node/NodeList passed
lifecycle.enable(element);
element.addEventListener('enteredView', function(){});
element.addEventListener('attached', function(){});

//Pass custom options
lifecycle.enable('.item', {
	mutations: false,
	viewport: true,
	container: document.querySelector('.container')
});

//Disable lifecycle events for previously added selector
lifecycle.disable('*');

//Disable all lifecycle events
lifecycle.disable();
```

Can be used sepatately:
```js
var vpEvents = require('lifecycle-events/viewport');

vpEvents('*');
```


## Options

| Parameter | Type | Default | Description |
|----|:---:|:----:|---:|
| `mutations` | _bool_ | `true` | `attached` and `detached` events |
| `viewport` | _bool_ | `true` | `enteredView` and `leftView` events |
| `container` | _string_ &#124; _Element_ | `document` | Container to observe mutations within (speed purposes) |


## License

MIT