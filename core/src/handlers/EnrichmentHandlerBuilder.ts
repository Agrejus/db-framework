import { EnrichmentNullableObjectHandler } from "./enrichment/EnrichmentNullableObjectHandler";
import { EnrichmentObjectHandler } from "./enrichment/EnrichmentObjectHandler";
import { EnrichmentObjectIdentityHandler } from "./enrichment/EnrichmentObjectIdentityHandler";
import { EnrichmentPrimitiveIdentityHandler } from "./enrichment/EnrichmentPrimitiveIdentityHandler";
import { EnrichmentPrimitiveHandler } from './enrichment/EnrichmentPrimitiveHandler';
import { EnrichmentFunctionHandler } from './enrichment/EnrichmentFunctionHandler';
import { EnrichmentDefaultValueHandler } from './enrichment/EnrichmentDefaultValueHandler';
import { EnrichmentDefaultFunctionHandler } from './enrichment/EnrichmentDefaultFunctionHandler';
import { EnrichmentComputedValueHandler } from './enrichment/EnrichmentComputedValueHandler';

/// Purpose: 
export class EnrichmentHandlerBuilder {

    build() {
        const handler = new EnrichmentPrimitiveIdentityHandler();

        handler.setNext(new EnrichmentObjectIdentityHandler())
            .setNext(new EnrichmentObjectHandler())
            .setNext(new EnrichmentNullableObjectHandler())
            .setNext(new EnrichmentFunctionHandler())
            .setNext(new EnrichmentDefaultValueHandler())
            .setNext(new EnrichmentDefaultFunctionHandler())
            .setNext(new EnrichmentComputedValueHandler())
            .setNext(new EnrichmentPrimitiveHandler());

        return handler;
    }
}