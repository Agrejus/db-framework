import { DataTranslator } from "./DataTranslator";
import { isDate } from "../../utilities/index";

export class JsonTranslator<TEntity extends {}, TShape> extends DataTranslator<TEntity, TShape> {

    override translate(data: unknown): TShape {
        const filteredData = this.filter(data);
        return super.translate(filteredData);
    }

    map<T>(data: unknown): T {

        if (this.query.options.shaper == null) {
            throw new Error("Cannot find internal map function");
        }

        if (Array.isArray(data) == false) {
            throw new Error("Can only map an array of data");
        }

        const response = [];

        for (let i = 0, length = data.length; i < length; i++) {
            response.push(this.query.options.shaper(data[i]));
        }

        return response as T;
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

    sort<T>(data: unknown): T {
        if (Array.isArray(data) && this.query.options.sort != null) {

            for (const sort of this.query.options.sort) {
                data.sort((a, b) => {
                    if (sort.direction === "asc") {
                        return (sort.selector(a) as any) - (sort.selector(b) as any);
                    }

                    return (sort.selector(b) as any) - (sort.selector(a) as any);
                })
            }
        }

        return data as T;
    }

    sum<T extends number>(data: unknown): T {

        if (Array.isArray(data) === false) {
            throw new Error("Cannot sum resulting data, it must be an array.  Please return array of data for function: sum()");
        }

        if (this.query.options.shaper == null) {
            throw new Error(`sum() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumber).sum()`)
        }

        let sum = 0;
        const field = this._getSelectionField("sum");

        for (let i = 0, length = data.length; i < length; i++) {
            const value = data[i];

            if (typeof value !== "number") {
                throw new Error(`Cannot sum, property is not a number.  Property: ${field.sourceName}`);
            }

            sum += value;
        }

        return sum as T;
    }

    distinct<T>(data: unknown): T {

        if (Array.isArray(data) === false) {
            throw new Error("Cannot perform distinct on resulting data, it must be an array.  Please return array of data (string, number, or Date) for function: distinct()");
        }

        if (this.query.options.shaper == null) {
            throw new Error(`distinct() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumberOrDateOrString).distinct()`)
        }

        const result = new Set<string | number | Date>();
        // would be nice to have property info here for type detection
        let needsDateConversion = false;

        for (let i = 0, length = data.length; i < length; i++) {
            const value = data[i];

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

    default<T>(data: unknown): T {
        return data as T
    }

    skip<T>(data: unknown): T {
        if (Array.isArray(data)) {

            if (this.query.options.skip != null && this.query.options.skip > 0) {

                if (data.length < this.query.options.skip) {
                    return data as T;
                }

                return data.slice(this.query.options.skip) as T;
            }

            return data as T;
        }

        return data as T;
    }

    take<T>(data: unknown): T {
        if (Array.isArray(data)) {

            if (this.query.options.take != null && this.query.options.take > 0) {

                if (data.length < this.query.options.take) {
                    return data as T;
                }

                return data.slice(0, this.query.options.take) as T;
            }

            return data as T;
        }

        return data as T;
    }

    private _getSelectionField(name: string) {
        if (this.query.options.fields == null ||
            this.query.options.fields.length === 0 ||
            this.query.options.fields.length > 1) {
            throw new Error(`${name}() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumberOrDateOrString).${name}()`)
        }

        return this.query.options.fields[0];
    }

    private _minMax<T extends string | number | Date>(data: unknown, name: string, sort: (a: any, b: any) => any): T {
        if (Array.isArray(data) === false) {
            throw new Error(`Cannot find ${name} from resulting data, it must be an array.  Please return array of data for function: ${name}()`)
        }

        if (this.query.options.shaper == null) {
            throw new Error(`${name}() operation can only be performed when one field is mapped for a result.  Ex.  myset.map(x => x.someNumberOrDateOrString).${name}()`)
        }

        data.sort(sort);

        return data[0] as T;
    }
}