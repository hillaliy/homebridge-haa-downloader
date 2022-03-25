import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { haaDownloaderAccessory } from './platformAccessory';

const Downloader = require('nodejs-file-downloader');
const versionCheck = require('github-version-checker');
const fs = require('fs');

export class haaDownloaderPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
    public currentVersion: string = '',
    public latestRelease: string = ''
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
        fs.readFile(this.config['currentVersionFile'], (error: any, data: string) => {
          if (error) {
            this.log.error(error);
          } else {
            this.currentVersion = data.toString();
            this.latestRelease = data.toString();
          }
        })
      } else {
        this.log.debug('Adding new accessory:', device.DisplayName);
        const accessory = new this.api.platformAccessory(device.DisplayName, uuid);
        accessory.context.deviceId = device.UniqueId;
        accessory.context.name = device.DisplayName
        new haaDownloaderAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.configureAccessory(accessory);
        fs.writeFile(this.config['currentVersionFile'], '1.0.0', (error: any, data: string) => {
          if (error) {
            this.log.error(error);
          }
          this.log.info('Create current version file successfully!');
        });
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
      // token: 'PUT-YOUR-TOKEN-HERE',  // A personal access token used to access the Github GraphQL API (v4). Can be omitted and instead be read from an env variable called GITHUB_API_TOKEN. When no token can be found, the module will fall back to the Github Rest API (v3).
      repo: 'haa',                      // The name of your Github repository.
      owner: 'RavenSystem',             // The owner of your Github repository
      currentVersion: '1.0.0',        // Your app's current version.
      fetchTags: false,                 // Whether to fetch the repositories' git tags instead of the GitHub releases. Useful when no releases are created, but only tags.
      latestOnly: false,                // Setting this to true will fetch the latest release only
      excludePrereleases: true          // Excludes pre-releases from checks
    };

    versionCheck(options).then((update: any) => {
      if (update) {
        // this.log.info('An update is available! ' + update.name)
        // this.log.info('You are on version ' + this.currentVersion)
        this.latestRelease = JSON.stringify(update.tag).slice(9, 15);
      } else {
        this.log.info('You are up to date.')
      }
    }).catch((error: any) => {
      this.log.error(error)
    })
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
        this.log.error('Download failed:', error)
      };
    };
    this.log.info('****************');
    this.log.info('    All done');
    this.log.info('****************');
    fs.writeFile(this.config['currentVersionFile'], this.currentVersion, (err: any, data: string) => {
      if (err) {
        this.log.error(err);
      } else
        this.log.info('Current version file updated');
    });
  };
};
