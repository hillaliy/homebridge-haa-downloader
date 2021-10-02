import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { haaDownloaderAccessory } from './platformAccessory';

const Downloader = require('nodejs-file-downloader');
const versionCheck = require('github-version-checker');

export class haaDownloaderPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public latestRelease: string = '1.0.0';
  public currentVersion: string = '1.0.0';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');

      this.onReady();
    });
  };

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
        new haaDownloaderAccessory(this, existingAccessory);
        this.configureAccessory(existingAccessory);
        // this.api.unregisterPlatformAccessories(PLATFORM_NAME, PLUGIN_NAME, [existingAccessory]);
        // this.log.debug('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        this.log.debug('Adding new accessory:', device.DisplayName);
        const accessory = new this.api.platformAccessory(device.DisplayName, uuid);
        accessory.context.deviceId = device.UniqueId;
        accessory.context.name = device.DisplayName
        new haaDownloaderAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.configureAccessory(accessory);
      };
    };

    this.checkUpdate();
    setInterval(() => {
      this.checkUpdate();
    }, this.config['interval'] * 60 * 60 * 1000);
  };

  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);
    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  };

  async checkUpdate() {
    const options: any = {
      // token: 'PUT-YOUR-TOKEN-HERE',  // personal access token (can be omitted to use the v3 api)
      repo: 'haa',                      // repository name
      owner: 'RavenSystem',             // repository owner
      currentVersion: this.latestRelease      // your app's current version
    };
    versionCheck(options, (error: any, update: any) => {
      if (error) throw error;
      if (update) {
        this.log.info('An update is available! ' + update.name);
        this.latestRelease = JSON.stringify(update.tag).slice(9, 14);
      };
    });
  };

  async pullUpdate() {
    const path: string = `https://github.com/RavenSystem/haa/releases/download`;
    const files: any = {
      'fullhaaboot.bin': `${path}/${this.latestRelease}/fullhaaboot.bin`,
      'haaboot.bin': `${path}/${this.latestRelease}/haaboot.bin`,
      'haaboot.bin.sec': `${path}/${this.latestRelease}/haaboot.bin.sec`,
      'haamain.bin': `${path}/${this.latestRelease}/haamain.bin`,
      'haamain.bin.sec': `${path}/${this.latestRelease}/haamain.bin.sec`,
      'haaversion': `${path}/${this.latestRelease}/haaversion`,
      'otamain.bin': `${path}/${this.latestRelease}/otamain.bin`,
      'otamain.bin.sec': `${path}/${this.latestRelease}/otamain.bin.sec`,
      'otaversion': `${path}/${this.latestRelease}/otaversion`
    };
    this.log.info(`Starting download version: ${this.latestRelease}`);
    for (const Url in files) {
      const downloader = new Downloader({
        url: files[Url],
        directory: this.config['directory'], //This folder will be created, if it doesn't exist.
        cloneFiles: false //This will cause the downloader to re-write an existing file.        
      })
      try {
        await downloader.download(); //Downloader.download() returns a promise.
        this.log.info(`${Url}`);
      } catch (error) {
        this.log.info('Download failed:', error)
      };
    };
    this.log.info('****************');
    this.log.info('    All done');
    this.log.info('****************');
  };
};
