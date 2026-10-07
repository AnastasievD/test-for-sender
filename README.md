# Smart Sender frontend test

A small webhook management application built with React, TypeScript and Mantine. The API is implemented entirely with MSW and keeps its data and session state in memory.

## Run locally

Node.js 24 and npm are recommended. The supported Node.js range is `^20.19.0 || ^22.12.0 || >=24.0.0`. No environment variables or external backend are required.

```bash
git clone https://github.com/AnastasievD/test-for-sender.git
cd test-for-sender
npm ci
npm run dev
```

Open the URL printed by Vite. Useful checks:

```bash
npm run check
npm run typecheck
npm test
npm run build
```

To run the browser tests, install Chromium once and start the suite. Playwright starts the development server automatically:

```bash
npx playwright install chromium
npm run test:e2e
```

## Test credentials

```text
Email:    senior@smartsender.test
Password: SmartSender123!
```

The login form is prefilled with these values for easier review.

## Key decisions

- A small feature-based structure keeps application setup, transport concerns, mocks and product features separate without introducing monorepo or full FSD overhead.
- Zod schemas are the single source of truth for form inputs and API models. Types are inferred from schemas instead of being declared twice.
- All interface copy, accessibility labels, validation messages, notifications and mock API errors live in a typed i18next English resource; components contain translation keys instead of user-facing literals.
- The native `fetch` wrapper owns CSRF initialization, mandatory headers, runtime response validation, typed API errors and bounded retries. UI components do not implement transport policy.
- MSW treats request JSON as unknown and validates it with the same input schemas before executing an operation.
- The device session token only exists as a local variable between login and session issue. It is never persisted or placed in the URL.
- The stable 32-character device fingerprint is the only authentication-related value stored in `localStorage`.
- Concurrent `401` responses share one rotate Promise. A session generation counter also prevents a late `401` from starting a second rotation after another request has already recovered the session.
- CSRF and authentication retries have independent one-attempt budgets, preventing infinite retry loops.
- TanStack Query owns server state. Page and search are owned by the URL, so refresh and browser back/forward navigation restore the list view.
- Search URL updates use history replacement to avoid creating one browser history entry per keystroke; pagination uses normal navigation.
- The MSW session expires after 30 seconds. A hard refresh resets the in-memory mock session, so signing in again is expected by the assignment.

## Test coverage

The Vitest integration tests verify concurrent session recovery and ensure malformed API responses are rejected by their runtime Zod contracts.

The Playwright E2E suite covers the primary browser journey, URL-backed browser navigation and invalid page normalization.

## Known limitations

- Mock data is intentionally reset on a full page reload.
- The application uses a fixed non-empty captcha header; no captcha widget is rendered, as required by the assignment.
