import { memoryCache } from '../../../cache/MemoryCache';
import { ExpandedProperty, ExpandedSchema, SchemaTypes } from '../../../schema';
import { EnrichmentCreatorProps } from '../../../types/change-tracking-types';
import { IDbSetProps } from '../../../types/dbset-types';
import { IDbRecord } from '../../../types/entity-types';
import { IChangeTrackingCache } from '../../../types/memory-cache-types';

// the start of an enricher should spread the entity, then we can run the functions and spread the result
// can we componse the functions together as a string?
export const documentTypeEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: Readonly<TEntity>) => ({ ...entity, DocumentType: dbSetProps.documentType } as TEntity)];
}

export const idEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: Readonly<TEntity>) => ({ ...entity, [changeTrackingOptions.idPropertyName]: dbSetProps.idCreator(entity) } as TEntity)];
}

export const defaultAddEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: Readonly<TEntity>) => ({ ...dbSetProps.defaults.add, ...entity } as TEntity)];
}

export const defaultRetrieveEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: Readonly<TEntity>) => ({ ...dbSetProps.defaults.retrieve, ...entity } as TEntity)];
}

export const serializerEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {

    if (dbSetProps.serializer == null) {
        return [];
    }

    return [(entity: Readonly<TEntity>) => ({ ...dbSetProps.serializer({ ...entity }) } as TEntity)];
}

export const deserializerEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {

    if (dbSetProps.deserializer == null) {
        return [];
    }

    return [(entity: Readonly<TEntity>) => ({ ...dbSetProps.deserializer({ ...entity }) } as TEntity)];
}

export const enhancementEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {

    const enhancer = dbSetProps.enhancer;

    if (enhancer != null) {
        return [(w: TEntity) => {
            const enhanced = enhancer(w);

            // can we make this a string to be faster?
            for (const key in enhanced) {
                w[key] = enhanced[key];
            }

            return w;
        }]
    }

    return [];
}

export const stripEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {

    if (dbSetProps.schema == null) {
        return [(entity: Readonly<TEntity>) => {

            const cache = memoryCache.get<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(changeTrackingOptions.changeTrackingId);

            if (cache.strip != null) {
                return cache.strip(entity);
            }

            const untrackedProperties = [...changeTrackingOptions.untrackedPropertyNames];

            const enhancer = dbSetProps.enhancer;

            if (enhancer != null) {
                const enhanced = enhancer(entity);
                const added = Object.keys(enhanced);
                untrackedProperties.push(...added);
            }

            let strip = Function("entity", `return entity;`) as (entity: TEntity) => TEntity;

            if (untrackedProperties.length > 0) {
                strip = Function("entity", `const { ${untrackedProperties.join(', ')}, ...result  } = entity; return result;`) as (entity: TEntity) => TEntity;
            }

            memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(changeTrackingOptions.changeTrackingId, { strip })

            return strip(entity);
        }];
    }

    const expandedSchema = changeTrackingOptions.schemaCache.expand();

    const { properties } = expandedSchema;
    const changeTrackingProperties: (ExpandedProperty | ExpandedSchema)[] = [expandedSchema];

    for (const [_, schema] of properties) {

        if (schema.type !== SchemaTypes.Object && schema.type !== SchemaTypes.Array) {
            continue;
        }

        changeTrackingProperties.unshift(schema)
    }

    return [(entity: Readonly<TEntity>) => {

        const cache = changeTrackingOptions.schemaCache.get();

        if (cache.strip != null) {
            return cache.strip(entity)
        }

        const strippers: string[] = [];

        // enable change tracking for child objects and arrays
        for (const changeTrackingProperty of changeTrackingProperties) {

            if ('idPropertyName' in changeTrackingProperty) {
                const properties = [...changeTrackingProperty.properties].filter(([_, w]) => w.type !== SchemaTypes.Array && w.type !== SchemaTypes.Object && w.childDegree === 0).map(([_, w]) => w.propertyName).join(",")
                const stripObject = `
                const { ${properties}, ..._ } = entity;
    
                const strippedEntity = { ${properties} }`;

                strippers.unshift(stripObject)
                continue
            }

            const childProperties = [...changeTrackingProperty.properties].filter(([_, w]) => w.type !== SchemaTypes.Array && w.type !== SchemaTypes.Object).map(([w]) => w).join(",");
            const stripArray = `strippedEntity.${changeTrackingProperty.assignmentPath} = [ ...entity.${changeTrackingProperty.selectorPath} ];`;
            const stripObject = `
            const { ${childProperties}, ...rest } = entity.${changeTrackingProperty.selectorPath};
            strippedEntity.${changeTrackingProperty.assignmentPath} = { ${childProperties} };
            `;
            const fn = `
            if (strippedEntity != null && entity.${changeTrackingProperty.selectorPath} != null) {    
                ${changeTrackingProperty.type === SchemaTypes.Array ? stripArray : stripObject}
            }`
            strippers.unshift(fn);
        }

        strippers.unshift(`
        if (entity == null) {
            return entity;
        }`);

        strippers.push(`return strippedEntity;`);

        const strip = Function("entity", strippers.join("\n")) as (entity: TEntity) => TEntity;

        cache.strip = strip;

        changeTrackingOptions.schemaCache.put(cache)

        return strip(entity);
    }];
}
