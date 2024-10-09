import { WsProvider, ApiPromise } from "@polkadot/api"
import { startFromWorker } from "polkadot-api/smoldot/from-worker";
 
// Using vite
import SmWorker from "polkadot-api/smoldot/worker?worker";
const worker = new SmWorker();

const RPC_ENDPOINT = "ws://127.0.0.1:42539";
const wsProvider = new WsProvider(RPC_ENDPOINT);
const api = await ApiPromise.create({ provider: wsProvider });

// Do something
console.log(api.genesisHash.toHex());
const aliceAccount = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
console.log(await api.query.system.account(aliceAccount));
console.log((await api.query.system.account(aliceAccount)).data);
console.log((await api.query.system.account(aliceAccount)).data.free);
console.log((await api.query.system.account(aliceAccount)).data.free.toNumber());
//console.log(await api.query.system.account(aliceAccount.balance.toNumber()));
