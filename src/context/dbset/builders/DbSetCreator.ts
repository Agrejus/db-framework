import { IDbSet } from "../../../types/dbset-types";
import { IDbRecord } from "../../../types/entity-types";
import { IDbPlugin, IDbPluginOptions } from "../../../types/plugin-types";
import { DataContext } from "../../DataContext";
import { DbSetInitializer } from "./DbSetInitializer";

export const useDbSetCreator = <
    TDocumentType extends string,
    TEntityBase extends IDbRecord<TDocumentType>,
    TExclusions extends keyof TEntityBase,
    TPluginOptions extends IDbPluginOptions,
    TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>,
    T
>(callback: (creator: DataContext<TDocumentType, TEntityBase, TExclusions, TPluginOptions, TDbPlugin>) => T) => {
    return callback
}