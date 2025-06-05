// src/components/tabs/challenges/PGPVerification.tsx
import { Fingerprint, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import { Alert } from '../ui/alert';
import { Input } from '../ui/input';

interface PGPVerificationProps {
  challenge: string;
  onVerify: (pubkey: string, signedChallenge: string) => void;
  isVerifying: boolean;
}

export function PGPVerification({ challenge, onVerify, isVerifying }: PGPVerificationProps) {
  const [pubkey, setPubkey] = useState('');
  const [signedChallenge, setSignedChallenge] = useState('');
  const [copied, setCopied] = useState(false);

  const copyChallenge = async () => {
    await navigator.clipboard.writeText(challenge);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          PGP Verification
        </CardTitle>
        <CardDescription>
          Sign the challenge with your PGP key to verify ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Challenge to sign:</p>
          <div className="flex gap-2">
            <Input value={challenge} className="flex-1 font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={copyChallenge}>
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signature" className="text-sm font-medium">
            Signed Challenge
          </label>
          <Textarea
            id="signature"
            placeholder={[
              "----- BEGIN PGP SIGNED MESSAGE-----",
              "Hash: SHA512",
              "",
              `CHALLENGE: ABC123`,
              "-----BEGIN PGP SIGNATURE-----",
              "AAAAAAAABBBBCCCCDDDD...",
            ].join('\n')}
            value={signedChallenge}
            onChange={(e) => setSignedChallenge(e.target.value)}
            rows={8}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="pubkey" className="text-sm font-medium">
            Your PGP Public Key
          </label>
          <Textarea
            id="pubkey"
            placeholder={[
              "-----BEGIN PGP PUBLIC KEY BLOCK-----",
              "abcdefghijklmnopqrstuvwxyz1234567890...",
              "-----END PGP PUBLIC KEY BLOCK-----",
            ].join('\n')}
            value={pubkey}
            onChange={(e) => setPubkey(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
        </div>

        <Alert className="bg-muted p-3 rounded text-sm">
          <p className="font-medium mb-1">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copy the challenge above</li>
            <li>Sign it using your PGP key:
              {" "}<code className='bg-muted'>echo &quot;CHALLENGE&quot; | gpg --clearsign</code>. 
              Then, paste into <i>Signed Challenge</i> field.
            </li>
            <li>
              Grab your PGP public key:
              {" "}<code className='bg-muted'>gpg --armor --export you@example.com</code>
              {" "}and paste it into the <i>Your PGP Public Key</i> field.
            </li>
          </ol>
        </Alert>

        <Button variant='primary'
          onClick={() => onVerify(pubkey, signedChallenge)}
          disabled={!pubkey || !signedChallenge || isVerifying}
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify PGP Key'}
        </Button>
      </CardContent>
    </Card>
  );
}
