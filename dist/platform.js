"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haaDownloaderPlatform = void 0;
const settings_1 = require("./settings");
const platformAccessory_1 = require("./platformAccessory");
const Downloader = require('nodejs-file-downloader');
const versionCheck = require('github-version-checker');
const fs = require('fs');
const axios = require('axios');
class haaDownloaderPlatform {
    constructor(log, config, api, currentVersion = '', latestRelease = '') {
        this.log = log;
        this.config = config;
        this.api = api;
        this.currentVersion = currentVersion;
        this.latestRelease = latestRelease;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.log.debug('Finished initializing platform:', this.config.name);
        this.api.on('didFinishLaunching', () => {
            this.log.debug('Executed didFinishLaunching callback');
            this.onReady();
        });
    }
    ;
    onReady() {
        const Devices = [
            {
                UniqueId: '02182017',
                DisplayName: 'HAADownloader',
            }
        ];
        for (const device of Devices) {
            const uuid = this.api.hap.uuid.generate(device.UniqueId);
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                this.log.debug('Restoring existing accessory from cache:', existingAccessory.displayName);
                existingAccessory.context.deviceId = device.UniqueId;
                existingAccessory.context.name = device.DisplayName;
                this.api.updatePlatformAccessories([existingAccessory]);
                new platformAccessory_1.haaDownloaderAccessory(this, existingAccessory);
                this.configureAccessory(existingAccessory);
                fs.readFile(this.config['currentVersionFile'], (error, data) => {
                    if (error) {
                        this.log.error(error);
                    }
                    else {
                        this.currentVersion = data.toString();
                        this.latestRelease = data.toString();
                    }
                });
            }
            else {
                this.log.debug('Adding new accessory:', device.DisplayName);
                const accessory = new this.api.platformAccessory(device.DisplayName, uuid);
                accessory.context.deviceId = device.UniqueId;
                accessory.context.name = device.DisplayName;
                new platformAccessory_1.haaDownloaderAccessory(this, accessory);
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
                this.configureAccessory(accessory);
                fs.writeFile(this.config['currentVersionFile'], '1.0.0', (error, data) => {
                    if (error) {
                        this.log.error(error);
                    }
                    this.log.info('Create current version file successfully!');
                });
            }
            ;
        }
        ;
        this.checkUpdate();
        setInterval(() => {
            this.checkUpdate();
        }, this.config['interval'] * 60 * 60 * 1000);
    }
    ;
    configureAccessory(accessory) {
        this.log.debug('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    ;
    async checkUpdate() {
        const options = {
            // token: 'PUT-YOUR-TOKEN-HERE',  // A personal access token used to access the Github GraphQL API (v4). Can be omitted and instead be read from an env variable called GITHUB_API_TOKEN. When no token can be found, the module will fall back to the Github Rest API (v3).
            repo: 'haa',
            owner: 'RavenSystem',
            currentVersion: '1.0.0',
            fetchTags: false,
            latestOnly: false,
            excludePrereleases: true // Excludes pre-releases from checks
        };
        versionCheck(options).then((update) => {
            if (update) {
                // this.log.info('An update is available! ' + update.name)
                // this.log.info('You are on version ' + this.currentVersion)
                this.latestRelease = JSON.stringify(update.tag).slice(9, 15);
            }
            else {
                this.log.info('You are up to date.');
            }
        }).catch((error) => {
            this.log.error(error);
        });
    }
    ;
    async pullUpdate() {
        const url = `https://api.github.com/repos/RavenSystem/haa/releases/tags/${this.latestRelease}`;
        const response = await axios.get(url);
        const files = response.data.assets.reduce((fileName, asset) => {
            fileName[asset.name] = asset.browser_download_url;
            return fileName;
        }, {});
        this.log.info(`Starting download version: ${this.latestRelease}`);
        for (const url in files) {
            const downloader = new Downloader({
                url: files[url],
                directory: this.config['directory'],
                cloneFiles: false // This will cause the downloader to re-write an existing file.        
            });
            try {
                await downloader.download(); // Downloader.download() returns a promise.
                this.log.info(`${url}`);
            }
            catch (error) {
                this.log.error('Download failed:', error);
            }
            ;
        }
        ;
        this.log.info('****************');
        this.log.info('    All done');
        this.log.info('****************');
        fs.writeFile(this.config['currentVersionFile'], this.currentVersion, (err, data) => {
            if (err) {
                this.log.error(err);
            }
            else
                this.log.info('Current version file updated');
        });
    }
    ;
}
exports.haaDownloaderPlatform = haaDownloaderPlatform;
;
//# sourceMappingURL=platform.js.map