# Mock Data Generator Eval Iteration Log

Branch: `CLOUDP-397105-eval-iteration`
Ticket: CLOUDP-397105 (Mock Data Generator Iteration)

## Baseline (experiment `CLOUDP-397105-eval-iteration-1776711226`)

| Scorer                        | Score |
| ----------------------------- | ----- |
| FakerFieldNameAccuracy        | 1.000 |
| FakerFieldPercentRecognized   | 1.000 |
| FakerMethodRunnableScorer     | 1.000 |
| FakerArgParseableScorer       | 0.999 |
| FakerMethodSuggestionAccuracy | 0.870 |
| FakerSampleValueAccuracy      | 0.800 |

Aggregate (simple mean): **0.9448**

Top failure categories (from 240 scorer events):

1. **"No sample values" variant: LLM invents domain-plausible enums** (biggest cluster). mflix-no-samples + weather-no-samples: 54+ mismatches over `genres[]`, `rated`, `languages[]`, `countries[]`, `type`, `properties.geometry`, `@type`, etc. LLM picks `helpers.arrayElement` with invented values like `["Drama","Comedy","Action",...]`; expected `GenericStringMethodCriterion`. Those arg values are legitimately high-quality mock data, so double-penalized.
2. **Timestamp-integer Number fields without sampleValues**: chargeCredit-no-samples. LLM picks `date.past/future/recent/anytime` for `created`, `updated`, `effective_at`, `expires_at`, `voided_at` (all typed Number). Expected `number.int`. ~13 mismatches per trial cluster.
3. **ID-like string fields without sampleValues → LLM picks `database.mongodbObjectId`**: chargeCredit-no-samples `id`, `applicability_config.scope.prices[].id`. Expected `IdlikeMethodCriterion` (currently just `string.alphanumeric`/`string.uuid`). ObjectId is a legitimate ID choice.
4. **countryCode vs country**: ecommerce `shippingAddress.country`/`billingAddress.country` have sample `['US']` (ISO code). Expected `location.countryCode`, LLM picks `location.country`. Prompt doesn't guide based on sample-value format.
5. **Miscellaneous one-offs**: `title` → `book.title` (2x), `poster` → `internet.url` (1x, vs `image.url`), `trackingNumber` → `string.alphanumeric` (2x, vs `string.numeric`).

---
