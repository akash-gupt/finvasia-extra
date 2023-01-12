import EventEmitter from 'events';
import WS from 'ws';

class WebSocket extends EventEmitter {
  static webSocketURL = `wss://api.shoonya.com/NorenWSTP/`;
  static readTimeout = 5 * 1000;
  static heartBeatTimeout = 3 * 1000;
  userId: string | undefined;
  accountId: string | undefined;
  accessToken: string | undefined;
  debug: boolean;
  socket: WS | undefined;
  readTimer: NodeJS.Timer | undefined;
  heartBeatTimer: NodeJS.Timer | undefined;
  lastReadTimestamp: number;
  logger: { info: (p: any) => void; error: (p: any) => void; debug: (p: any) => void };
  connectTimer: NodeJS.Timeout | undefined;

  constructor(options: { userId: string | undefined; accessToken: string | undefined; debug: boolean }) {
    super();
    if (!options) {
      options = Object.assign({ userId: undefined, accessToken: undefined, debug: false }, options);
    }

    this.userId = options.userId;
    this.accountId = options.userId;
    this.accessToken = options.accessToken;
    this.debug = !!options.debug;
    this.socket = undefined;
    this.readTimer = undefined;
    this.heartBeatTimer = undefined;
    this.lastReadTimestamp = Date.now();
    this.logger = console;
    this.connectTimer = undefined;
    if (this.debug === false) {
      this.logger.debug = () => {};
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.accountId = userId;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  connect() {
    if (
      this.socket &&
      (this.socket.readyState == this.socket.CONNECTING || this.socket.readyState == this.socket.OPEN)
    ) {
      return;
    }

    this.socket = new WS(WebSocket.webSocketURL);

    this.socket.onopen = (e) => {
      this.logger.debug('event: open');
      this.emit('open', e);

      // connect to socket
      const msg = {
        t: 'c', // connection task
        uid: this.userId,
        actid: this.accountId,
        susertoken: this.accessToken,
        source: 'API',
      };
      if (this.socket) {
        const strMsg = JSON.stringify(msg);
        this.logger.debug(`Sending message: ${strMsg}`);
        this.socket.send(strMsg);
        // TODO: handle error in socket.send call
        this.logger.debug('event: init_connection');
        this.emit('init_connection', e);

        clearInterval(this.heartBeatTimer);
        this.heartBeatTimer = setInterval(() => {
          const heartBeatMsg = '{"t":"h"}';
          this.logger.debug(`sending message: ${heartBeatMsg}`);
          if (this.socket && this.socket.readyState === this.socket.OPEN) {
            this.socket.send(heartBeatMsg);
          }
        }, WebSocket.heartBeatTimeout);
      }
    };

    this.socket.onmessage = (e) => {
      var result = JSON.parse(e.data.toString());
      this.logger.debug('message received:');
      this.logger.debug(result);

      if (result.t == 'om') {
        this.emit('orderUpdate', result);
        return;
      }

      if (result.t == 'ck') {
        // connection acknowledged
        this.logger.debug('event: connect');

        /**
         * Due to nature of finvasia socket connection, "connect" event can not be emitted immediately
         * A delay is added to check if there is any disconnection happening or not.
         */
        clearTimeout(this.connectTimer);
        this.connectTimer = setTimeout(() => {
          this.emit('connect', e);
        }, 3000);
        return;
      }

      if (result.t == 'ok') {
        this.logger.debug('order update subscription acknowledged');
        return;
      }
    };

    this.socket.onerror = (e) => {
      this.logger.debug('event: error');
      this.emit('error', [e]);

      if (this.socket && this.socket.readyState == this.socket.OPEN) {
        this.socket.close();
      }
    };

    this.socket.onclose = (e) => {
      this.logger.debug('event: close');
      this.emit('close', [e]);

      this.triggerDisconnect();
    };
  }

  subscribeOrderUpdates() {
    this.logger.debug(`subscribing order updates`);
    const msg = {
      t: 'o', // order update subscription task
      actid: this.accountId,
    };
    if (this.socket) {
      const strMsg = JSON.stringify(msg);
      this.logger.debug(`sending message: ${strMsg}`);
      this.socket.send(strMsg);
    }
  }

  disconnect() {
    if (this.socket && this.socket.readyState != this.socket.CLOSING && this.socket.readyState != this.socket.CLOSED) {
      this.socket.close();
    }
  }

  triggerDisconnect() {
    this.socket = undefined;
    this.logger.debug('event: disconnect');
    clearTimeout(this.connectTimer);
    this.emit('disconnect');
  }
}

export default WebSocket;
