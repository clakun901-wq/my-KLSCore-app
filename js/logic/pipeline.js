// Modul Chain of Responsibility (Pipeline Pattern)
export class PricePipeline {
    constructor() {
        this.handlers = [];
    }
    use(handler) {
        this.handlers.push(handler);
        return this;
    }
    execute(context) {
        return this.handlers.reduce((ctx, handler) => handler(ctx), context);
    }
}
