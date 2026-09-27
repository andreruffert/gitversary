import { name } from '../package.json' with { type: 'json' };
import { BUILD_VERSION } from './build-info';

export const APP_NAME = name;
export const APP_DISPLAY_NAME = 'Gitversary';
export const APP_VERSION = BUILD_VERSION;
export const APP_BASE_URL = 'https://gitversary.andreruffert.com';
