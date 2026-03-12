import process from 'node:process';
import { createPairingSession, printPairingQr } from './pairing.js';

async function main() {
  const port = Number(process.env.PORT || 7345);
  const session = await createPairingSession({ port });

  console.log('OpenCode bridge pairing ready');
  console.log(`- local bridge port: ${port}`);
  console.log(`- public tunnel: ${session.publicUrl}`);
  console.log(`- websocket endpoint: ${session.endpoint}`);
  console.log(`- payload json: ${session.artifacts.jsonPath}`);
  console.log(`- payload html: ${session.artifacts.htmlPath}`);
  console.log(`- pairing store: ${session.artifacts.storePath}`);
  console.log('');
  console.log('QR payload:');
  console.log(JSON.stringify(session.payload, null, 2));
  console.log('');
  console.log('Scan this QR in OpenCode Mobile:');
  printPairingQr(session.payload);
  console.log('');
  console.log('Tunnel will stay open until you stop this process.');

  const close = async () => {
    await session.tunnel.close();
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
