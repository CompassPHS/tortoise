# Tortoise

[![NPM](https://nodei.co/npm/tortoise.png?downloads=true&downloadRank=true)](https://nodei.co/npm/tortoise/)

[![Build Status](https://travis-ci.org/CompassPHS/tortoise.svg)](https://travis-ci.org/CompassPHS/tortoise)
[![Coverage Status](https://coveralls.io/repos/CompassPHS/tortoise/badge.svg)](https://coveralls.io/r/CompassPHS/tortoise)
[![Dependencies](https://david-dm.org/compassphs/tortoise.svg)](https://david-dm.org/compassphs/tortoise)

    npm install tortoise

A client library for interacting with AMQP. Work in progress.

## Notes

  * The content/body of a message is expected to be an object literal (without functions) and will be serialized/deserialized by the library

## Basic Example

```javascript
var Tortoise = require('tortoise')
  , tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('my-queue')
  .prefetch(1)
  .subscribe(function(msg, ack) {
    console.log(msg);
    ack();
  });

setInterval(function() {
  tortoise
    .queue('my-queue')
    .publish({ Hello: 'World' });
}, 1000);
```

## Basic Setup

```javascript
var Tortoise = require('tortoise');
var tortoise = new Tortoise('amqp://localhost');
```

## Advanced Setup

```javascript
var Tortoise = require('tortoise');
var options = { connectionPoolCount: 5 }
var tortoise = new Tortoise('amqp://localhost', options);
```

`options` is optional. Current options are:

  * `connectionPoolCount`: `Number` value greater than `0`. Defaults to `1`. Tortoise will round robin between provided number of connections when creating channels.

## Publishing to a queue

```javascript
tortoise
  .queue('my-queue', { durable:false })
  .publish({ Hello: 'World' });
```

## Publishing to an exchange

```javascript
tortoise
  .exchange('my-exchange', 'direct', { durable:false })
  .publish('routing.key', { Hello: 'World' });
```

## Subscribing to a queue

```javascript
tortoise
  .queue('my-queue', { durable: false })
  .prefetch(1)
  .subscribe(function(msg, ack, nack) {
    // Handle
    ack(); // or nack();
  });
```

```javascript
tortoise
  .queue('my-queue', { durable: false })
  // Add as many bindings as needed
  .exchange('my-exchange', 'direct', 'routing.key', { durable: false })
  .prefetch(1)
  .subscribe(function(msg, ack, nack) {
    // Handle
    ack(); // or nack();
  });
```

## Accessing message data

The callback function provided to the `subscribe` method will be scoped to the message, i.e. the `this` object will contain the properties of the message. The object would look similar to this:

```javascript
{
  fields: {
    deliveryTag: <int>,
    redelivered: <bool>,
    routingKey: <string>,
    ...
  },
  properties: {
    contentType: <string>,
    headers: {
      ...
    },
    ...
  }
}
```

So, if I wanted to access the `routingKey` that was provided, I would access it by:

```javascript
tortoise
  .queue('my-queue', { durable: false })
  .exchange('my-exchange', 'topic', 'event.*', { durable: false })
  .subscribe(function(msg, ack, nack) {
    var routingKey = this.fields.routingKey;
    // Handle
    ack(); // or nack();
  });
```

This is useful if you subcribe to wildcard topics on an exchange but wanted to know what the actual topic (`routingKey`) was.

## Auto retrying and throttling

There are a few methods available for controlling continuous failures, all are optional. `failSpan` and `retryTimeout` do nothing if `failThreshold` is not set

default behavior (not setting) of `failThreshold` is no failure handling

```javascript
var Tortoise = require('tortoise')
  , tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('simple-queue', { durable: true })
  .failThreshold(3) // 3 immediate attempts
  .failSpan(1000 * 60 * 10) // 10 minutes, defaults to 1 minute
  .retryTimeout(1000 * 10) // 10 second timeout on each retry, defaults to 5 seconds
  .subscribe(function(msg, ack, nack) {
    console.log(msg);
    nack();
  });
```

## Automatic setup of dead letter exchange and queue

If you wanted to setup your (subscribe) queue to automatically set a dead letter exchange:

```javascript
var Tortoise = require('tortoise')
  , tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('simple-queue')
  .dead('exchange.dead', 'queue.dead')
  .subscribe(function(msg, ack, nack) {
    // Do not requeue, instead shove to dead letter exchange
    nack(false);
  });
```