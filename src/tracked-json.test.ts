import { TrackedJSON } from "./tracked-json";

describe("TrackJSON", () => {
  describe("initialising", () => {
    it("without an initialising object", () => {
      const tracked = new TrackedJSON();
      expect(tracked.data).toStrictEqual({});
    });

    it("with an initialising state object", () => {
      const tracked = new TrackedJSON({ initialState: { value: 0 } });
      expect(tracked.data).toStrictEqual({ value: 0 });
    });
  });

  describe("only allows valid JSON types as properties", () => {
    it("allow valid JSON types as property", () => {
      const tracked = new TrackedJSON();
      tracked.data.value = -1;
      tracked.data.value = 1;
      tracked.data.value = true;
      tracked.data.value = false;
      tracked.data.value = null;
      tracked.data.value = [];
      tracked.data.value = {};
    });

    it("allows valid JSON arrays", () => {
      const tracked = new TrackedJSON();
      tracked.data.value = [-1, 1, true, false, null, [], {}];
    });

    it("allows valid JSON objects", () => {
      const tracked = new TrackedJSON();
      tracked.data.value = {
        a: -1,
        b: 1,
        c: true,
        d: false,
        e: null,
        f: [],
        g: {},
      };
    });

    it("does not allow Functions", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = (() => {}) as any;
      }).toThrowError();
    });

    it("does not allow Errors", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = new Error() as any;
      }).toThrowError();
    });

    it("does not allow Sets", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = new Set() as any;
      }).toThrowError();
    });

    it("does not allow Maps", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = new Map() as any;
      }).toThrowError();
    });

    it("does not allow Infinity", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = Infinity;
      }).toThrowError();
    });

    it("does not allow -Infinity", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = -Infinity;
      }).toThrowError();
    });

    it("does not allow NaN", () => {
      const tracked = new TrackedJSON();

      expect(() => {
        tracked.data.value = -Infinity;
      }).toThrowError();
    });
  });

  describe("data changing", () => {
    it("can change data without an initialising object", () => {
      const tracked = new TrackedJSON();
      tracked.data.value = 1;
      expect(tracked.data.value).toBe(1);
    });

    it("can change data with an initialising object state", () => {
      const tracked = new TrackedJSON({ initialState: { value: 0 } });
      tracked.data.value = 1;
      expect(tracked.data.value).toBe(1);
    });

    it("will fail when trying to update a nested object that has not been created", () => {
      const tracked = new TrackedJSON<{ nested: { value: number } }>();
      expect(() => {
        tracked.data.nested.value = 1;
      }).toThrowError();
    });

    describe("arrays", () => {
      it("considers an array item alteration as a change", () => {
        const tracked = new TrackedJSON<{ array: number[] }>({
          initialState: { array: [] },
        });
        tracked.data.array[0] = 0;
        expect(tracked.data.array[0]).toBe(0);
      });

      it("will fail when trying to update a array that has not been created", () => {
        const tracked = new TrackedJSON<{ array: number[] }>();
        expect(() => {
          tracked.data.array[0] = 0;
        }).toThrowError();
      });

      it("will fail when trying to update a array that has not been created", () => {
        const tracked = new TrackedJSON<{ array: number[] }>();
        expect(() => {
          tracked.data.array[0] = 0;
        }).toThrowError();
      });
    });
  });

  describe("setting data", () => {
    it("can update the whole data object", () => {
      const tracked = new TrackedJSON();

      tracked.data = {};
      expect(tracked.undoSize).toBe(0);

      tracked.data = { value: 1 };
      tracked.data = { value: 2 };

      expect(tracked.undoSize).toBe(2);

      tracked.data.value = 3;
      expect(tracked.undoSize).toBe(3);

      tracked.undo();
      expect(tracked.undoSize).toBe(2);
      expect(tracked.data.value).toBe(2);

      tracked.undo();
      expect(tracked.undoSize).toBe(1);
      expect(tracked.data.value).toBe(1);

      tracked.undo();
      expect(tracked.undoSize).toBe(0);
      expect(Object.keys(tracked.data).length).toBe(0);
      expect(tracked.data.value).toBe(undefined);

      tracked.undo();
      expect(tracked.undoSize).toBe(0);
      expect(Object.keys(tracked.data).length).toBe(0);
    });

    it("handles changes in structure", () => {
      const tracked = new TrackedJSON();

      tracked.data = {};
      expect(tracked.undoSize).toBe(0);

      tracked.data = { value: 1 };
      tracked.data = { otherValue: 2 };

      expect(tracked.undoSize).toBe(2);

      tracked.data.value = 3;
      expect(tracked.undoSize).toBe(3);

      tracked.undo();
      expect(tracked.undoSize).toBe(2);
      expect(tracked.data.value).toBe(undefined);
      expect(tracked.data.otherValue).toBe(2);

      tracked.undo();
      expect(tracked.undoSize).toBe(1);
      expect(tracked.data.otherValue).toBe(undefined);
      expect(tracked.data.value).toBe(1);

      tracked.undo();
      expect(tracked.undoSize).toBe(0);
      expect(Object.keys(tracked.data).length).toBe(0);
      expect(tracked.data.value).toBe(undefined);

      tracked.undo();
      expect(tracked.undoSize).toBe(0);
      expect(Object.keys(tracked.data).length).toBe(0);
    });

    it("throws error if new data object is not valid JSON", () => {
      const tracked = new TrackedJSON();
      expect(() => {
        tracked.data = { value: new Map() } as any;
      }).toThrowError();

      expect(() => {
        tracked.data = { value: [new Map()] } as any;
      }).toThrowError();

      expect(() => {
        tracked.data = { value: { nested: new Map() } } as any;
      }).toThrowError();
    });

    it("throws error if property is a Symbol when setting", () => {
      const tracked = new TrackedJSON();
      const symbol = Symbol();

      expect(() => {
        tracked.data[symbol as any] = true;
      }).toThrowError();

      expect(() => {
        delete tracked.data[symbol as any];
      }).toThrowError();
    });

    it("throws error if property is a Symbol when deleting", () => {
      const tracked = new TrackedJSON();
      const symbol = Symbol();

      expect(() => {
        delete tracked.data[symbol as any];
      }).toThrowError();
    });
  });

  describe("clone", () => {
    describe("with shallow object", () => {
      it("the current object state", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(tracked.clone()).toStrictEqual({ value: 3 });
      });

      it("with zero index", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(tracked.clone(0)).toStrictEqual({});
      });

      it("with positive index", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(tracked.clone(1)).toStrictEqual({ value: 1 });
      });

      it("with negative index", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(tracked.clone(-1)).toStrictEqual({ value: 2 });
      });

      it("it fails when index is positively out of range", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(() => tracked.clone(4)).toThrowError();
      });

      it("it fails when index is negatively out of range", () => {
        const tracked = new TrackedJSON();

        tracked.data.value = 1;
        tracked.data.value = 2;
        tracked.data.value = 3;

        expect(() => tracked.clone(-4)).toThrowError();
      });
    });

    describe("with deep object", () => {
      it("the current object state", () => {
        const tracked = new TrackedJSON({
          initialState: {
            nested: {
              value: 1,
            },
          },
        });

        tracked.data.nested.value = 2;
        tracked.data.nested.value = 3;

        expect(tracked.clone()).toStrictEqual({ nested: { value: 3 } });
      });
    });
  });

  describe("undo", () => {
    it("can undo a single change", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;

      tracked.undo();

      expect(tracked.data.value).toBe(1);
    });

    it("can undo a multiple changes", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;
      tracked.data.value = 3;

      tracked.undo();
      tracked.undo();

      expect(tracked.data.value).toBe(1);
    });

    it("can undo multiple changes across different properties", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = {};
      tracked.data.value.one = { nestedOne: 1 };
      tracked.data.value.two = { nestedTwo: 2 };
      tracked.data.value.three = { nestedThree: 3 };

      tracked.undo();
      tracked.undo();

      expect(tracked.data.value).toStrictEqual({ one: { nestedOne: 1 } });
    });

    it("setting a property to its current value does not create a new patch to undo", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;

      // These should be ignroed
      tracked.data.value = 2;
      tracked.data.value = 2;

      tracked.undo();

      expect(tracked.data.value).toBe(1);
    });

    it("deleting a property and undoing it returns it to it's previous value", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      delete tracked.data.value;
      delete tracked.data.value;

      tracked.undo();

      expect(tracked.data.value).toBe(1);
    });
  });

  describe("redo", () => {
    it("can redo a single change", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;

      tracked.undo();

      expect(tracked.data.value).toBe(1);

      tracked.redo();

      expect(tracked.data.value).toBe(2);
    });

    it("can redo a multiple changes", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;
      tracked.data.value = 3;

      tracked.undo();
      tracked.undo();

      tracked.redo();
      tracked.redo();

      expect(tracked.data.value).toBe(3);
    });

    it("can redo multiple changes across different properties", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = {};
      tracked.data.value.one = { nestedOne: 1 };
      tracked.data.value.two = { nestedTwo: 2 };
      tracked.data.value.three = { nestedThree: 3 };

      tracked.undo();
      tracked.undo();

      tracked.redo();

      expect(tracked.data.value).toStrictEqual({
        one: {
          nestedOne: 1,
        },
        two: {
          nestedTwo: 2,
        },
      });

      tracked.redo();

      expect(tracked.data.value).toStrictEqual({
        one: {
          nestedOne: 1,
        },
        two: {
          nestedTwo: 2,
        },
        three: {
          nestedThree: 3,
        },
      });
    });

    it("can undo, redo and then undo again to get back to the original state", () => {
      const tracked = new TrackedJSON({ initialState: { value: 0 } });

      tracked.data.value = 1;

      tracked.undo();

      expect(tracked.data.value).toBe(0);
      expect(tracked.undoSize).toBe(0);

      tracked.redo();

      expect(tracked.redoSize).toBe(0);
      expect(tracked.undoSize).toBe(1);
      expect(tracked.data.value).toBe(1);

      tracked.undo();

      expect(tracked.undoSize).toBe(0);
      expect(tracked.redoSize).toBe(1);
      expect(tracked.data.value).toBe(0);
    });

    it("deleting a property and undoing then redoing it sets the value to deleted", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      delete tracked.data.value;
      delete tracked.data.value;

      tracked.undo();
      tracked.redo();

      expect(tracked.data.value).toBe(undefined);
    });

    it("can redo when no redos available is a no op", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;

      tracked.undo();

      tracked.redo();

      expect(tracked.data.value).toBe(2);

      expect(tracked.redoSize).toBe(0);

      tracked.redo();

      expect(tracked.redoSize).toBe(0);

      expect(tracked.data.value).toBe(2);
    });
  });

  describe("undoSize", () => {
    it("will correctly count undoSize before undoing", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;
      tracked.data.value = 3;
      tracked.data.value = 4;

      expect(tracked.undoSize).toBe(4);
    });

    it("will correctly count undoSize after undoing", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;
      tracked.data.value = 3;
      tracked.data.value = 4;

      tracked.undo();
      tracked.undo();
      tracked.undo();
      tracked.undo();

      expect(tracked.undoSize).toBe(0);
    });
  });

  describe("redoSize", () => {
    it("will correctly count redoSize", () => {
      const tracked = new TrackedJSON();

      tracked.data.value = 1;
      tracked.data.value = 2;
      tracked.data.value = 3;
      tracked.data.value = 4;

      tracked.undo();
      tracked.undo();

      expect(tracked.undoSize).toBe(2);
      expect(tracked.redoSize).toBe(2);
    });
  });
});
