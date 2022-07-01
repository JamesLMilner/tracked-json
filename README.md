# Tracked JSON

Tracked JSON is a library that allows manipulate an object composed of valid JSON types, whilst allowing you to rewind and replay history of that object with `undo` and `redo`.

TrackedJSON tries to maintain a relatively minimal API - the core of the library is the `.data` property which is where you can maniplulate your data that you want to keep track of. This is just a plain JavaScript object which you can use like so:

```javascript
const tracked = new TrackedJSON();

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
