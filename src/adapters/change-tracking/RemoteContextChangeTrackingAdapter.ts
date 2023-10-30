import { IDbRecord } from "../../types/entity-types";
import { ContextChangeTrackingAdapter } from "./ContextChangeTrackingAdapter";

export class RemoteContextChangeTrackingAdapter<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity> extends ContextChangeTrackingAdapter<TDocumentType, TEntity, TExclusions> {

    protected remote: TEntity[] = [];

    attachRemote(data: TEntity[]) {

        for (const item of data) {
            this.remote.push(item)
        }

        return data;
    }

    override reinitialize(removals?: TEntity[], add?: TEntity[], updates?: TEntity[]): void {
        super.reinitialize(removals, add, updates);
        this.remote = [];
    }

    getRemotes() {
        return this.remote;
    }
}