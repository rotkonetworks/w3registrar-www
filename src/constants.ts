export const CHAIN_UPDATE_INTERVAL = 6000

export enum IdentityVerificationStatuses {
  Unknown = -1,
  NoIdentity = 0,
  IdentitySet = 1,
  JudgementRequested = 2,
  FeePaid = 3, // Ready to complete challenges
  IdentityVerified = 4, // Judgement is deemed Reasonable, KnownGood, or any state that denotes approval
}
