import fs from 'fs'
import path from 'path'
import { Tail } from 'tail'
import express from 'express'

import { Config } from './Config'

export type LogLine = {
  username: string
  message: string
} | null

type Callback = (data: LogLine) => void

class MinecraftHandler {
  config: Config

  app: express.Application
  tail: Tail

  constructor(config: Config) {
    this.config = config
  }

  private static fixMinecraftUsername (username: string) {
    return username.replace(/(§[A-Z-a-z0-9])/g, '')
  }

  private parseLogLine (data: string): LogLine {
    const ignored = new RegExp(this.config.REGEX_IGNORED_CHAT)

    if (ignored.test(data) || data.includes('Rcon connection')) {
      if (this.config.DEBUG) console.log('[DEBUG] Line ignored')
      return null
    }

    if (this.config.DEBUG) console.log('[DEBUG] Received ' + data)

    const logLineDataRegex = new RegExp(
      `${(this.config.REGEX_SERVER_PREFIX || "\\[Server thread/INFO\\]:")} (.*)`
    )

    // get the part after the log prefix, so all the actual data is here
    const logLineData = data.match(logLineDataRegex)

    if (!logLineDataRegex.test(data) || !logLineData) {
      if (this.config.DEBUG) {
        console.log('[DEBUG] Regex could not match the string:')
        console.log('Received: "' + data + '", Regex matches lines that start with: "' + this.config.REGEX_SERVER_PREFIX + '"')
      }
      return null
    }

    const logLine = logLineData[1]

    // the username used for server messages
    const serverUsername = `${this.config.SERVER_NAME} - Server`

    if (logLine.startsWith('<')) {
      if (this.config.DEBUG){
        console.log('[DEBUG]: A player sent a chat message')
      }

      const re = new RegExp(this.config.REGEX_MATCH_CHAT_MC)
      const matches = logLine.match(re)

      if (!matches) {
        console.log('[ERROR] Could not parse message: ' + logLine)
        return null
      }

      const username = MinecraftHandler.fixMinecraftUsername(matches[1])
      const message = matches[2]
      if (this.config.DEBUG) {
        console.log('[DEBUG] Username: ' + matches[1])
        console.log('[DEBUG] Text: ' + matches[2])
      }
      return { username, message }
    } else if (
      this.config.SHOW_PLAYER_CONN_STAT && (
        logLine.includes('left the game') ||
        logLine.includes('joined the game')
      )
    ) {
      // handle disconnection etc.
      if (this.config.DEBUG){
        console.log(`[DEBUG]: A player's connection status changed`)
      }

      return { username: serverUsername, message: logLine }
    } else if (this.config.SHOW_SERVER_STATUS && (logLine.includes('Starting minecraft server'))) {
        if (this.config.DEBUG) {
          console.log('[DEBUG]: Server has started')
        }
        return { username: serverUsername, message: 'Server is online' }
    } else if (this.config.SHOW_SERVER_STATUS && (logLine.includes('Stopping the server'))) {
        if (this.config.DEBUG) {
          console.log('[DEBUG]: Server has stopped')
        }
        return { username: serverUsername, message: 'Server is offline' }
    } else if (this.config.SHOW_PLAYER_ADVANCEMENT && logLine.includes('made the advancement')) {
      // handle advancements
      if (this.config.DEBUG){
        console.log('[DEBUG] A player has made an advancement')
      }
      return { username: `${this.config.SERVER_NAME} - Server`, message: logLine }
    } else if (this.config.SHOW_PLAYER_ME && logLine.startsWith('* ')) {
      // /me commands have the bolded name and the action they did
      const usernameMatch = data.match(/: \* ([a-zA-Z0-9_]{1,16}) (.*)/)
      if (usernameMatch) {
        const username = usernameMatch[1]
        const rest = usernameMatch[2]
        return { username: serverUsername, message: `**${username}** ${rest}` }
      }
    } else if (this.config.SHOW_PLAYER_DEATH) {
      for (let word of this.config.DEATH_KEY_WORDS){
        if (data.includes(word)){
          if (this.config.DEBUG) {
            console.log(
              `[DEBUG] A player died. Matched key word "${word}"`
            )
          }
          return { username: serverUsername, message: logLine }
        }
      }
    }

    return null
  }

  private initTail (callback: Callback) {
    if (fs.existsSync(this.config.LOCAL_FILE_PATH)) {
      console.log(`[INFO] Using configuration for local log file at "${this.config.LOCAL_FILE_PATH}"`)
      this.tail = new Tail(this.config.LOCAL_FILE_PATH, {useWatchFile: true})
    } else {
      throw new Error(`[ERROR] Local log file not found at "${this.config.LOCAL_FILE_PATH}"`)
    }
    this.tail.on('line', (data: string) => {
      // Parse the line to see if we care about it
      let logLine = this.parseLogLine(data)
      if (data) {
        callback(logLine)
      }
    })
    this.tail.on('error', (error: any) => {
      console.log('[ERROR] Error tailing log file: ' + error)
    })
  }

  public init (callback: Callback) {
    this.initTail(callback)
  }
}

export default MinecraftHandler
