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
    const configFile = (process.argv.length > 2) ? process.argv[2] : '../config.json'
    console.log('[INFO] Using configuration file:', configFile)
    this.config = require(configFile)
    if (!this.config) {
      console.log('[ERROR] Could not load config file!')
      return false
    }

    if (this.config.USE_WEBHOOKS) {
      console.log('[INFO] Using WebHooks to send messages')
    } else {
      console.log('[INFO] Using the bot to send messages')
    }

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
