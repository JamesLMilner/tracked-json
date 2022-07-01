import { applyPatch, createPatch, Operation } from "rfc6902";

type TrackedJSONEvent = "change";
type TrackedJSONListener = Record<string, (() => void)[]>;

type JSON = string | number | boolean | null | JSONArray | JSONObject;

export interface JSONObject {
  [member: string]: JSON;
}
interface JSONArray extends Array<JSON> {}

export class TrackedJSON<T extends JSONObject> {
  constructor(options?: { initialState: T }) {
    this.obj = (options && options.initialState) || {};
    this.initialObj = this.cloneJSONObject(this.obj);
    this.handler = this.getHandler();
    this._data = new Proxy(this.obj as object, this.handler) as T;
  }

  public addEventListener(eventName: TrackedJSONEvent, callback: () => void) {
    if (
      Array.isArray(this.listeners[eventName]) &&
      !this.listeners[eventName].includes(callback)
    ) {
      this.listeners[eventName].push(callback);
    }
  }

  public removeEventListener(
    eventName: TrackedJSONEvent,
    callback: () => void
  ) {
    if (Array.isArray(this.listeners[eventName])) {
      const index = this.listeners[eventName].indexOf(callback);
      if (index !== -1) {
        this.listeners[eventName].splice(index);
      }
    }
  }

  public get data(): T {
    return this._data;
  }

  public set data(newData: T) {
    if (!this.isJSONType(newData)) {
      throw new Error("Set value has to be a valid JSON type");
    }

    // If the new set object matches entirely, we don't
    // have to create any patches
    const isIdentical = JSON.stringify(newData) === JSON.stringify(this.obj);
    if (isIdentical) {
      return;
    }

    // Create a version of the JSON object
    // before mutating it
    const preMutatedObj = this.cloneJSONObject(this.obj);

    this.obj = newData;

    this._data = new Proxy(this.obj as object, this.handler) as T;

    this.createPatches(preMutatedObj);

    if (this.listeners["change"].length) {
      this.listeners["change"].forEach((listener) => {
        listener();
      });
    }
  }

  public undo() {
    if (this.undos.length === 0) {
      return;
    }

    const undo = this.undos.pop();

    // We soft disable the proxy whilst
    // we internally apply the undo patch
    this.proxyEnabled = false;
    this.applyJSONPatch(this.obj, undo);
    this.proxyEnabled = true;

    const redo = this.patches.pop();
    this.redos.push(redo);
  }

  public redo() {
    if (this.redos.length === 0) {
      return;
    }
    const redo = this.redos.pop();

    // Store a copy of the object before applying redo
    const preMutatedObj = this.cloneJSONObject(this.obj);

    // We soft disable the proxy whilst
    // we internally apply the redo patch
    this.proxyEnabled = false;
    this.applyJSONPatch(this.obj, redo);
    this.proxyEnabled = true;

    this.patches.push(redo);

    // We must recreate the undo patch we lost from
    // the previous undo
    const undo = this.createJSONPatch(this.obj, preMutatedObj);
    this.undos.push(undo);
  }

  public clone(operation?: number) {
    // Clone the current state of the object
    if (operation === undefined) {
      return this.cloneJSONObject(this.obj);
    }

    if (operation === 0) {
      // Clone the original object
      return this.cloneJSONObject(this.initialObj);
    } else if (operation >= 0) {
      if (operation > this.patches.length - 1) {
        throw new Error(
          "Positive input can't be more than the number of patches"
        );
      }

      const patchesToApply = this.patches.slice(0, operation);

      const resultObj = this.cloneJSONObject(this.initialObj);

      patchesToApply.forEach((patch) => {
        this.applyJSONPatch(resultObj, patch);
      });

      return resultObj;
    } else if (operation < 0) {
      const patchIndex = this.patches.length + operation;

      if (patchIndex < 0) {
        throw new Error(
          "Negative input can't be more than the number of patches"
        );
      }

      const patchesToApply = this.patches.slice(0, patchIndex);
      const resultObj = this.cloneJSONObject(this.initialObj);

      patchesToApply.forEach((patch) => {
        this.applyJSONPatch(resultObj, patch);
      });

      return resultObj;
    }
  }

