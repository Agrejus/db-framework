import AVFoundation
import UIKit

@objc public class CapacitorUtilities: NSObject {

    @objc public func getDevicePhysicalMemory() -> UInt64 {
        return ProcessInfo.processInfo.physicalMemory
    }
}