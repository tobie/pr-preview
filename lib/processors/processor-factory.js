"use strict";

class ProcessorFactory {
    static create(type) {
        const normalizedType = type.toLowerCase();

        switch (normalizedType) {
            case 'bikeshed':
                return new (require('./bikeshed-processor'))();
            case 'respec':
                return new (require('./respec-processor'))();
            case 'html':
                return new (require('./html-processor'))();
            case 'wattsi':
                return new (require('./wattsi-processor'))();
            default:
                throw new Error(`Unknown processor type: ${type}`);
        }
    }
}

module.exports = ProcessorFactory;