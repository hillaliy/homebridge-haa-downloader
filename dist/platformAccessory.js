"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haaDownloaderAccessory = void 0;
class haaDownloaderAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.firmwareVersion = require('../package.json').version;
        this.updateOn = false;
        this.updateDetected = false;
        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Home Accessory Architect')
            .setCharacteristic(this.platform.Characteristic.Model, 'Home Accessory Architect')
            .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.firmwareVersion)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, '02182017');
        // Switch
        // create a new Switch service
        this.switchService = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
        // configure Switch name
        this.switchService.setCharacteristic(this.platform.Characteristic.Name, 'Update Button');
        // create handlers for required characteristics
        this.switchService.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.handleOnGet.bind(this))
            .onSet(this.handleOnSet.bind(this));
        // push the new value to HomeKit
        setInterval(() => {
            this.switchService.updateCharacteristic(this.platform.Characteristic.On, this.updateOn);
        }, 5000);
        // Occupancy Sensor
        // create a new Occupancy Sensor service
        this.sensorService = this.accessory.getService(this.platform.Service.OccupancySensor) || this.accessory.addService(this.platform.Service.OccupancySensor);
        // cunfigure Occupancy Sensor name
        this.sensorService.setCharacteristic(this.platform.Characteristic.Name, 'Update available');
        // create handlers for required characteristics
        this.sensorService.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
            .onGet(this.handleUpdateDetectedGet.bind(this));
        // push the new value to HomeKit
        setInterval(() => {
            this.sensorService.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, this.updateDetected);
        }, 5000);
    }
    ;
    // Handle the "GET" requests from HomeKit
    handleOnGet() {
        this.platform.log.debug('Triggered GET Update Activate');
        setTimeout(() => {
            this.updateOn = false;
        }, 8000);
        return this.updateOn;
    }
    ;
    // Handle "SET" requests from HomeKit
    handleOnSet() {
        this.platform.log.debug('Triggered SET Update Activate');
        this.updateOn = true;
        this.platform.pullUpdate();
        setTimeout(() => {
            this.updateDetected = false;
        }, 8000);
        return;
    }
    ;
    // Handle the "GET" requests from HomeKit
    handleUpdateDetectedGet() {
        this.platform.log.debug('Triggered GET Update Detected');
        if (this.platform.currentVersion !== this.platform.latestRelease) {
            this.platform.currentVersion = this.platform.latestRelease;
            this.updateDetected = true;
        }
        ;
        return this.updateDetected;
    }
    ;
}
exports.haaDownloaderAccessory = haaDownloaderAccessory;
;
//# sourceMappingURL=platformAccessory.js.map