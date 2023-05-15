import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { haaDownloaderAccessory } from './platformAccessory';

const Downloader = require('nodejs-file-downloader');
const versionCheck = require('github-version-checker');
const fs = require('fs');
const axios = require('axios');

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
    interface GithubVersionCheckOptions {
      // token?: string;
      repo: string;
      owner: string;
      currentVersion: string;
      fetchTags?: boolean;
      latestOnly?: boolean;
      excludePrereleases?: boolean;
    }

    const options: GithubVersionCheckOptions = {
      // token: 'PUT-YOUR-TOKEN-HERE',  // A personal access token used to access the Github GraphQL API (v4). Can be omitted and instead be read from an env variable called GITHUB_API_TOKEN. When no token can be found, the module will fall back to the Github Rest API (v3).
      repo: 'haa',                      // The name of your Github repository.
      owner: 'RavenSystem',             // The owner of your Github repository
      currentVersion: '1.0.0',        // Your app's current version.
      fetchTags: false,                 // Whether to fetch the repositories' git tags instead of the GitHub releases. Useful when no releases are created, but only tags.
      latestOnly: false,                // Setting this to true will fetch the latest release only
      excludePrereleases: true          // Excludes pre-releases from checks
    };

    try {
      const update = await versionCheck(options);
      if (update) {
        this.latestRelease = update.tag.name;
        // this.log.info(`A new HAA version ${this.latestRelease} is available.`);
        // this.log.info(`You are on version ${this.currentVersion}`)
      } else {
        this.log.info('You are up to date.');
      }
    } catch (error) {
      this.log.error(`Error checking for updates: ${error}`);
    }
  };

  async pullUpdate() {
    const url = `https://api.github.com/repos/RavenSystem/haa/releases/tags/${this.latestRelease}`;
    const response = await axios.get(url);
    const files = response.data.assets.reduce((fileName: { [x: string]: any; }, asset: { name: string | number; browser_download_url: any; }) => {
      fileName[asset.name] = asset.browser_download_url;
      return fileName;
    }, {});
    this.log.info(`Starting download version: ${this.latestRelease}`);
    for (const url in files) {
      const downloader = new Downloader({
        url: files[url],
        directory: this.config['directory'], // This folder will be created, if it doesn't exist.
        cloneFiles: false // This will cause the downloader to re-write an existing file.        
      })
      try {
        await downloader.download(); // Downloader.download() returns a promise.
        this.log.info(`${url}`);
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
