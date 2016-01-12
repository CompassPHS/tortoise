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