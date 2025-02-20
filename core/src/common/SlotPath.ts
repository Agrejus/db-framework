export class SlotPath {

    private _path: string[];

    get path() {
        return [...this._path]
    }

    constructor(...pathLike: string[]) {
        this._path = pathLike;
    }

    push(...pathLike: string[]) {
        this._path.push(...pathLike);
    }

    get(up: number = 0) {
        return this._path.slice(0, this._path.length - up).join(".")
    }
}