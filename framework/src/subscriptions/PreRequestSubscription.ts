import { createUUID } from "@agrejus/db-framework-core";

type PreRequestSubscriptionPayload = {
    id: string;
    payloadId: string;
    type: "pre" | "request" | "connected"
}

type ConnectedPreRequestSubscriptionPayload = PreRequestSubscriptionPayload & {
    data: any;
}


// There is the potential we are going to serialize a ton of data to keep a dbset updated internally for subscriptions.
// Because DbSets can be connected and disconnected via instantiation, there is the possibility we are going to 
// serialize 1000's of records needlessly, slowing down the app, send a pre request to find all of the 
// connections, then only send the data if connected
export class PreRequestSubscription implements Disposable {

    private _channel;
    private _id = createUUID();
    private _callback: ((data: any) => void) | null = null;
    private _payloads: Map<string, any> = new Map<string, any>();

    constructor(id: number) {
        this._channel = new BroadcastChannel(`__db-framework-pre-request-subscription-channel-${id}`);
        this._channel.onmessage = (event: any) => {
            const message = event.data as PreRequestSubscriptionPayload;

            if (message.type === "pre" && message.id !== this._id) {
                // other dbset
                const preMessage: PreRequestSubscriptionPayload = {
                    id: message.id,
                    type: "connected",
                    payloadId: message.payloadId
                }

                this._channel.postMessage(preMessage);
                return;
            }

            if (message.type === "connected" && message.id === this._id) {
                // root dbset
                if (this._payloads.has(message.payloadId) === false) {
                    console.warn("Unable to find payload ID for subscription, DbSet might be out of date");
                    return;
                }

                const data = this._payloads.get(message.payloadId)!;
                const preMessage: ConnectedPreRequestSubscriptionPayload = {
                    id: message.id,
                    type: "request",
                    payloadId: message.payloadId,
                    data
                }
                this._channel.postMessage(preMessage);
                return;
            }

            if (message.type === "request" && message.id !== this._id) {

                const connectedMessage = message as ConnectedPreRequestSubscriptionPayload;

                if (this._callback == null) {
                    console.warn("No callback registered, DbSet cannot update");
                    return;
                }
                debugger;
                this._callback(connectedMessage);
                return;
            }
        };
    }

    onMessage<T>(callback: (data: T) => void) {
    }

    send<T>(data: T) {
        const payloadId = createUUID();
        this._payloads.set(payloadId, data);
        console.log('Payload set', this._payloads, this._id);
        const message: PreRequestSubscriptionPayload = {
            id: this._id,
            payloadId,
            type: "pre"
        }
        this._channel.postMessage(message)
    }

    [Symbol.dispose](): void {
        this._channel.onmessage = null;
        this._channel.close();
    }

}