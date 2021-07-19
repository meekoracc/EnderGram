import {Telegram as Client, Chat, BotCommand, MessageContext} from 'puregram';
import { Config } from './Config';

import { Rcon } from 'rcon-client';
import emojiStrip from 'emoji-strip'

class TelegramClient {
  config: Config;
  client: Client;
  chatID: string;

  uuidCache: Map<string, string>

  constructor (config: Config) {
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
    // No identifier
    if(!message.chat) return;
    // Not from the right chat
    if(message.chat.id.toString() != this.chatID) return;
    // Doesn't have text
    if(!message.hasText) return;
    // Doesn't have a sender
    if(!message.from) return;

    const rcon = new Rcon({ host: this.config.RCON_HOST, port: this.config.RCON_PORT, password: this.config.RCON_PASSWORD});
    try {
      await rcon.connect();
    } catch (e) {
      console.log('[ERROR] Could not connect to server!');
      if (this.config.DEBUG) console.error(e);
    }

    let command = ''
    if (this.config.ALLOW_SLASH_COMMANDS && this.config.SLASH_COMMAND_ROLES && message.text?.startsWith('/')) {
      const author = message.from.username!;
      if (this.config.SLASH_COMMAND_ROLES.includes(author)) {
        command = message.text;
      } else {
        console.log('[INFO] User attempted a slash command without a role');
      }
    } else {
      if (this.config.TELLRAW_DOESNT_EXIST) {
        command = `/say ${this.makeMinecraftTellraw(message)}`;
      } else {
        command = `/tellraw @a ${this.makeMinecraftTellraw(message)}`;
      }
    }

    if (this.config.DEBUG) console.log(`[DEBUG] Sending command "${command}" to the server`);

    if (command) {
      await rcon.send(command).catch((e: Error) => {
        console.log('[ERROR] Could not send command!');
        if (this.config.DEBUG) console.error(e);
      }).then((str) => {
        if (str === 'Unknown command. Try /help for a list of commands') {
          console.error('[ERROR] Could not send command! (Unknown command)');
          console.error('if this was a chat message, please look into MINECRAFT_TELLRAW_DOESNT_EXIST!');
          console.error('command: ' + command);
        }
      })
    }
    rcon.end();
  }

  private makeMinecraftTellraw(message: MessageContext): string {
    const username = emojiStrip(message.from!.username!)
    const variables: {[index: string]: string} = {
      username,
      nickname: !!message.from?.firstName ? emojiStrip(message.from.firstName) : username,
      // discriminator: message.from?,
      text: emojiStrip(message.text!)
    }
    // hastily use JSON to encode the strings
    for (const v of Object.keys(variables)) {
      variables[v] = JSON.stringify(variables[v]).slice(1,-1)
    }
    
    if (this.config.TELLRAW_DOESNT_EXIST)
    {
        return this.config.TELLRAW_DOESNT_EXIST_SAY_TEMPLATE
                .replace(/%username%/g, variables.username)
                .replace(/%nickname%/g, variables.nickname)
                // .replace(/%discriminator%/g, variables.discriminator)
                .replace(/%message%/g, variables.text)
    }


    return this.config.TELLRAW_TEMPLATE
      .replace(/%username%/g, variables.username)
      .replace(/%nickname%/g, variables.nickname)
      // .replace(/%discriminator%/g, variables.discriminator)
      .replace(/%message%/g, variables.text)
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