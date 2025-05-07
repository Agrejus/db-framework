import { DataTranslator } from "./DataTranslator";
import { Query } from '../Query';
import { isDate } from "../../utilities";

export class JsonTranslator<TEntity extends {}, TShape> extends DataTranslator {

    private _query: Query<TEntity, TShape>;

    constructor(query: Query<TEntity, TShape>) {
        super();
        this._query = query;
    }

    // data should be the result we are looking for 
    count<T extends number>(data: unknown): T {

        if (Array.isArray(data)) {
            return data.length as T;
        }

        throw new Error("Cannot count resulting data, it must be an array.  Please return array of data for function: count()");
    }

    min<T extends string | number | Date>(data: unknown): T {
        return this._minMax(data, "min", (a: any, b: any) => a - b);
    }

    max<T extends string | number | Date>(data: unknown): T {
        return this._minMax(data, "max", (a: any, b: any) => b - a);
    }

    sum<T extends number>(data: unknown): T {

        if (Array.isArray(data)) {

            const field = this._getSelectionField("sum");
            return data.map(w => field.getter<number>(w)).reduce((a, v) => {

                if (typeof v !== "number") {
                    throw new Error(`Cannot sum, property is not a number.  Property: ${field.sourceName}`);
                }

                return a + v;
            }, 0) as T;
        }

        throw new Error("Cannot sum resulting data, it must be an array.  Please return array of data for function: sum()");
    }

    distinct<T>(data: unknown): T {
        if (Array.isArray(data)) {

            const result = new Set<string | number | Date>();
            const field = this._getSelectionField("distinct");
            // would be nice to have property info here for type detection
            let needsDateConversion = false;

            for (let i = 0, length = data.length; i < length; i++) {
                const value = field.getter<string | number | Date>(data[i]);

                if (typeof value === "number" || typeof value === "string") {
                    result.add(value);
                    continue;
                }

                if (isDate(value)) {
                    needsDateConversion = true;
                    result.add(value.toISOString());
                    continue;
                }

            }

            if (needsDateConversion) {
                return [...result].map(w => new Date(w)) as T;
            }

            return [...result] as T
        }

        throw new Error("Cannot perform distinct on resulting data, it must be an array.  Please return array of data (string, number, or Date) for function: distinct()");
    }

    default<T>(data: unknown): T {
        return data as T
    }

    skip<T>(data: unknown): T {
        if (Array.isArray(data)) {

            if (this._query.options.skip != null && this._query.options.skip > 0) {

                if (data.length < this._query.options.skip) {
                    return data as T;
                }

                return data.slice(this._query.options.skip) as T;
            }

            return data as T;
        }

        return data as T;
    }

    take<T>(data: unknown): T {
        if (Array.isArray(data)) {

            if (this._query.options.take != null && this._query.options.take > 0) {

                if (data.length < this._query.options.take) {
                    return data as T;
                }

                return data.slice(0, this._query.options.take) as T;
            }

            return data as T;
        }

        return data as T;
    }

    private _getSelectionField(name: string) {
        if (this._query.options.fields == null ||
            this._query.options.fields.length === 0 ||
            this._query.options.fields.length > 1) {
            throw new Error(`${name}() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumberOrDateOrString).${name}()`)
        }

        return this._query.options.fields[0];
    }

    private _minMax<T extends string | number | Date>(data: unknown, name: string, sort: (a: any, b: any) => any): T {
        if (Array.isArray(data) === false) {
            throw new Error(`Cannot find ${name} from resulting data, it must be an array.  Please return array of data for function: ${name}()`)
        }

        if (this._query.options.fields == null ||
            this._query.options.fields.length === 0 ||
            this._query.options.fields.length > 1) {
            throw new Error(`${name}() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumberOrDateOrString).${name}()`)
        }

        const field = this._getSelectionField(name);
        const fieldData = data.map(w => field.getter(w));
        fieldData.sort(sort);

        return fieldData[0] as T;
    }
}