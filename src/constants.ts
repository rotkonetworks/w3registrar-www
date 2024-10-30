export const CHAIN_UPDATE_INTERVAL = 6000

export const IDENTITY_VERIFICATION_STATE = {
  Unknown: -1,
  NoIdentity: 0,
  IdentitySet: 1,
  JudgementRequested: 2,
  FeePaid: 3, // Ready to complete challenges
  IdentityVerifid: 4, // Judgement is deemed Reasonable, KnownGood, or any state that denotes approval
}
