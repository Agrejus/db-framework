import { ContextOptions } from "../../types/context-types"
import { IDbRecord } from "../../types/entity-types"
import { DbPluginInstanceCreator, IDbPlugin, IDbPluginOptions } from "../../types/plugin-types"
import { DataContext } from "../DataContext"
import { StatefulDataContext } from "../StatefulDataContext"

export const contextBuilder = <TDocumentType extends string>(contextOptions?: ContextOptions) => {
    return {
        useBaseRecord: <TEntityBase extends IDbRecord<TDocumentType>>() => {

            return {
                useExclusions: <TExclusions extends keyof TEntityBase>() => {

                    return {
                        usePlugin: <TPluginOptions extends IDbPluginOptions, TDbPlugin extends IDbPlugin<TDocumentType, TEntityBase, TExclusions>, TPluginCreator extends DbPluginInstanceCreator<TDocumentType, TEntityBase, TExclusions, TDbPlugin>>(options: TPluginOptions | (() => TPluginOptions), Plugin: TPluginCreator) => {

                            const p = new Plugin(typeof options === "function" ? options() : options);

                            return {

                                createDefault: <TInstance extends new () => DataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>>(
                                    extend: (Base: new () => DataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>) => TInstance
                                ) => {
                                    return extend(class extends DataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin> {
                                        constructor() {
                                            super(typeof options === "function" ? options() : options, Plugin, contextOptions)
                                        }
                                    });
                                },
                                createStateful: <TInstance extends new () => StatefulDataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>>(
                                    extend: (Base: new () => StatefulDataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin>) => TInstance
                                ) => {
                                    return extend(class extends StatefulDataContext<TDocumentType, TEntityBase, TExclusions | typeof p.types.exclusions, TPluginOptions, TDbPlugin> {
                                        constructor() {
                                            super(typeof options === "function" ? options() : options, Plugin, contextOptions)
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