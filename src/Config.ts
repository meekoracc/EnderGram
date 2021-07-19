export interface Config {
  TELEGRAM_TOKEN: string
  TELEGRAM_CHAT_ID: string
  TELEGRAM_MESSAGE_TEMPLATE: string

  RCON_HOST: string
  RCON_PORT: number
  RCON_PASSWORD: string
  TELLRAW_DOESNT_EXIST: boolean
  TELLRAW_DOESNT_EXIST_SAY_TEMPLATE: string
  TELLRAW_TEMPLATE: string

  LOCAL_FILE_PATH: string

  SHOW_INIT_MESSAGE: boolean

  ALLOW_USER_MENTIONS: boolean
  ALLOW_HERE_EVERYONE_MENTIONS: boolean
  ALLOW_SLASH_COMMANDS: boolean
  SLASH_COMMAND_ROLES: string[]

  REGEX_SERVER_PREFIX: string
  REGEX_MATCH_CHAT_MC: string
  REGEX_IGNORED_CHAT: string
  DEBUG: boolean

  SERVER_NAME: string
  SERVER_IMAGE: string
  SHOW_SERVER_STATUS: boolean
  SHOW_PLAYER_CONN_STAT: boolean
  SHOW_PLAYER_ADVANCEMENT: boolean
  SHOW_PLAYER_DEATH: boolean
  SHOW_PLAYER_ME: boolean
  DEATH_KEY_WORDS: string[]
}