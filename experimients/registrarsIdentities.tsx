import { ApiPromise, WsProvider } from "@polkadot/api";

export const getProviders = () => {
  const wsProvider = new WsProvider(process.argv[2]);
  return {
    wsProvider,
  };
};

const log = (msg: object) => console.log(JSON.stringify(msg, null, 2));

const main = async () => {
  const providers = getProviders();
  const api = await ApiPromise.create({ provider: providers.wsProvider });

  const registrars = (await api.query.identity.registrars()).toJSON();
  log({ registrars });

  await Promise.all(registrars.map(async (registrar) => {
    return {
      registrar,
      identity: (await api.query.identity.identityOf(registrar.account)).toJSON(),
    };
  }))
    .then((identities) => {
      const _identities = identities.map(({ registrar, identity }, i) => {
        return {
          registrar: { ...registrar, index: i },
          judgements: identity?.[0]?.judgements,
          deposit: identity?.[0]?.deposit,
          info: identity?.[0]?.info
            ? (Object.entries(identity[0].info)
              .reduce((acc, [key, value]) => {
                if (value === null || (value && "none" in value)) {
                  acc[key] = null;
                } else if ("raw" in value) {
                  acc[key] = Buffer.from(value.raw.slice(2), "hex").toString();
                } else {
                  acc[key] = value;
                }
                return acc;
              }, {})
            )
            : null,
        };
      });
      //log({ identities })
      log(_identities)
    })
  ;
};

main().then(() => {}).catch(console.error).finally(() => process.exit(0));
