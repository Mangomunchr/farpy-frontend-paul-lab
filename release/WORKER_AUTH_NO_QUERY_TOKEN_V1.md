# WORKER_AUTH_NO_QUERY_TOKEN_V1

## Summary

Worker authentication no longer accepts tokens from query strings.

## Accepted worker auth

- `Authorization: Bearer <token>`
- `x-farpy-worker-token: <token>`
- `x-farpy-worker: <token>`

## Rejected worker auth

- `?worker_token=<token>`
- missing token
- invalid token

## NodeMuncher

NodeMuncher node-token auth already used header/Bearer token handling and was not changed.

## Scope

- No token rotation.
- No pairing changes.
- No wallet/payment/render logic changes.
