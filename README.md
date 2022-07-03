# TrackedJSON

![TackedJSON CI](https://github.com/JamesLMilner/tracked-json/actions/workflows/ci.yml/badge.svg)

TrackedJSON is a JavaScript library which provides frictionless undo/redo for JSON objects.

TrackedJSON tries to maintain a relatively minimal API - the core of the library is the `.data` property which represents the JSON object you want to keep track of. You can update it just like a regular JavaScript object, with the only requirement being that properties have to be valid JSON types.

## Install

```shell
npm install tracked-json
```

## Basic Usage

You can use it like so:

```javascript
const tracked = new TrackedJSON();

// tracked.data is an empty object at this point

tracked.data.value = 1;
tracked.data.value = 2;
tracked.data.value = 3;

tracked.undo();
tracked.undo();

// tracked.data.value === 1

tracked.redo();
tracked.redo();

// tracked.data.value === 3
```

## Docs

[See the docs here](https://jameslmilner.github.io/tracked-json/)

Common questions answered on usage:

### How many undo/redo operations are there for my data object?

You can get the size of the undo stack using `undoSize` like so:

```javascript
const tracked = new TrackedJSON({ initialState: { value: 0 } });
tracked.data.value = 1;
tracked.data.value = 2;
console.log(tracked.undoSize); // 2
tracked.undo();
tracked.undo();
console.log(tracked.redoSize); // 2
```

### How do I instantiate with a given state?

You can instantiate an object with a starting state like so:

```javascript
const tracked = new TrackedJSON({ initialState: { value: 0 } });
console.log(tracked.data.value); // 0
```

### Can I replace the whole data object with a new one?

If you want to replace the whole data object, this is possible and will be tracked as normal, like so:

```javascript
const tracked = new TrackedJSON();
tracked.data.value = 0;
tracked.data = { value: 1 };
tracked.undo();
console.log(tracked.data.value); // 0
```

### Do I need to guard against non JSON?

Properties and nested properties of the data object must be valid JSON. Attempting to set non valid JSON properties and will throw an error like so:

```javascript
const tracked = new TrackedJSON();
tracked.data.value = {}; // does not throw error
tracked.data.value = 1; // does not throw error
tracked.data.value = []; // does not throw error
tracked.data.value = "string"; // does not throw error
tracked.data.value = true; // does not throw error

tracked.data.value = new Map(); // throws error
```

# License

MIT
