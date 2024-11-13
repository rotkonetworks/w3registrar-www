import { useTypedApi } from '@reactive-dot/react';
import { Binary } from 'polkadot-api';
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { config } from '~/api/config';
import { appState } from '~/App';
import { CHAIN_UPDATE_INTERVAL, IdentityVerificationStatuses } from '~/constants';
import { useIdentityEncoder } from '~/hooks/hashers/identity';

type FieldKey = 'display' | 'matrix' | 'email' | 'discord' | 'twitter';

type Identity = {
  [K in FieldKey]: string;
};

type FieldError = {
  [K in FieldKey]?: string;
};

const FIELD_CONFIG: Record<FieldKey, { label: string; placeholder: string; validate: (value: string) => string | null }> = {
  display: {
    label: 'Display Name',
    placeholder: 'Alice',
    validate: (v) => v.length > 0 && v.length < 3 ? "At least 3 characters" : null,
  },
  matrix: {
    label: 'Matrix',
    placeholder: '@alice:matrix.org',
    validate: (v) => v.length > 0 && !/@[a-zA-Z0-9._=-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(v) ? "Invalid format" : null,
  },
  email: {
    label: 'Email',
    placeholder: 'alice@example.org',
    validate: (v) => v.length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) ? "Invalid format" : null,
  },
  discord: {
    label: 'Discord',
    placeholder: 'alice#1234',
    validate: (v) => v.length > 0 && !/^[a-zA-Z0-9_]{2,32}#\d{4}$/.test(v) ? "Invalid format" : null,
  },
  twitter: {
    label: 'Twitter',
    placeholder: '@alice',
    validate: (v) => v.length > 0 && !/^@?(\w){1,15}$/.test(v) ? "Invalid format" : null,
  },
};
const ALL_IDENTITY_REQUIRED_FIELDS = [
  "discord",
  "display",
  "email",
  "github",
  "image",
  "legal",
  "matrix",
  "twitter",
  "web",
]

// Re-export IdentityFormFields if it's still needed elsewhere
export const IdentityFormFields: FieldKey[] = Object.keys(FIELD_CONFIG) as FieldKey[];

interface Props {
  handleProceed: () => void;
}

