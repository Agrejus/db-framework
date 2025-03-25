import { EnableChangeTrackingObjectHandler } from "./enableChangeTracking/EnableChangeTrackingObjectHandler";
import { EnableChangeTrackingPrimitiveValueHandler } from "./enableChangeTracking/EnableChangeTrackingPrimitiveValueHandler";

/// Purpose: 
export class EnableChangeTrackingHandlerBuilder {

    build() {
        const handler = new EnableChangeTrackingObjectHandler();
        handler.setNext(new EnableChangeTrackingPrimitiveValueHandler());

        return handler;
    }
}