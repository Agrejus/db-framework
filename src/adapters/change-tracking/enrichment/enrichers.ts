import { memoryCache } from '../../../cache/MemoryCache';
import { EnrichmentCreatorProps } from '../../../types/change-tracking-types';
import { ChangeTrackingOptions, IDbSetProps } from '../../../types/dbset-types';
import { IDbRecord } from '../../../types/entity-types';
import { IChangeTrackingCache } from '../../../types/memory-cache-types';

export const documentTypeEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => ({ ...entity, DocumentType: dbSetProps.documentType } as TEntity)];
}

export const idEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => ({ ...entity, [changeTrackingOptions.idPropertyName]: dbSetProps.idCreator(entity) } as TEntity)];
}

export const defaultAddEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => ({ ...dbSetProps.defaults.add, ...entity } as TEntity)];
}

export const defaultRetrieveEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => ({ ...dbSetProps.defaults.retrieve, ...entity } as TEntity)];
}

export const deleteEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => {

        const result : TEntity = { 
            
            _deleted: true, 
            [changeTrackingOptions.idPropertyName]: entity[changeTrackingOptions.idPropertyName],

        } as any
        return result;
    }];
}

export const mapEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    const mapEnrichers: ((entity: TEntity) => TEntity)[] = [];

    // add mappings
    if (dbSetProps.map.length > 0) {
        const propertyMapEnrichers = dbSetProps.map.map(w => (entity: TEntity) => {
            const preTransformedValue = (entity)[w.property as keyof TEntity];
            const value = Object.prototype.toString.call(preTransformedValue) === '[object Date]' ? preTransformedValue : w.map(preTransformedValue as any, entity)

            return { ...entity, [w.property]: value } as TEntity;
        });

        mapEnrichers.push(...propertyMapEnrichers)
    }

    return mapEnrichers;
}

export const enhancementEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {

    const enhancer = dbSetProps.enhancer;

    if (enhancer != null) {
        return [(w: TEntity) => ({ ...enhancer(w), ...w })]
    }

    return [];
}

export const stripEnrichmentCreator = <TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>, TExclusions extends keyof TEntity>(dbSetProps: IDbSetProps<TDocumentType, TEntity, TExclusions>, changeTrackingOptions: EnrichmentCreatorProps<TDocumentType, TEntity>) => {
    return [(entity: TEntity) => {

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

        const stripRaw = `const { ${untrackedProperties.join(', ')}, ...result  } = entity; return result;`;

        const strip = Function("entity", stripRaw) as (entity: TEntity) => TEntity;

        memoryCache.put<IChangeTrackingCache<TDocumentType, TEntity, TExclusions>>(changeTrackingOptions.changeTrackingId, { strip })

        return strip(entity);
    }]
}