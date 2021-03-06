/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import { get } from 'lodash'
import { getWebSocketProtocol } from 'utils'

let socketInstance // singleton socket client

const readyStates = ['connecting', 'open', 'closing', 'closed']
const defaultOptions = {
  reopenLimit: 3,
  onopen() {},
  onmessage() {},
  onclose() {},
  onerror() {},
}
let reopenCount = 0

export default class SocketClient {
  static composeEndpoint = (socketUrl, suffix = '') => {
    const re = /(\w+?:\/\/)?([^\\?]+)/
    const matchParts = String(socketUrl).match(re)
    return `${getWebSocketProtocol(window.location.protocol)}://${
      matchParts[2]
    }${suffix}`
  }

  constructor(endpoint, options = {}) {
    this.endpoint = endpoint
    this.options = Object.assign(defaultOptions, options)

    if (!this.endpoint) {
      throw Error(`invalid websocket endpoint: ${this.endpoint}`)
    }
    this.setUp()
  }

  getSocketState(readyState) {
    if (readyState === undefined) {
      readyState = this.client.readyState
    }

    return readyStates[readyState]
  }

  initClient() {
    const subProto = get(this.options, 'subProtocol')

    if (!socketInstance) {
      socketInstance = new WebSocket(this.endpoint, subProto)
    }

    if (socketInstance && socketInstance.readyState > 1) {
      socketInstance.close()
      socketInstance = new WebSocket(this.endpoint, subProto)
    }

    this.client = socketInstance
    return this.client
  }

  attachEvents() {
    const { onopen, onmessage, onclose, onerror } = this.options

    this.client.onopen = ev => {
      onopen && onopen(ev)
    }

    this.client.onmessage = message => {
      let data = message.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (e) {}
      }

      onmessage && onmessage(data)
    }

    this.client.onclose = ev => {
      // if socket will close, try to keep alive
      if (!this.immediately && reopenCount < this.options.reopenLimit) {
        setTimeout(this.setUp.bind(this), 1000)
        reopenCount++
      }

      onclose && onclose(ev)
    }

    this.client.onerror = ev => {
      console.error('socket error: ', ev)
      onerror && onerror(ev)
    }
  }

  send(data) {
    return this.client.send(data)
  }

  close(val) {
    val && (this.immediately = true)
    socketInstance.close()
  }

  setUp() {
    this.initClient()
    this.attachEvents()
  }
}
