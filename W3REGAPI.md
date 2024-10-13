# W3 Registrar API

This README provides instructions on how to interact with the W3 Registrar WebSocket API using `websocat`.

## Prerequisites

- Install `websocat`: You can install it using cargo with `cargo install websocat` or download it from the [official repository](https://github.com/vi/websocat).

## Connecting to the WebSocket Server

To connect to the WebSocket server, use the following command:

```bash
websocat ws://localhost:8081
```

Replace `localhost:8081` with the appropriate host and port if different.

## API Commands

All commands should be sent as JSON objects with a `version` field and a `type` field. The current API version is "1.0".

### Subscribe to Account State

To subscribe to an account's state:

```json
{"version":"1.0","type":"SubscribeAccountState","payload":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"}
```

Expected response:

```json
{
  "version": "1.0",
  "type": "JsonResult",
  "payload": {
    "type": "ok",
    "message": {
      "account": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "info": {
        "display": { "Raw": [72, 101, 108, 108, 111] },
        "legal": { "Raw": [] },
        "web": { "Raw": [] },
        "riot": { "Raw": [] },
        "email": { "Raw": [] },
        "pgp_fingerprint": null,
        "image": { "Raw": [] },
        "twitter": { "Raw": [] }
      },
      "judgements": [],
      "verification_state": {
        "display": false,
        "email": false,
        "matrix": false,
        "discord": false,
        "twitter": false,
        "all_verified": false,
        "total_verified": 0,
        "total_required": 3
      }
    }
  }
}
```

### Request Verification Challenge

To request a verification challenge for a specific field of an account:

```json
{"version":"1.0","type":"RequestVerificationChallenge","payload":{"account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","field":"email"}}
```

Expected response:

```json
{
  "version": "1.0",
  "type": "JsonResult",
  "payload": {
    "type": "ok",
    "message": "CFGHJMPQ"
  }
}
```

### Verify Identity

To verify a specific field of an identity using the provided challenge:

```json
{"version":"1.0","type":"VerifyIdentity","payload":{"account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY","field":"email","challenge":"CFGHJMPQ"}}
```

Expected response if successful:

```json
{
  "version": "1.0",
  "type": "JsonResult",
  "payload": {
    "type": "ok",
    "message": true
  }
}
```

If the verification is successful, you'll also receive a notification with the updated account state:

```json
{
  "version": "1.0",
  "type": "NotifyAccountState",
  "payload": {
    "account": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "info": {
      "display": { "Raw": [72, 101, 108, 108, 111] },
      "legal": { "Raw": [] },
      "web": { "Raw": [] },
      "riot": { "Raw": [] },
      "email": { "Raw": [] },
      "pgp_fingerprint": null,
      "image": { "Raw": [] },
      "twitter": { "Raw": [] }
    },
    "judgements": [],
    "verification_state": {
      "display": false,
      "email": true,
      "matrix": false,
      "discord": false,
      "twitter": false,
      "all_verified": false,
      "total_verified": 1,
      "total_required": 3
    }
  }
}
```

## Notes

- Replace `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY` with the actual account address you're working with.
- The challenge in the "Verify Identity" example (`CFGHJMPQ`) should be replaced with the actual challenge received from the "Request Verification Challenge" step.
- The server may send notifications about account state changes at any time, not just in response to your commands.
- The `verification_state` shows the status of each field individually, as well as:
  - `all_verified`: `true` only when all required fields are verified.
  - `total_verified`: The number of fields that have been successfully verified.
  - `total_required`: The total number of fields that need to be verified for this account.
- If you encounter any errors, the server will respond with a JSON object containing an error message.
