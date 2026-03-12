import test from 'node:test';
import assert from 'node:assert/strict';
import { BridgeClient } from '../src/rpc';

class FakeWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: FakeWebSocket[] = [];
  readyState = FakeWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((message: { data: string }) => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  emitOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

test('BridgeClient times out unreachable connections', async () => {
  const previous = globalThis.WebSocket;
  // @ts-expect-error test shim
  globalThis.WebSocket = FakeWebSocket;
  const client = new BridgeClient();
  await assert.rejects(() => client.connect('ws://unreachable', 5), /timeout/);
  globalThis.WebSocket = previous;
});

test('BridgeClient emits connection.closed when socket closes', async () => {
  const previous = globalThis.WebSocket;
  // @ts-expect-error test shim
  globalThis.WebSocket = FakeWebSocket;
  const client = new BridgeClient();
  const events: string[] = [];
  client.onEvent((event) => events.push(event.method));
  const connectPromise = client.connect('ws://demo', 50);
  FakeWebSocket.instances.at(-1)?.emitOpen();
  await connectPromise;
  FakeWebSocket.instances.at(-1)?.close();
  assert.deepEqual(events, ['connection.closed']);
  globalThis.WebSocket = previous;
});
