# Compare languages (Karma Health)

Read-only [Kontent.ai](https://kontent.ai) **Dialog** custom app that compares two language variants of the same content item side by side.

Native Kontent history compares versions within one language. This app compares **across languages** (for example `en-US` vs `de-DE`) for sales demos.

Built from the [Kontent.ai custom-app-starter-react](https://github.com/kontent-ai/custom-app-starter-react) (React + TypeScript + HTTPS + Netlify).

## Features

- Dialog popup sized to ~90% × 90% via `setPopupSize`
- Live context updates via `observeCustomAppContext` (wrapped by the starter’s `useAppContext`)
- Side-by-side element table in content-type order
- Badges: Missing variant, Empty in one language (amber), Different (blue); Same rows hide when “Show differences only” is on
- Variant meta: workflow step id, last modified, publishing state when present
- Element rendering: text, rich text (DOMPurify + component chips), number, date/time, multiple choice names, taxonomy / modular content / asset as counts + ids, URL slug, custom raw; guidelines skipped; snippets inlined
- Optional word-level text diffs (`diff`)
- GET-only Management API proxy (API key never in the browser or `appConfig`)

## SDK exports used

Confirmed from [`@kontent-ai/custom-app-sdk` README](https://github.com/kontent-ai/custom-app-sdk-js):

| Export | Usage |
|--------|--------|
| `getCustomAppContext` | Available for one-shot fetch (starter prefers observe) |
| `observeCustomAppContext` | Subscribe to context changes |
| `setPopupSize` | Enlarge the Dialog on load |
| `CustomAppContext` | Discriminated union by `currentPage` |

## Security model

- **Never** put `KONTENT_MANAGEMENT_API_KEY` in frontend code, Vite env (`VITE_*`), or Kontent `appConfig`.
- The Netlify Function reads the key from server env and forwards **GET-only** allowlisted Management API paths.
- The Management API key is **not user-scoped**. Gate who can open the custom app with **Kontent roles** on the custom app registration.
- Optional `allowedLanguages` in `appConfig` filters the compare picker; it is not an authorization boundary.

## Environment variables

Set these in Netlify (Site settings → Environment variables) or a local `.env` for `netlify dev`:

| Variable | Required | Description |
|----------|----------|-------------|
| `KONTENT_MANAGEMENT_API_KEY` | Yes | Management API key (Bearer) |
| `KONTENT_ENVIRONMENT_ID` | No | If set, the proxy rejects requests for any other environment id |

Copy `.env.example` → `.env` for local development.

Optional frontend override:

| Variable | Description |
|----------|-------------|
| `VITE_KONTENT_PROXY_URL` | Absolute or relative proxy URL (default `/api/kontent`) |

## Local development

```bash
pnpm i
cp .env.example .env   # add KONTENT_MANAGEMENT_API_KEY
pnpm netlify:dev       # preferred: Vite HTTPS + functions on one origin
```

`netlify dev` serves the app and `/.netlify/functions/kontent` (also rewritten as `/api/kontent`).

### Local tunnel (ngrok)

Kontent custom apps require a public **HTTPS** URL.

```bash
# terminal 1
pnpm netlify:dev

# terminal 2
ngrok http 8888   # use the port netlify dev prints
```

Register the ngrok HTTPS URL in Kontent (see below). Renew the URL when the tunnel restarts.

You can also run `pnpm dev` (Vite HTTPS on port 5173) with a separate `netlify functions:serve`, but `netlify dev` is simpler.

## Deploy to Netlify

1. Create a Netlify site from this repository (or `netlify init` / drag-drop `dist` after configuring functions).
2. Build settings (already in `netlify.toml`):
   - Build command: `pnpm build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Set `KONTENT_MANAGEMENT_API_KEY` (and optional `KONTENT_ENVIRONMENT_ID`) in Netlify env.
4. Deploy. Confirm:
   - Site loads over HTTPS
   - `GET /api/kontent?environmentId=…&path=languages` returns JSON (not HTML)
5. CSP `frame-ancestors https://app.kontent.ai` is set via `netlify.toml` and `public/_headers`.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kontent-ai/custom-app-starter-react.git)

> After forking/pushing this project, point the Deploy button at **your** repo URL.

## Register in Kontent.ai

1. Open the target environment → **Environment settings** → **Custom apps**.
2. **Create** a custom app:
   - **Name:** Compare languages
   - **Source URL:** your Netlify (or ngrok) HTTPS URL
   - **Display mode:** **Dialog**
   - **Roles:** grant only the roles that should open the demo (remember: MAPI key is not user-scoped)
3. Optional **JSON parameters** (`appConfig`):

```json
{
  "allowedLanguages": ["en-US", "de-DE", "es-ES"],
  "defaultCompareLanguage": "de-DE",
  "showDifferencesOnlyByDefault": false
}
```

| Field | Purpose |
|-------|---------|
| `allowedLanguages` | Optional filter by language codename (or id) |
| `defaultCompareLanguage` | Preferred right-hand language when it is not the current one |
| `showDifferencesOnlyByDefault` | Initial state of the differences toggle |

4. Save. Open a **content item** in the item editor, then launch **Compare languages** from the custom apps entry point.

### Empty state

If the app is opened outside the item editor (or without a content item), it shows:

> Open a content item, then launch Compare languages.

## Demo script (Karma Health sales)

1. Open a multilingual Karma Health content item in Kontent (for example a campaign or treatment page with `en-US` + `de-DE`).
2. Launch **Compare languages** (Dialog). Note the Karma Health subtitle and large popup.
3. Left column is the **current UI language**; right defaults to the environment default (or `defaultCompareLanguage` from config).
4. Point out **Different** (blue) vs **Empty in one language** (amber) badges; toggle **Show differences only**.
5. Swap languages; switch the right-hand language to another active locale.
6. Call out rich text sanitised preview and component chips; linked items/assets shown as counts + ids (v1 — no nested resolution).
7. If a locale has no variant yet, show the **Missing variant** banner.
8. Close with: native history is single-language; this dialog is for **cross-language** QA before publish.

## Project structure

```
src/
  api/kontent.ts          Typed client → Netlify proxy
  components/
    CompareHeader.tsx
    LanguagePicker.tsx
    ElementRow.tsx
    ElementValue.tsx
    VariantMeta.tsx
    EmptyState.tsx
    ErrorPanel.tsx
    Skeleton.tsx
  hooks/useCompareData.ts
  utils/normalize.ts
  utils/diff.ts
  types.ts
  App.tsx
netlify/functions/kontent.ts   GET-only MAPI proxy
netlify.toml
public/_headers
```

### Allowlisted proxy GET paths

- `languages` (paginated via `X-Continuation`)
- `items/{id}`
- `items/{id}/variants`
- `items/{id}/variants/{language}`
- `types/{id}`
- `snippets/{id}`

Other methods/paths are rejected.

## Out of scope (v1)

- Writes / publishing
- Nested linked item or component resolution beyond chips/ids
- Historical versions

## Docs

- [Custom apps overview](https://kontent.ai/learn/docs/custom-apps)
- [Custom App SDK JS](https://github.com/kontent-ai/custom-app-sdk-js)

## License

MIT (based on the Kontent.ai custom app starter).
