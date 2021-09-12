import { API, PlatformAccessory } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { haaDownloaderPlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform('homebridge-haa-downloader', 'haa-downloader', haaDownloaderPlatform);
};