  get undoSize() {
    return this.patches.length;
  }

  set undoSize(val) {}

  get redoSize() {
    return this.redos.length;
  }

  set redoSize(val) {}

  public listeners: TrackedJSONListener = { change: [] };

  private _data: T;
  private obj: JSONObject;
  private initialObj: JSONObject;

  private handler;
  private patches: Operation[][] = [];
  private redos: Operation[][] = [];
  private undos: Operation[][] = [];

  private isJSONType(value: unknown): value is JSON {
    if (typeof value === "string" || typeof value === "boolean") {
      return true;
    }

    if (typeof value === "number") {
      if (value === Infinity || value === -Infinity || isNaN(value)) {
        return false;
      } else {
        return true;
      }
    }

    if (typeof value === "object") {
      if (value === null) {
        return true;
      } else if (
        value.constructor === {}.constructor ||
        value.constructor === [].constructor
      ) {
        // We could possibly call this function recursively instead,
        // I wonder if it's faster?
        try {
          JSON.parse(JSON.stringify(value));

          return true;
        } catch (error) {
          return false;
        }
      }
    }

    return false;
  }

  private proxyEnabled = true;

  private cloneJSONObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  private createJSONPatch(targetObj, diffObj) {
    return createPatch(targetObj, diffObj);
  }

  private applyJSONPatch(targetObj, patch: Operation[]) {
    return applyPatch(targetObj, patch);
  }

  private createPatches(preMutatedObj: T) {
    // Append a patch to the list of patches
    const patch = this.createJSONPatch(preMutatedObj, this.obj);

    // console.log(preMutatedObj, patch);

    this.patches.push(patch);

    const undo = this.createJSONPatch(this.obj, preMutatedObj);
    this.undos.push(undo);

    // console.log(preMutatedObj, undo);

    // Reset redos as we've changed history
    this.redos = [];
  }

  private getHandler() {
    const handler: ProxyHandler<JSONObject> = {
      get(target, prop, reciever) {
        // We don't support symbols
        if (typeof prop !== "string") {
          return;
        }

        if (prop === "isProxy") {
          return true;
        }

        const property = target[prop];

        if (typeof property === "undefined") {
          return;
        }

        // set value as proxy if object
        if (typeof property === "object" && !(property as JSONObject).isProxy) {
          target[prop] = new Proxy(property, this.handler);
        }

        return target[prop];
      },
      set(target, prop, value) {
        // We don't support symbols
        if (typeof prop !== "string") {
          return;
        }

        // If the value hasn't changed, do not consider it a
        // change and do not create a patch
        if (target[prop] === value) {
          return true;
        }

        if (!this.isJSONType(value)) {
          throw new Error("Set value has to be a valid JSON type");
        }

        // If we're mutating the object internally using patches
        // we don't to trigger any public behaviours as we are managing internal state
        if (!this.proxyEnabled) {
          // Mutate the object (set)
          target[prop] = value;
          return true;
        }

        // Create a version of the JSON object
        // before mutating it
        const preMutatedObj = this.cloneJSONObject(this.obj);

        // Mutate the object (set)
        target[prop] = value;

        if (this.listeners["change"].length) {
          this.listeners["change"].forEach((listener) => {
            listener();
          });
        }

        this.createPatches(preMutatedObj);

        return true;
      },
      deleteProperty(target, prop) {
        // We don't support symbols
        if (typeof prop !== "string") {
          return false;
        }

        if (!(prop in target)) {
          // This is slightly weird - even though we are NOT deleting because
          // this prop isn't defined the proxy will throw an error if we return false
          return true;
        }

        // If we're mutating the object internally using patches
        // we don't to trigger any public behaviours as we are managing internal state
        if (!this.proxyEnabled) {
          // Mutate the object (deletion)
          delete target[prop];
          return true;
        }

        // Create a version of the JSON object
        // before mutating it
        const preMutatedObj = this.cloneJSONObject(this.obj);

        // Mutate the object (deletion)
        delete target[prop];

        this.createPatches(preMutatedObj);

        return true;
      },
    };

    return {
      get: handler.get.bind(this),
      set: handler.set.bind(this),
      deleteProperty: handler.deleteProperty.bind(this),
    };
  }
}
