# PRICE_ROUTE_MALFORMED_JSON_FAIL_CLOSED_V1

## Summary

The public job price route now fails closed on malformed JSON.

## Route

- `POST /node/v1/web-render/jobs/{job_id}/price`

## Behavior

- Malformed JSON returns `400 {"ok":false,"error":"invalid_json"}`.
- Valid JSON continues into the existing price validation and pricing logic.

## Scope

- No pricing math changes.
- No wallet/payment/render logic changes.
