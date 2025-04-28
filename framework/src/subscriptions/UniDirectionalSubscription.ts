import { uuid, InferType } from "@agrejus/db-framework-core";

type UniDirectionalSubscriptionPayload<T extends {}> = {
    id: string;
    changes: InferType<T>[];
}

// This is intented to run the "OnMessage" event whenever we "send".  For context
// when we make a change, we query to see if we have any changes.  We need to run a fetch because we could have 
// many db sets
export class UniDirectionalSubscription<T extends {}> implements Disposable {

    private _channel;
    private _id = uuid();
    private _callback: ((changes: InferType<T>[]) => void) | null = null;

    constructor(id: number, signal: AbortSignal) {
        this._channel = new BroadcastChannel(`__db-framework-unidirectional-subscription-channel-${id}`);
        this._channel.onmessage = (event: any) => {
            const message = event.data as UniDirectionalSubscriptionPayload<T>;
            if (message.id === this._id) {
                return;
            }

            if (this._callback != null) {
                this._callback(message.changes);
            }
        };

        signal.addEventListener("abort", () => {
            this[Symbol.dispose]();
        }, { once: true });
    }

    send(changes: InferType<T>[]) {
        const message: UniDirectionalSubscriptionPayload<T> = {
            id: this._id,
            changes
        }
        this._channel.postMessage(message)
    }

    onMessage(callback: (changes: InferType<T>[]) => void) {
        this._callback = callback;
    }

    [Symbol.dispose](): void {
        this._channel.onmessage = null;
        this._channel.close();
        this._channel = null;
    }
}