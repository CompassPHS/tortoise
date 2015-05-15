# Tortoise

[![Build Status](https://travis-ci.org/CompassPHS/tortoise.svg)](https://travis-ci.org/CompassPHS/tortoise)

    npm install tortoise

A client library for interacting with AMQP. Work in progress.

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
