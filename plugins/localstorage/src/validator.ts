import { MemoryDbRecord } from "./types";

interface IValidationResult<TDocumentType extends string, TEntity extends MemoryDbRecord<TDocumentType>> {
    propertyName: keyof TEntity;
    ok: boolean;
    error: string;
    entity: TEntity
}

export const validateAttachedEntity = <TDocumentType extends string, TEntity extends MemoryDbRecord<TDocumentType>>(entity: TEntity) => {

    const properties: (keyof TEntity)[] = ["id", "rev", "DocumentType"];

    return properties.map(w => {
        const value = entity[w];
        const result: IValidationResult<TDocumentType, TEntity> = {
            ok: true,
            propertyName: w,
            error: "",
            entity
        };

        if (value == null) {
            result.ok = false;
            result.error = `Property cannot be null or undefined.  Property: ${String(w)}, Entity: ${JSON.stringify(entity)}`
            return result;
        }

        return result;
    })
}