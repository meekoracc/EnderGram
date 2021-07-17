import {Telegram as Client, Chat, BotCommand, MessageContext} from 'puregram';
import { TelegramOptions } from 'puregram/lib/interfaces';
import { Config } from './Config';

class TelegramClient {
  config: Config;
  client: Client;
  chatID: string;

  uuidCache: Map<string, string>

  constructor (config: Config, options?: Partial<TelegramOptions>) {
    this.config = config;

    this.client = new Client({token: this.config.TELEGRAM_TOKEN});
    this.client.updates.on('message', (message: MessageContext) => this.onMessage(message));

    this.chatID = this.config.TELEGRAM_CHAT_ID;

    this.uuidCache = new Map();
  }

  public async init() {
    try {
      await this.client.updates.startPolling(); 
      if (this.config.DEBUG) console.log(`@${this.client.bot.username} is polling!`);
    } catch (e) {
      console.log('[ERROR] Could not start Telegram bot: ' + e);
      if (this.config.DEBUG) console.error(e);
    }
  }

  // This is on receiving a message, doesn't need to respond
  private async onMessage(message: MessageContext) {
    console.log(message);
  }

  // This is to send one out
  public async sendMessage (username: string, message: string) {
    // TODO: build message
    console.log(username, message);
    await this.client.api.sendMessage({
      chat_id: this.chatID,
      text: this.config.TELEGRAM_MESSAGE_TEMPLATE
                .replace('%username%', username)
                .replace('%message%', message)
    });
  }
}

export default TelegramClient;