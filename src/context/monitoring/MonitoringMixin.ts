import { stringifyCircular } from "../../common/helpers";
import { LoggerPayload, MonitoringOptions } from "../../types/context-types";

export class MonitoringMixin {

    private readonly _options: MonitoringOptions;
    private readonly _performanceLogger = (data: LoggerPayload) => console.info(`[db-framework](${this._suffix}) .${data.name}() took ${data.delta}ms`);
    private readonly _profilingLogger = (data: LoggerPayload) => console.info(`[db-framework](${this._suffix}) .${data.name}() was called with ${data.args.length} arguments.  Arguments: ${stringifyCircular(data.args)}`);
    private readonly _performanceAndProfilingLogger = (data: LoggerPayload) => console.info(`[db-framework](${this._suffix}) .${data.name}() took ${data.delta}ms.  Called with ${data.args.length} arguments.  Arguments: ${stringifyCircular(data.args)}`);
    private readonly _suffix: string;

    constructor(options: MonitoringOptions, suffix: string) {
        this._options = options;
        this._suffix = suffix
    }

    static register(suffix: string, options: MonitoringOptions, instance: any, InstanceCreator: new () => any, methodNames: string[] = []) {
        const contextMonitor = new MonitoringMixin(options, suffix);
        contextMonitor.setup(instance, InstanceCreator, methodNames);
    }

    private _createPerformanceMixin(instance: any, name: string) {

        const original = (instance as any)[name];
        const bound = original.bind(instance);
        const threshold = this._options.performance?.threshold ?? -1;
        const logger = this._options.logger ?? this._performanceLogger;

        if (this._isAsync(original.toString())) {
            (instance as any)[name] = (async (...args: any[]) => {
                const start = Date.now();
                const result = await bound(...args);
                const end = Date.now();
                const delta = end - start;

                if (delta > threshold) {
                    logger({ name, delta, args });
                }
                return result;
            }).bind(instance);
            return
        } 

        (instance as any)[name] = ((...args: any[]) => {
            const start = Date.now();
            const result = bound(...args);
            const end = Date.now();
            const delta = end - start;

            if (delta > threshold) {
                logger({ name, delta, args });
            }
            return result;
        }).bind(instance)
    }

    private _createProfilingMixin(instance: any, name: string) {

        const original = (instance as any)[name];
        const bound = original.bind(instance);
        const logger = this._options.logger ?? this._profilingLogger;

        if (this._isAsync(original.toString())) {
            (instance as any)[name] = (async (...args: any[]) => {

                const result = await bound(...args);

                logger({ name, args });
                return result;
            }).bind(instance)

            return;
        } 

        (instance as any)[name] = ((...args: any[]) => {

            const result = bound(...args);

            logger({ name, args });
            return result;
        }).bind(instance)
    }

    private _isAsync(value: string) {
        if (value.includes("__awaiter")) {
            return true;
        }

        if (value.startsWith("async")) {
            return true;
        }

        return false;
    }

    private _createPerformanceAndProfilingMixin(instance: any, name: string) {

        const original = (instance as any)[name];
        const bound = original.bind(instance);
        const logger = this._options.logger ?? this._performanceAndProfilingLogger;

        if (this._isAsync(original.toString())) {
            (instance as any)[name] = (async (...args: any[]) => {
                const start = Date.now();
                const result = await bound(...args);
                const end = Date.now();
                logger({ name, delta: end - start, args });
                return result;
            }).bind(instance);

            return;
        } 

        (instance as any)[name] = ((...args: any[]) => {
            const start = Date.now();
            const result = bound(...args);
            const end = Date.now();
            logger({ name, delta: end - start, args });
            return result;
        }).bind(instance)
    }

    private _getPerformanceMethodNames(names: string[]) {
        const enabled = this._options.performance?.enabled ?? false;
        const only = this._options.performance?.only ?? [];

        if (enabled === false) {
            return [];
        }

        if (only.length === 0) {
            return names;
        }

        return names.filter(w => only.includes(w));
    }

    private _getProfilerMethodNames(names: string[]) {
        const enabled = this._options.profiler?.enabled ?? false;
        const only = this._options.profiler?.only ?? [];

        if (enabled === false) {
            return [];
        }

        if (only.length === 0) {
            return names;
        }

        return names.filter(w => only.includes(w));
    }

    setup(instance: any, InstanceCreator: new () => any, methodNames: string[] = []) {

        const performanceMonitoringEnabled = this._options.performance?.enabled ?? false;
        const profilerMonitoringEnabled = this._options.profiler?.enabled ?? false;

        if (performanceMonitoringEnabled === false && profilerMonitoringEnabled === false) {
            return;
        }

        if (performanceMonitoringEnabled && profilerMonitoringEnabled) {
            console.warn("Performance times will not be accurate when using the profiler is enabled")
        }

        const ignoredNames = ["registerMonitoringMixin", "constructor"]
        const names = methodNames.length === 0 ? Object.getOwnPropertyNames(InstanceCreator.prototype).filter(w => ignoredNames.includes(w) === false) : methodNames;
        const performanceMethodNames = this._getPerformanceMethodNames(names);
        const profilerMethodNames = this._getProfilerMethodNames(names);

        const performanceNameMap = names.reduce((a, v) => {

            if (performanceMethodNames.includes(v) && profilerMethodNames.includes(v)) {
                a[v] = this._createPerformanceAndProfilingMixin.bind(this);
                return a
            }

            if (performanceMethodNames.includes(v)) {
                a[v] = this._createPerformanceMixin.bind(this);
                return a
            }

            if (profilerMethodNames.includes(v)) {
                a[v] = this._createProfilingMixin.bind(this);
                return a
            }

            return a
        }, {} as { [name: string]: (instance: any, name: string) => void });

        for (const name of names) {
            const original = (instance as any)[name];

            if (typeof original !== "function") {
                continue;
            }

            const mixin = performanceNameMap[name];

            if (mixin == null) {
                continue
            }

            mixin(instance, name);
        }
    }
}