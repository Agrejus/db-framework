import { createUUID } from "@agrejus/db-framework-core";

type UniDirectionalSubscriptionPayload = {
    id: string;
}

export class UniDirectionalSubscription implements Disposable {

    private _channel;
    private _id = createUUID();
    private _callback: (() => void) | null = null;

    constructor(id: number, abortController: AbortController) {
        this._channel = new BroadcastChannel(`__db-framework-unidirectional-subscription-channel-${id}`);
        this._channel.onmessage = (event: any) => {
            const message = event.data as UniDirectionalSubscriptionPayload;
            if (message.id === this._id) {
                return;
            }

            if (this._callback != null) {
                this._callback();
            }
        };

        abortController.signal.addEventListener("abort", () => {
            this[Symbol.dispose]();
        }, { once: true });
    }

    send() {
        const message: UniDirectionalSubscriptionPayload = {
            id: this._id,
        }
        this._channel.postMessage(message)
    }

    onMessage(callback: () => void) {
        this._callback = callback;
    }


    [Symbol.dispose](): void {
        this._channel.onmessage = null;
        this._channel.close();
        this._channel = null;
    }

}