import { IQuery } from "../types";

export abstract class DataTranslator<T extends {}, TShape> {

    protected query: IQuery<T, TShape>;

    constructor(query: IQuery<T, TShape>) {
        this.query = query;
    }

    abstract count<T extends number>(data: unknown): T;
    abstract min<T extends string | number | Date>(data: unknown): T;
    abstract max<T extends string | number | Date>(data: unknown): T;
    abstract sum<T extends number>(data: unknown): T;
    abstract distinct<T>(data: unknown): T;
    abstract default<T>(data: unknown): T;
    abstract skip<T>(data: unknown): T;
    abstract take<T>(data: unknown): T;
    abstract sort<T>(data: unknown): T;
    abstract map<T>(data: unknown): T;

    translate(data: unknown): TShape {

        if (this.query.options.sort != null && this.query.options.sort.length > 0) {
            // don't return, we are sorting in place
            this.sort(data);
        }

        if (this.query.options.shaper != null) {
            data = this.map(data) as TShape;
        }

        if (this.query.options.skip != null && this.query.options.skip > 0) {
            data = this.skip(data) as TShape;
        }

        if (this.query.options.take != null && this.query.options.take > 0) {
            data = this.take(data) as TShape;
        }

        if (this.query.options.count === true) {
            return this.count(data) as TShape;
        }

        if (this.query.options.distinct === true) {
            return this.distinct(data) as TShape;
        }

        if (this.query.options.max === true) {
            return this.max(data) as TShape;
        }

        if (this.query.options.min === true) {
            return this.min(data) as TShape;
        }

        if (this.query.options.sum === true) {
            return this.sum(data) as TShape;
        }

        return this.default(data) as TShape;
    }
}