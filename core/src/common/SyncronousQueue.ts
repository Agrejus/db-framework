export type SyncronousUnitOfWork = (done: () => void) => void

export class SyncronousQueue {

    private readonly _queue: SyncronousUnitOfWork[] = [];
    private _current: SyncronousUnitOfWork | null = null;

    enqueue(unitOfWork: SyncronousUnitOfWork) {
        this._queue.push(unitOfWork);
        this._next();
    }

    private _next() {
        if (this._current != null || this._queue.length === 0) {
            return;
        }
    
        // Take first item
        this._current = this._queue.shift() ?? null;

        if (this._current == null) {
            return;
        }
    
        this._current(() => {
            this._current = null;
            this._next();
        })
    }
}