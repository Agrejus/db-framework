import { ReadOnlyList } from "../../common/ReadOnlyList";

describe('ReadOnlyList', () => {

    it('should return all items', () => {
        const list = new ReadOnlyList<{ id: string, value: string }>("id", [
            { id: "one", value: "one" },
            { id: "two", value: "two" },
            { id: "three", value: "three" }
        ]);

        expect(list.all()).toEqual([{ id: "one", value: "one" }, { id: "two", value: "two" }, { id: "three", value: "three" }]);
    });

    it('should match and return items', () => {
        const list = new ReadOnlyList<{ id: string, value: string }>("id", [
            { id: "one", value: "one" },
            { id: "two", value: "two" },
            { id: "three", value: "three" }
        ]);

        expect(list.match({ id: "one", value: "one" })).toEqual([{ id: "one", value: "one" }]);
    });

    it('should match and nothing if no match', () => {
        const list = new ReadOnlyList<{ id: string, value: string }>("id", [
            { id: "one", value: "one" },
            { id: "two", value: "two" },
            { id: "three", value: "three" }
        ]);

        expect(list.match({ id: "four", value: "four" })).toEqual([]);
    });
});