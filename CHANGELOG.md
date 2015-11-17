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