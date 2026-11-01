// Utas Pekerja (Web Worker) untuk Logika Berat
import { PricePipeline } from '../logic/pipeline.js';
import { toCents, sub, mul } from '../logic/integer-math.js';

const calcPipeline = new PricePipeline()
    .use(ctx => { ctx.adminFee = mul(ctx.price, ctx.adminRate); return ctx; })
    .use(ctx => { ctx.xtraFee = mul(ctx.price, ctx.xtraRate); return ctx; })
    .use(ctx => { 
        ctx.net = sub(ctx.price, ctx.cogs + ctx.adminFee + ctx.xtraFee); 
        return ctx; 
    });

self.onmessage = (e) => {
    if (e.data.type === 'CALCULATE') {
        const result = calcPipeline.execute(e.data.payload);
        self.postMessage({ type: 'RESULT', payload: result, id: e.data.id });
    }
};
