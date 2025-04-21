export const errorMessages = {
  "balances": {
    default: "Error with balances pallet",
    InsufficientBalance: "Insufficient balance",
    DepositFailure: "Failed to deposit funds"
  },
  "identity": {
    default: "Error with identity pallet",
    BadOrigin: "Bad origin – the call’s origin is not authorized",
    NotIdentityOwner: "You are not the owner of this identity",
    AlreadyRequested: "Judgement request already exists",
    InsufficientDeposit: "Insufficient deposit for identity operation",
    CallFiltered: "Call filtered or unprivileged"
  },
  "xcm": {
    default: "Error with XCM message",
    Unreachable: "Destination unreachable",
    ProcessingFailed: "Message processing failed",
    WeightLimitExceeded: "Provided weight is insufficient for execution",
    AssetNotFound: "Asset not recognized or trapped"
  },
  "Invalid": {
    default: "Invalid transaction",
    Payment: "Insufficient free balance",
  }
};
