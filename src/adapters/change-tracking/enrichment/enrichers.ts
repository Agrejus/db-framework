import { memoryCache } from '../../../cache/MemoryCache';
import { EnrichmentCreatorProps } from '../../../types/change-tracking-types';
import { IDbSetProps } from '../../../types/dbset-types';
import { IDbRecord } from '../../../types/entity-types';
import { IChangeTrackingCache } from '../../../types/memory-cache-types';

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

            for (const key in enhanced) {
                w[key] = enhanced[key];
            }
            return w;
        }]
    }

    return [];
}

export const stripEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
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
    }]
}