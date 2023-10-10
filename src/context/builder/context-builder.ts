import { ContextInstanceCreator, ContextOptions } from "../../types/context-types"
import { IDbRecord } from "../../types/entity-types"
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from "../../types/plugin-types"
import { DataContext } from "../DataContext"

export const contextBuilder = <TDocumentType extends string>(contextOptions?: ContextOptions) => {
    return {
        useBaseRecord: <TEntityBase extends IDbRecord<TDocumentType>>() => {

            return {
                useExclusions: <TExclusions extends keyof TEntityBase>() => {

                    return {
                        usePlugin: <TPluginOptions extends IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>, TPluginCreator extends DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>>(options: TPluginOptions, Plugin: TPluginCreator) => {
                            const p = new Plugin(options);

                            return {

                                create: <TInstance extends ContextInstanceCreator<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>>(
                                    extend: (Base: ContextInstanceCreator<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>) => TInstance
                                ) => {
                                    return extend(class extends DataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin> {
                                        constructor() {
                                            super(options, Plugin, contextOptions)
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}