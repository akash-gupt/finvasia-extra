# Finvasia Shoonya API Nodejs client

## Installation

Install via [npm](https://www.npmjs.com/package/finvasia-extra)

```
npm install finvasia-extra
```

## Getting started

```js
const { RestAPI } = require('finvasia-extra');

const api = new RestAPI({ userId: 'user_id' });

api
  .login('user_id', 'password', 'factor2', 'vendor_code', 'api_key', 'imei')
  .then(console.log)
  .then((data) => {
    console.log(data.susertoken);
    // OR
    console.log(api.accessToken);

    // fetch order book
    return api.getOrders();
  })
  .then((orders) => {
    console.log(orders);
  })
  .catch((err) => {
    console.log(err);
  });
```

If you have already generated access token then

```js
const api = new RestAPI({
  userId: 'user_id',
  accessToken: 'access_token',
});

api
  .getOrders()
  .then((orders) => {
    console.log(orders);
  })
  .catch((err) => {
    console.log(err);
  });
```

Getting started with WebSocket API

```js
const { WebSocket } = require('finvasia-extra');

const socket = new WebSocket({
  userId: 'user_id',
  accessToken: 'access_token',
});

socket.on('connect', () => {
  console.log('Connected');
  socket.subscribeOrderUpdates();
});

socket.on('orderUpdate', (update) => {
  console.log('Order Update', update);
});

socket.on('error', (e) => {
  console.log('Error', e);
});

socket.on('close', () => {
  console.log('Closed');
});

socket.connect();
```


