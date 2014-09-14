Provide lifecycle events for elements:

* enteredView
* leftView
* attached
* detached
* attributeChanged

## Use

Install:

`$ npm install lifecycle-events`


Code:

```js
var lifecycle = require('lifecycle-events');


//Enable lifecycle events for all elements matching the selector
lifecycle.on('*');


//Enable lifecycle events for the Node/NodeList passed
lifecycle.on(element);
element.addEventListener('enteredView', function(){
	//...
});
element.addEventListener('attached', function(){
	//...
});


//Pass custom options
lifecycle.on('.item', {
	mutations: false,
	viewport: true,
	container: document.querySelector('.container')
});


//Disable lifecycle events for previously added selector
lifecycle.off('*');


//Disable all lifecycle events
lifecycle.off();
```


## Options


## Options

| Parameter | Type | Default | Description |
|----|:---:|:----:|---:|
| `mutations` | _bool_ | `true` | `attached` and `detached` events |
| `viewport` | _bool_ | `true` | `enteredView` and `leftView` events |
| `container` | _string_|_Element_ | `document` | A container to restrict selector (speed purposes) |