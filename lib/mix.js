"use strict";

class MixinBuilder {  
    constructor(superclass) {
        this.superclass = superclass || class DefaultMixinClass {};
    }
    
    with(...mixins) {
        if (this.superclass) {
            return mixins.reduce((c, mixin) => mixin(c), this.superclass);
        }
    }
}

module.exports = (superclass) => new MixinBuilder(superclass);