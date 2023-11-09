import { IDbRecord } from '../types/entity-types';
import {ReselectDictionary} from './ReselectDictionary';

export class ValueReselectDictionary<TDocumentType extends string, TEntity extends IDbRecord<TDocumentType>> extends ReselectDictionary< TDocumentType, TEntity> {

    override push(...items: TEntity[]) {
        const clonedItems = JSON.parse(JSON.stringify(items)) as TEntity[];
        super.push(...clonedItems)
    }
}