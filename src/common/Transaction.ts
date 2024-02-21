export class Transaction {

    private readonly _now: number;
    private readonly _ids: Set<string | number>;
    readonly type: "add" | "update" | "remove";

    constructor(type: "add" | "update" | "remove", ...ids: (string | number)[]) {
        this._ids = new Set(ids);
        this._now = Date.now();
        this.type = type;
    }

    get now() { 
        return this._now;
    }

    get ids() {
        return Array.from(this._ids);
    }

    static now() {
        return Date.now()
    }

    add(id: string | number) {
        this._ids.add(id);
    }

    has(id: string | number) {
        return this._ids.has(id);
    }

    hasAny(ids: (string | number)[]) {
        return ids.some(id => this._ids.has(id));
    }
}