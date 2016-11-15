### [v1.0.1](https://github.com/CompassPHS/tortoise/compare/v1.0.0...v1.0.1) (2016-11-16)

#### Updates

* Removed constraint on only reattempting connection on ECONNREFUSED

#### Updates

* Added optional `.json()` configuration method to subscription.
* Added optional `.reestablish()` configuration method to subscription.

#### Breaking Changes

* Prior to `v1.0.0`, publish and subscribe would automatically serialize/deserialize the messages, assuming they were all objects/JSON. Now the publish is smart and will only serialize if it is an object. Also, `.json()` is required to deserialize messages.
* `connectRetries` option is now defaulted to `-1`.

### [v0.5.1](https://github.com/CompassPHS/tortoise/compare/v0.5.0...v0.5.1) (2016-01-12)

#### Updates

* Changed `amqlib` version back to `^0.4.0`. Oops.

### [v0.5.0](https://github.com/CompassPHS/tortoise/compare/v0.4.0...v0.5.0) (2016-01-12)

#### Updates

* `.subscribe()` promise returns actual channel object, allowing for `close` event to be registered.

#### Breaking Changes

* `connectionPoolCount` option is removed. Tortoise no longer pools connections. This was removed because the need was not warranted.

### [v0.4.0](https://github.com/CompassPHS/tortoise/compare/v0.3.4...v0.4.0) (2016-01-12)

#### Updates

* Added `connectRetries` and `connectRetryInterval` options and functionality

### [v0.3.4](https://github.com/CompassPHS/tortoise/compare/v0.3.3...v0.3.4) (2015-11-23)

#### Updates

* Added `.setup` method to replace `.subscribe` or `.publish` and execute all queue asserts and bindings

### [v0.3.3](https://github.com/CompassPHS/tortoise/compare/v0.3.2...v0.3.3) (2015-11-23)

#### Fixes

* Fixed **close** to actually close... (facepalm)

### [v0.3.2](https://github.com/CompassPHS/tortoise/compare/v0.3.1...v0.3.2) (2015-11-23)

#### Updates

* Changed `.dead` method to allow for optional queue name. Only the name of the exchange is required

### [v0.3.1](https://github.com/CompassPHS/tortoise/compare/v0.3.0...v0.3.1) (2015-11-23)

#### Fixes

* Fixed **close** method on subscribe throwing error

### [v0.3.0](https://github.com/CompassPHS/tortoise/compare/v0.2.0...v0.3.0) (2015-11-17)

#### Updates

* **dependencies**: Updated dependencies

#### Breaking Changes

* Subscribe promise returns object with close method

### [v0.2.0](https://github.com/CompassPHS/tortoise/compare/v0.1.14...v0.2.0) (2015-10-08)

#### Features

* **dead**: Implemented dead letter exchange configuration for a subscription queue.

#### Breaking Changes

* `nack()` arguments were reordered

To migrate, change the following:

````js
nack(0, false);
````

To:

````
nack(false, 0);
````