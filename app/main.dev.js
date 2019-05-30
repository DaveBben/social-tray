/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';

const Store = require('electron-store');
const request = require('request');

const store = new Store();

const path = require('path');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;
let authWindow = null;
let tray = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

function getWindowPosition() {
  const windowBounds = mainWindow.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
  );
  let y;
  if (trayBounds.y == 0) {
    y = Math.round(trayBounds.y + trayBounds.height);
  } else {
    y = Math.round(trayBounds.y - windowBounds.height);
  }
  return { x, y };
}

function showWindow() {
  const position = getWindowPosition();
  mainWindow.setPosition(position.x, position.y, false);
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
    createRedditAuthWindow();
  }
}

function getRedditTokens(code) {
  return new Promise((resolve, reject) => {
    const postData = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://www.bennettnotes.com/'
    };

    const clientID = '9s9ELesX6kP6_Q';
    const secret = 'ZBCT0hQ4rJZpxcCrpBX_5YZgJ-w';

    const url = 'https://www.reddit.com/api/v1/access_token';
    const options = {
      auth: {
        user: clientID,
        pass: secret
      },
      method: 'post',
      form: postData,
      json: true,
      url
    };
    request(options, function(err, res, body) {
      if (err) {
        reject(err);
      }
      const { access_token, refresh_token, expires_in } = body;
      resolve({ access_token, refresh_token, expires_in });
    });
  });
}

/**
 * Source: https://www.manos.im/blog/electron-oauth-with-github/
 * @param {*} url
 */
function handleCallback(site, url) {
  const raw_code = /code=([^&]*)/.exec(url) || null;
  const code = raw_code && raw_code.length > 1 ? raw_code[1] : null;
  const error = /\?error=(.+)$/.exec(url);

  if (code || error) {
    // Close the browser if code found or error
    authWindow.destroy();
  }

  // If there is a code, proceed to get token from github
  if (code) {
    getRedditTokens(code).then((config) => {
      store.set('reddit', config);
      console.log(store.get('reddit'));
    });
  } else if (error) {
    alert(
      "Oops! Something went wrong and we couldn't" +
        'log you in. Please try again.'
    );
  }
}

function createRedditAuthWindow() {
  // Should propbably not hardcode this
  authWindow.loadURL(
    'https://www.reddit.com/api/v1/authorize?client_id=9s9ELesX6kP6_Q&response_type=code&redirect_uri=https://www.bennettnotes.com/&duration=permanent&scope=read&state=bacoonia'
  );
  authWindow.show();
  authWindow.webContents.on('will-redirect', function(event, url) {
    handleCallback('reddit', url);
  });
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 300,
    height: 510,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  tray = new Tray(path.normalize(`${__dirname}/assets/triangle.png`));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' }
  ]);
  tray.setToolTip('This is my application.');
  tray.setContextMenu(contextMenu);
  tray.on('click', function(event) {
    toggleWindow();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide the window when it loses focus
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  // Auth Windows
  authWindow = new BrowserWindow({
    show: false,
    height: 600,
    width: 800,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false
    }
  });

  authWindow.setResizable(false);
});
