
export const GeneralDescription = () => <>
  <h1 className="text-2xl font-bold">General Description</h1>
  <p>
    W3 Registrar makes it easy for you to get verified on Polikadot blockchain. Our system helps you
    prove your identity across multiple social media, messaging services and your Web conten, 
    ensuring a smooth and secure registration process.
  </p>
</>
export const CallToActionMessage = () => <>
  <p>
    W3 Registrar is designed with you in mind, reducing hassle and ensuring your identity is 
    recognized across the blockchain community. Let's get started on your journey to verified 
    status!
  </p>
</>

export const WhatYouGet = () => <>
  <h1 className="text-2xl font-bold">What You Get:</h1>
  <ul className="list-disc pl-6 space-y-4">
    <li>
      <strong>Easy Multi-Platform Verification</strong>:
      Verify your identity through Discord, Twitter, Matrix, email, and more.
    </li>
    <li>
      <strong>Simple Challenge-Response Process</strong>:
      Submit unique challenge codes to confirm your identity automatically.
    </li>
    <li>
      <strong>Instant Status Updates</strong>:
      Stay informed with real-time notifications as your verification progresses.
    </li>
    <li>
      <strong>Seamless Blockchain Integration</strong>:
      Once verified, your identity is securely registered with a single click.
    </li>
    <li>
      <strong>Top-Notch Security</strong>:
      Your data is protected with secure storage, keeping your information safe.
    </li>
  </ul>
</>

export const HowItWorks = () => <>
  <h1 className="text-2xl font-bold">How It Works:</h1>
  <ol className="list-decimal pl-6 space-y-4">
    <li>
      <strong>Connect Your Wallet</strong>:
      Connect your wallet and select the account you want to verify.
    </li>
    <li>
      <strong>Enter Information</strong>:
      Provide your identity information to begin the verification process.
    </li>
    <li>
      <strong>Complete Challenges</strong>:
      Submit challenge codes to verify your identity across multiple platforms.
    </li>
    <li>
      <strong>Get Verified</strong>:
      Once all challenges are complete, your identity is verified on the blockchain.
    </li>
    <li>
      <strong>Enjoy Benefits</strong>:
      With your verified status, you can access exclusive features and benefits.
    </li>
  </ol>
</>

export const Faq = () => <>
  <h1 className="text-2xl font-bold">Frequently Asked Questions:</h1>
  <ul className="list-disc pl-6 space-y-4">
    <li>
      <strong>How long does the verification process take?</strong>:
      It can take up to five minutes, depending on how fast you can completethe challenges.
    </li>
    <li>
      <strong>What happens if I fail a challenge?</strong>:
      If you fail a challenge, you can retry it or contact support for assistance.
    </li>
    <li>
      <strong>Is my data secure?</strong>:
      Yes, your data is encrypted and stored securely, ensuring your privacy is protected.
    </li>
    <li>
      <strong>Can I verify multiple accounts?</strong>:
      Yes, you can verify multiple accounts using the same process for each one.
    </li>
    <li>
      <strong>What if I lose access to my wallet?</strong>:
      If you lose access to your wallet, you can recover it using your recovery phrase.
    </li>
  </ul>
</>

export const VerificationStatesOverview = () => <>
  <h1 className="text-2xl font-bold">Verification States:</h1>
  <ul className="list-disc pl-6 space-y-4">
    <li>
      <strong>No Identity</strong>: 
      No identity information set on your account. Set up your on-chain identity to begin verification.
    </li>
    <li>
      <strong>Identity Set</strong>: 
      Identity information successfully set on-chain. Ready to request verification from registrar.
    </li>
    <li>
      <strong>Judgement Requested</strong>: 
      Verification request submitted successfully. Awaiting processing of your request.
    </li>
    <li>
      <strong>Fee Paid</strong>: 
      Payment successfully processed. Ready to begin verification challenges.
    </li>
    <li>
      <strong>Identity Verified</strong>: 
      Identity verification complete. Your account is now verified on-chain.
    </li>
  </ul>
</>
