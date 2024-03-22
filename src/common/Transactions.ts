import { IProcessedUpdates } from "../types/context-types";
import { IDbRecord } from "../types/entity-types";
import { Transaction } from "./Transaction";

export class Transactions {
    private _transactions: Map<number, Transaction> = new Map();

    start(type: "add" | "remove") {
        const transaction = new Transaction(type);
        const now = transaction.now;
        const found = this._transactions.get(now);

        if (found != null) {
            return found;
        }

        this._transactions.set(now, transaction);
        return transaction;
    }

    appendUpdates<TDocumentType extends string, TEntityBase extends IDbRecord<TDocumentType>>(updates: IProcessedUpdates<TDocumentType, TEntityBase>) {

        for(const id in updates.timestamp) {
            const now = updates.timestamp[id];
            const found = this._transactions.get(now);

            if (found != null) {

                found.add(id);
                return;
            }

            const transaction = new Transaction("update");
            transaction.add(id);
            this._transactions.set(now, transaction);
        }
    }   

    end(transaction: Transaction) {
        this._transactions.delete(transaction.now);
    }

    get(id: string | number): Transaction | null {
        for (const transaction of this._transactions.values()) {
            if (transaction.has(id)) {
                return transaction;
            }
        }

        return null;
    }

    concat(transactions: Transactions) {
        const result = new Transactions();

        for(const transaction of this._transactions.values()) {
            result._transactions.set(transaction.now, transaction);
        }

        for (const transaction of transactions._transactions.values()) {

            if (result._transactions.has(transaction.now)) {
                const found = result._transactions.get(transaction.now);

                if (found != null) {
                    transaction.ids.forEach(id => found.add(id));
                }
            }

            result._transactions.set(transaction.now, transaction);
        }

        return result;
    }

    endAll() {
        this._transactions = new Map();
    }
}