const IdentityForm: React.FC = ({ handleProceed }: Props) => {
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { identity: appStateIdentity } = useSnapshot(appState);

  const validateForm = useCallback(() => {
    if (!formRef.current) return { isValid: false, errors: {} };

    const formData = new FormData(formRef.current);
    const identity: Partial<Identity> = {};
    const errors: FieldError = {};
    let isValid = false;

    IdentityFormFields.forEach((key) => {
      const value = formData.get(key) as string;
      identity[key] = value;
      const error = FIELD_CONFIG[key].validate(value);
      if (error) errors[key] = error;
      if (value.length > 0) isValid = true;
    });

    isValid = isValid && Object.keys(errors).length === 0;
    return { isValid, errors, identity };
  }, []);

  const handleInput = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const { isValid, errors, identity } = validateForm();
      if (isValid) {
        appState.identity = identity as Identity;
      }
      formRef.current?.querySelector('button[type="submit"]')?.toggleAttribute('disabled', !isValid);
      IdentityFormFields.forEach((key) => {
        const errorElement = formRef.current?.querySelector(`[data-error="${key}"]`);
        if (errorElement) {
          errorElement.textContent = errors[key] || '';
        }
      });
    }, 300);
  }, [validateForm]);

  const appStateSnap = useSnapshot(appState)
  const typedApi = useTypedApi({ chainId: appStateSnap.chain.id });

  useEffect(() => {
    if (appState.account && import.meta.env.DEV) {
      console.log({ 
        account: appStateSnap.account,
        signer: appStateSnap.account.polkadotSigner,
      })
    }
  }, [appState.account])

  const getSubmitData = useCallback(
    // TODO Review so it gets all the fiends that are present and sets default values othervise
    () => appStateSnap.identity && ({
      info: {
        ...Object.entries(FIELD_CONFIG).reduce((all, [key]) => {
          const value = appStateSnap.identity[key];
          all[key] = {
            type: `Raw${value.length}`,
            value: Binary.fromText(value),
          };
          return all;
        }, {}),
        ...ALL_IDENTITY_REQUIRED_FIELDS.filter(key => !Object.keys(appState.identity).includes(key))
          // TODO If other ID valiues are sett, maybe we shoulld keep thim?
          .reduce((all, key) => {
            all[key] = {
              type: "None",
            }
            return all
          }, {})
        ,
      }
    }), 
    [appStateSnap.identity]
  )
  useEffect(() => { 
    if (import.meta.env.DEV) {
      console.log({ getSubmitData: getSubmitData() }) 
    }
  }, [getSubmitData])

  const { calculateHash } = useIdentityEncoder(appStateSnap.identity)
  const hashesAreEqual = useMemo(() => {
    if (appStateSnap.hashes?.identity && appStateSnap.identity) {
      const foundUnequalByte = calculateHash().find((byte, index) => byte !== appStateSnap.hashes.identity[index]) === undefined;
      import.meta.env.DEV && console.log({ hashesAreEqual: foundUnequalByte })
      return foundUnequalByte
    }
    import.meta.env.DEV && console.log({ hashesAreEqual: null, hashes: {...appStateSnap.hashes} })
  }, [appStateSnap.hashes?.identity, appStateSnap.identity, appStateSnap.chain.id])
  
  const chainCall = useMemo(() => {
    const data = getSubmitData();
    const judgementRequestData = {
      max_fee: 0n,
      reg_index: config.chains[appStateSnap.chain.id].registrarIndex,
    };

    let call;
    if (!hashesAreEqual) {
      call = typedApi.tx.Utility.batch_all({calls: [
        {
          type: "Identity", 
          value: {
            type: "set_identity",
            value: data,
          },
        },
        {
          type: "Identity",
          value: {
            type: "request_judgement", 
            value: judgementRequestData,
          },
        },
      ]});
    } else {
      call = typedApi.tx.Identity.request_judgement(judgementRequestData);
    }
    return call
  }, [validateForm, appStateSnap.identity, appState.chain.id])

  const timer = useRef()
  useEffect(() => {
    if (!appState.account) {
      return
    }
    timer.curreut = setInterval(async () => {
      try {
        const callCost = await chainCall.getEstimatedFees(appState.account.address);
        const estimatedFees = {...appState.fees};
        if (appStateSnap.verificationProgress < IdentityVerificationStatuses.FeePaid) {
          if (hashesAreEqual) {
            estimatedFees.requestJdgement = callCost;
            estimatedFees.setIdentityAndRequestJudgement = 0n;
          } else {
            estimatedFees.requestJdgement = 0n;
            estimatedFees.setIdentityAndRequestJudgement = callCost;
          }        
        }
        appState.fees = estimatedFees;

        import.meta.env.DEV && console.log({ estimatedFees });
      } catch (error) {
        const errorToSuppress = "Cannot read properties of undefined (reading 'info')";
        // Happens when account has no identity, so we suppress it so it won't pollute console.
        if (error.message === errorToSuppress)
          return
        import.meta.env.DEV && console.error(error);
      }
    }, CHAIN_UPDATE_INTERVAL)
    return () => {
      clearInterval(timer.current)
    }
  }, [hashesAreEqual, appStateSnap.chain.id])

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (appStateSnap.verificationProgress >= IdentityVerificationStatuses.JudgementRequested) {
      handleProceed();
      return;
    }
    const { isValid, identity } = validateForm();
    if (import.meta.env.DEV) {
      console.log({ isValid, identity })
    }
    if (isValid) {
      (async () => {
        const call = chainCall;
        
        const resultObservable = call.signSubmitAndWatch(appStateSnap.account?.polkadotSigner)
        const resultObserver = {
          next(data) {
            import.meta.env.DEV && console.log({data, source: "observer",})
          },
          error(error) {
            import.meta.env.DEV && console.error(error)
          },
          complete() {
            import.meta.env.DEV && console.log("request complete")
          }
        }
        
        resultObservable.subscribe(resultObserver)
      })()
    }
  }, [validateForm, appStateSnap.identity]);

  useEffect(() => {
    if (appStateIdentity && formRef.current) {
      Object.entries(appStateIdentity).forEach(([key, value]) => {
        const input = formRef.current?.querySelector(`input[name="${key}"]`) as HTMLInputElement;
        if (input) input.value = value;
      });
      handleInput();
    }
  }, [appStateIdentity, handleInput]);

  const actionMessage = appStateIdentity ? "Update your identity" : "Create your identity";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h2 className="text-xl font-bold mb-4 text-stone-800">Identity</h2>
      <p className="text-sm text-stone-600 mb-4">{actionMessage}</p>
      {IdentityFormFields.map((key) => (
        <div key={key} className="flex flex-col">
          <label htmlFor={key} className="text-sm text-stone-600 mb-1">{FIELD_CONFIG[key].label}</label>
          <input
            id={key}
            name={key}
            type="text"
            placeholder={FIELD_CONFIG[key].placeholder}
            className="border-b border-stone-400 px-0 py-2 text-sm text-stone-800 focus:outline-none focus:border-stone-600 placeholder-stone-400"
            onInput={handleInput}
          />
          <p data-error={key} className="text-red-700 text-sm h-5"></p>
        </div>
      ))}
      <button
        type="submit"
        className="mt-6 w-full bg-stone-700 hover:bg-stone-800 text-white py-2 px-4 text-sm font-semibold transition duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed rounded border-none outline-none"
        onClick={e => handleSubmit(e)}
      >
        {appStateSnap.verificationProgress < IdentityVerificationStatuses.JudgementRequested
          ? (hashesAreEqual
            ? <>Request Judgement</>
            : <>Set Identity & Request Judgement</>
          )
          : <>Next</>
        }
      </button>
    </form>
  );
};

export default IdentityForm;
