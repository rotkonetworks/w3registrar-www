// Data structures
const FEATURES = [
  {
    title: "Platform Verification",
    description: "Prove ownership of your Discord, Twitter, Matrix, and email accounts through automated challenge-response verification."
  },
  {
    title: "Automated Validation",
    description: "Simple challenge-response system confirms your control of declared accounts using one-time verification codes."
  },
  {
    title: "Status Monitoring",
    description: "Track your verification progress with real-time status updates throughout the process."
  },
  {
    title: "On-chain Registration",
    description: "Successfully verified identities are registered directly on-chain, providing transparent proof of ownership."
  }
] as const

const STEPS = [
  {
    title: "Wallet Connection",
    description: "Connect your Polkadot wallet and select the account for verification."
  },
  {
    title: "Identity Declaration",
    description: "Declare the accounts and domains you want to verify as part of your on-chain identity."
  },
  {
    title: "Validation",
    description: "Complete automated challenge-response verification for each declared platform."
  },
  {
    title: "Judgement",
    description: "Receive an on-chain judgement confirming verified ownership of your declared accounts."
  }
] as const

const FAQ_ITEMS = [
  {
    title: "Verification Duration",
    description: "The automated process typically completes within 5 minutes, depending on how quickly you complete the challenges."
  },
  {
    title: "Failed Validations",
    description: "Failed challenges can be reattempted immediately. Contact support for persistent issues."
  },
  {
    title: "On-chain Data",
    description: "All verified identity information is stored publicly on-chain. Only declare accounts you want publicly associated with your address."
  },
  {
    title: "Multiple Accounts",
    description: "Each account requires separate verification. The same external accounts cannot be used across multiple verifications."
  }
] as const

const STATES = [
  {
    title: "Uninitialized",
    description: "No on-chain identity declared. Set your identity information to begin verification."
  },
  {
    title: "Initialized",
    description: "Identity information declared on-chain. Ready to request judgement."
  },
  {
    title: "Pending",
    description: "Judgement requested and awaiting processing."
  },
  {
    title: "Processing",
    description: "Payment confirmed. Challenge-response verification in progress."
  },
  {
    title: "Verified",
    description: "Verification complete. Judgement registered on-chain confirming account ownership."
  }
] as const

export const Overview = () => (
  <section className="max-w-3xl mx-auto px-4 py-4 text-center">
    <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
    <p className="text-lg text-gray-600">
      Verify ownership of your social media accounts and web domains for transparent on-chain 
      identity. Our automated judgement system helps you prove control of your declared accounts, 
      allowing others to verify who they're interacting with on the Polkadot network.
    </p>
  </section>
)

export const StartGuide = () => (
  <section className="max-w-3xl mx-auto px-4 py-3 text-center">
    <p className="text-lg text-gray-600">
      Start the verification process to establish your on-chain identity. The automated system 
      validates your account ownership through simple challenge-response checks.
    </p>
  </section>
)

export const Features = () => (
  <section className="max-w-3xl mx-auto px-4 py-4">
    <h2 className="text-2xl font-bold text-center mb-3">Features</h2>
    <div className="grid gap-3">
      {FEATURES.map(({ title, description }) => (
        <div 
          key={title}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <h3 className="font-semibold text-lg mb-2 text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      ))}
    </div>
  </section>
)

export const Steps = () => (
  <section className="max-w-3xl mx-auto px-4 py-4">
    <h2 className="text-2xl font-bold text-center mb-3">Verification Process</h2>
    <div className="grid gap-3">
      {STEPS.map(({ title, description }, index) => (
        <div 
          key={title}
          className="bg-white rounded-lg shadow-sm p-6 text-center"
        >
          <h3 className="font-semibold text-lg mb-2 text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      ))}
    </div>
  </section>
)

export const FAQ = () => (
  <section className="max-w-3xl mx-auto px-4 py-4">
    <h2 className="text-2xl font-bold text-center mb-3">FAQ</h2>
    <div className="grid gap-3">
      {FAQ_ITEMS.map(({ title, description }) => (
        <div 
          key={title}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="font-semibold text-lg mb-2 text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      ))}
    </div>
  </section>
)

export const States = () => (
  <section className="max-w-3xl mx-auto px-4 py-4">
    <h2 className="text-2xl font-bold text-center mb-3">Verification States</h2>
    <div className="grid gap-3">
      {STATES.map(({ title, description }, index) => (
        <div 
          key={title}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="font-semibold text-lg mb-2 text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      ))}
    </div>
  </section>
)

// Main container component
export const IdentityVerification = () => (
  <div className="min-h-screen bg-gray-50">
    <Overview />
    <StartGuide />
    <Features />
    <Steps />
    <States />
    <FAQ />
  </div>
)
