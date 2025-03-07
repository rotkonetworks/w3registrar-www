import { ApiPromise, WsProvider } from "@polkadot/api";


const log = (msg: object) => console.log(JSON.stringify(msg, null, 2));

const main = async () => {
  const relayEndpoint = process.argv[2] || "wss://rpc.ibp.network/paseo";
  const paraEndpoint = process.argv[3] || "wss://sys.ibp.network/people-paseo";
  log({ relayEndpoint, paraEndpoint });

  // TODO use yargs to parse the arguments
  const relayProvider = new WsProvider(relayEndpoint);
  const paraProvider = new WsProvider(paraEndpoint);

  const relayApi = await ApiPromise.create({ provider: relayProvider });
  const paraApi = await ApiPromise.create({ provider: paraProvider });

  //const paraId = await paraApi.consts.parachainInfo.parachainId.toNumber();
  const paraId = 1004;
  log({ paraId });

  const xcmDestination = {
    V4: {
      parents: 0,
      interior: {
        X1: [{
          Parachain: paraId
        }]
      }
    }
  };
  const setIdentityCall = paraApi.tx.identity.setIdentity({
    info: {
      display: "Alice in Wonderlands",
    }
  })

  const setIdentityCallHex = setIdentityCall.toHex();
  log({ setIdentityCallHex })

  const xcmTransactionPayload = {
    V4: [
      {
        WithdrawAsset: [
          {
            id: {
              parents: 0,
              interior: {
                Here: null
              }
            },
            fun: {
              Fungible: 50000000000n
            }
          }
        ]
      },
      {
        BuyExecution: {
          fees: {
            id: {
              parents: 0,
              interior: {
                Here: null
              }
            },
            fun: {
              Fungible: 25000000000n
            }
          },
          weight_limit: {
            Unlimited: null
          }
        }
      },
      {
        Transact: {
          originKind: "Xcm",
          requireWeightAtMost: {
            ref_time: 5000000000n,
            proof_size: 50000n
          },
          call: { encoded: setIdentityCallHex }
        }
      }
    ]
  };
  const xcmCsll = relayApi.tx.xcmPallet.send(xcmDestination, xcmTransactionPayload)
  log({ xcmCsll })
}

main().catch(console.error)
