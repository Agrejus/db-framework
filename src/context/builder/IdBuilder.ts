import { DocumentKeySelector } from '../../types/common-types';
import { CustomIdCreator, IIdBuilderBase, ITerminateIdBuilder } from '../../types/dbset-builder-types';
import { EntityIdKey, EntityIdKeys, IDbRecord, IIndexableEntity } from '../../types/entity-types';
import { v4 as uuidv4 } from 'uuid';


export class IdBuilder<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> implements IIdBuilderBase<TDocumentType, TEntity> {

    private _ids: EntityIdKeys<TDocumentType, TEntity> = [];
    private _creator: CustomIdCreator<TDocumentType, TEntity> = IdBuilder.createUUID;

    get Creator() {
        return this._creator.bind(this);
    }

    custom(creator: CustomIdCreator<TDocumentType, TEntity>): ITerminateIdBuilder<TDocumentType, TEntity> {
        this._creator = creator;
        return this; 
    }

    add(key: EntityIdKey<TDocumentType, TEntity>) {
        this._ids.push(key);
        this._creator = (entity) => {

            const indexableEntity = entity as IIndexableEntity

            const keyData = this._ids.map(w => {
                if (typeof w === "string") {
                    return indexableEntity[w];
                }
    
                const selector: DocumentKeySelector<TEntity> = w as any;
    
                return String(selector(entity));
            });
    
            return [entity.DocumentType, ...keyData].filter(w => !!w).join("/");
        };

        return this;
    }

    none() {
        this._creator = w => w.DocumentType;
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }

    auto() {
        this._creator = () => uuidv4();
        return this as ITerminateIdBuilder<TDocumentType, TEntity>
    }

    static createUUID() {
        return uuidv4();
    }
}