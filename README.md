# TrackedJSON

TrackedJSON is a library that allows manipulate an object composed of valid JSON types, whilst providing a nice way to rewind and replay history of that object with `undo` and `redo` methods.

TrackedJSON tries to maintain a relatively minimal API - the core of the library is the `.data` property which is where you can maniplulate your data that you want to keep track of. You can update it just like a regular JavaScript object, with the only requirement being that properties have to be valid JSON types.

You can use it like so:

```javascript
const tracked = new TrackedJSON();

// tracked.data is an empty object at this point

tracked.data.value = 1;
tracked.data.value = 2;
tracked.data.value = 3;
```

There are two other methods which are the core part of TrackedJSON API, namely `undo` and `redo`. They work like this:

```javascript
tracked.undo();
tracked.undo();

// tracked.data.value === 1

tracked.redo();
tracked.redo();

// tracked.data.value === 3
```

## Install

```
npm install tracked-json
```

# License

MIT
