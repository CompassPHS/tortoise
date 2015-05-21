# Tortoise

[![Build Status](https://travis-ci.org/CompassPHS/tortoise.svg)](https://travis-ci.org/CompassPHS/tortoise)

    npm install tortoise

A client library for interacting with AMQP. Work in progress.

## Notes

  * The content/body of a message 

## Example

```javascript
var Tortoise = require('tortoise')
  , tortoise = new Tortoise('amqp://localhost');

tortoise
  .queue('my-queue')
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

## Setup

```javascript
var Tortoise = require('tortoise');
var tortoise = new Tortoise('amqp://localhost');
```

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
  .publish('routing-key', { Hello: 'World' });
```

## Subscribing to a queue

```javascript
tortoise
  .queue('my-queue', { durable: false })
  .subscribe(function(msg, ack) {
    // Handle
    ack();
  });
```

```javascript
tortoise
  .queue('my-queue', { durable: false })
  .exchange('my-exchange', 'direct', 'routing-key', { durable: false })
  .subscribe(function(msg, ack) {
    // Handle
    ack();
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
  .subscribe(function(msg, ack) {
    var routingKey = this.fields.routingKey;
    // Handle
    ack();
  });
```

This is useful if you subcribe to wildcard topics on an exchange but wanted to know what the actual topic (`routingKey`) was.