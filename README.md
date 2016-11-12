# Tortoise

[![NPM](https://nodei.co/npm/tortoise.png?downloads=true&downloadRank=true)](https://nodei.co/npm/tortoise/)

[![Build Status](https://img.shields.io/travis/CompassPHS/tortoise/master.svg?style=flat-square)](https://travis-ci.org/CompassPHS/tortoise)
[![Coverage Status](https://img.shields.io/coveralls/CompassPHS/tortoise/master.svg?style=flat-square)](https://coveralls.io/r/CompassPHS/tortoise)
[![Dependencies](https://img.shields.io/david/CompassPHS/tortoise/master.svg?style=flat-square)](https://david-dm.org/compassphs/tortoise)

    npm install tortoise

A client library for interacting with AMQP.

- [Basic Example](#basic-example)
- [Basic Setup](#basic-setup)
- [Advanced Setup](#advanced-setup)
- [Publishing to a queue](#publishing-to-a-queue)
- [Publishing to an exchange](#publishing-to-an-exchange)
- [Subscribing to a queue](#subscribing-to-a-queue)
- [Accessing message data](#accessing-message-data)
- [Handling Errors and Events](#handling-errors-and-events)
- [Auto retrying and throttling](#auto-retrying-and-throttling)
- [Automatic setup of dead letter exchange and queue](#automatic-setup-of-dead-letter-exchange-and-queue)
- [Configuring without the need to subscribe or publish](#configuring-without-the-need-to-subscribe-or-publish)
- [Handling connection or channel closure](#handling-connection-or-channel-closure)

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
var options = {
  connectRetries: -1,
  connectRetryInterval: 1000
};
var tortoise = new Tortoise('amqp://localhost', options);
```

`options` is optional. Current options are:

  * `connectRetries`: `Number` value greater than or equal to `-1`. Defaults to `-1`. Tortoise will attempt to connect up to this number. When set to `-1`, tortoise will attempt to connect forever. Note: This does not handle connections that have already been established and were lost see [Handling connection or channel closure](#handling-connection-or-channel-closure) for more information on that.
  * `connectRetryInterval`: `Number` value greater than or equal to `0`. Defaults to `1000`. This is the amount of time, in `ms`, that tortoise will wait before attempting to connect again.


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

##### Automatically parsing JSON
There is an optional function setting that will automatically attempt to parse messages from JSON (using `JSON.parse`) and if invalid, will `nack(requeue=false)` the message. To capture this event each time it occurs, you can subscribe to your tortoise instance for event `Tortoise.EVENTS.PARSEERROR`:
```javascript
var Tortoise = require('tortoise');
var tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('my-queue', { durable: false })
  .prefetch(1)
  .json()
  .subscribe(function(msg, ack, nack) {
    // Will be called if the msg content is valid JSON and can be parsed
    ack(); // or nack();
  });
  
 tortoise.on(Tortoise.EVENTS.PARSEERROR, function(err, msg) {
    // err is the error
    // msg is the message object returned from AMQP.
    // msg.content is the Buffer of the message
    console.log('An error occurred parsing the msg content');
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

## Handling Errors and Events

Tortoise will emit events when certain things occur. The following events are emitted:
```javascript
{
    PARSEERROR: 'TORTOISE.PARSEERROR',
    CONNECTIONCLOSED: 'TORTOISE.CONNECTIONCLOSED',
    CONNECTIONDISCONNECTED: 'TORTOISE.CONNECTIONDISCONNECTED'
}
```

These event strings are accessed by the `EVENTS` property on the `Tortoise` library, and can be subscribed to on an individual tortoise instance. Here is an example of being notified when a parse error occurred:

```javascript
var Tortoise = require('tortoise');
var tortoise = new Tortoise('amqp://localhost');
// Do your tortoise configuration

tortoise.on(Tortoise.EVENTS.PARSEERROR, function() {
    // Called on parse error
});
```

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

Declaring the queue to bind to the exchange is optional. It is perfectly acceptable to setup like this:
```javascript
var Tortoise = require('tortoise')
  , tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('simple-queue')
  .dead('exchange.dead')
  .subscribe(function(msg, ack, nack) {
    // Do not requeue, instead shove to dead letter exchange
    nack(false);
  });
```

## Configuring without the need to subscribe or publish

The `.setup` method will call all asserts and bindings then close the channel

```javascript
tortoise
  .queue('myQueue')
  .exchange('myExchange', 'topic', '#')
  .dead('myDeadExchange')
  .setup();

tortoise
  .exchange('myExchange', 'topic')
  .setup();
```

## Handling connection or channel closure

##### Automatic Method

There exists a helper method, `.reestablish()`, to re-establish connections that were lost (when subscribing). It will attempt re-establish the connection and, when successful, will be configured with the same settings as before (queue, exchanges, etc). One caveat with this method is the `.then()` resolution from the `.subscribe()` method will no longer function after the connection is lost. In most cases that is not a problem.

It should be noted that this will begin consuming the `connectRetries` limit. See [Advanced Setup](#advanced-setup) for more information.

Here is an example:
```javascript
var Tortoise = require('tortoise');
var tortoise = new Tortoise('amqp://localhost', { connectRetries: -1 });

tortoise
  .queue('myQueue')
  .reestablish()
  .subscribe(function(msg, ack, nack) {
    console.log('message received', msg);
    ack();
  })
  .then(function(ch) {
    // This will only be called once the original channel closes, not for any new channels created
    ch.on('close', function() {
      console.log('channel closed');
    });
  });
```

If you would still like to know (for logging, etc) when a connection is closed, see the [Handling Errors and Events](#handling-errors-and-events) section for subscribing to connection events.

##### Manual Method

When subscribing, the promise returned from `.subscribe()` resolves with a channel object that can be listened on. 

The following is an example of listening for `close` events and resubscribing.

```javascript
// Wrap subscription inside function
var subscribe = function() {
  tortoise
    .queue('myQueue')
    .subscribe(function(msg, ack, nack) {
      ack();
    })
    .then(function(ch) {
      // Once connection is closed, immediately attempt to subscribe again
      ch.on('close', subscribe);
    })
}

// Start subscribing
subscribe();
```
