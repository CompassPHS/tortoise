# Tortoise

    npm install amqplib

A client library for interacting with AMQP. Work in progress.

## Setup

```javascript
var Tortoise = require('tortoise')l
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