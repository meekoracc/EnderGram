import TelegramClient from './Telegram'
import Handler, { LogLine } from './MinecraftHandler'

import { Config } from './Config'

class EnderGram {
  config: Config
  client: TelegramClient
  handler: Handler

  constructor() {
  }

  loadConfig () {
    console.log(process.env['CONFIG_PATH']);
    const configPath = process.env['CONFIG_PATH'] ? process.env['CONFIG_PATH'] : '../config.json'
    const configFile = (process.argv.length > 2) ? process.argv[2] : configPath
    console.log('[INFO] Using configuration file:', configFile)
    try{
      // Get from config file
      this.config = require(configFile);
      const expectedKeys = Object.keys(this.config);
      console.log(expectedKeys);
      expectedKeys.forEach((fieldName) => {
        const value = process.env[fieldName];
        console.log(fieldName, value);
        if (value != null) {
          try{
            //@ts-ignore
            this.config[fieldName] = JSON.parse(process.env[fieldName]);
          } catch(e) {
            console.log(`[INFO] Parse fail for ${process.env[fieldName]}`)
            //@ts-ignore
            this.config[fieldName] = process.env[fieldName];
          }
        }
      });
    } catch(e) {
      console.log('[ERROR] Could not load config file!')
      console.error(e);
      return false
    }

    console.log('[INFO] Using the bot to send messages')

    return true
  }

  onReady () {
    this.handler.init(async (data: LogLine) => {
      if (data) {
        const { username, message } = data
        await this.client.sendMessage(username, message)
      }
    })
  }

  async init () {
    const loaded = this.loadConfig()
    if (!loaded) return

    this.client = new TelegramClient(this.config);
    this.handler = new Handler(this.config);

    await this.client.init();
    this.onReady();
  }
}

export default EnderGram
