import assert from 'node:assert/strict';

class FakeWorker {
  constructor(url, options) { this.url=url; this.options=options; this.terminated=false; FakeWorker.last=this; }
  postMessage(message) { this.lastMessage=message; queueMicrotask(()=>this.onmessage?.({data:message.type==='test-error'?{id:message.id,ok:false,error:'invalid fixture'}:{id:message.id,ok:true,result:{echo:message.payload}}})); }
  terminate() { this.terminated=true; }
}
globalThis.Worker=FakeWorker;
const {compute}=await import('../js/worker-client.js');
const result=await compute('test',{value:42});
assert.deepEqual(result,{echo:{value:42}});
assert.equal(FakeWorker.last.lastMessage.type,'test');
assert.equal(FakeWorker.last.options.type,'module');
const failed=compute('test-error',{});
await assert.rejects(failed,/invalid fixture/);
console.log('Worker client tests: 5 assertions passed');
