import { IQuery } from "../types";

export abstract class DataTranslator {

    abstract count<T extends number>(data: unknown): T;
    abstract min<T extends string | number | Date>(data: unknown): T;
    abstract max<T extends string | number | Date>(data: unknown): T;
    abstract sum<T extends number>(data: unknown): T;
    abstract distinct<T>(data: unknown): T;
    abstract default<T>(data: unknown): T;
    abstract skip<T>(data: unknown): T;
    abstract take<T>(data: unknown): T;

    translate<T extends {}, TShape>(data: unknown, query: IQuery<T, TShape>): TShape {


        if (query.options.skip != null && query.options.skip > 0) {
            data = this.skip(data) as TShape;
        }

        if (query.options.take != null && query.options.take > 0) {
            data = this.take(data) as TShape;
        }

        if (query.options.count === true) {
            return this.count(data) as TShape;
        }

        if (query.options.distinct === true) {
            return this.distinct(data) as TShape;
        }

        if (query.options.max === true) {
            return this.max(data) as TShape;
        }

        if (query.options.min === true) {
            return this.min(data) as TShape;
        }

        if (query.options.sum === true) {
            return this.sum(data) as TShape;
        }

        return this.default(data) as TShape;
    }
}