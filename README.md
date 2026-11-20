# Compare languages (Karma Health)

Read-only [Kontent.ai](https://kontent.ai) **Dialog** custom app that compares two language variants of the same content item side by side.

Native Kontent history compares versions within one language. This app compares **across languages** (for example `en-US` vs `de-DE`) for sales demos.

Built from the [Kontent.ai custom-app-starter-react](https://github.com/kontent-ai/custom-app-starter-react) (React + TypeScript + HTTPS + Netlify).

## Features

- Dialog popup sized to ~90% × 90% via `setPopupSize`
- Live context updates via `observeCustomAppContext` (wrapped by the starter’s `useAppContext`)
- Content type dropdown, then the content items of that type
- The environment default language from Localization stays on the left; the next variant opens on the right
- Compare variant lists the other active languages from the Management API, in Localization order
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

## Repository

https://github.com/ArronJLinton/custom-app-compare-language-variants

## Environment variables

Copy `.env.example` → `.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `KONTENT_MANAGEMENT_API_KEY` | Yes | Management API key (Bearer) — **server/local `.env` only** |
| `KONTENT_ENVIRONMENT_ID` | No | If set, the proxy rejects requests for any other environment id |

Optional frontend override:

| Variable | Description |
|----------|-------------|
| `VITE_KONTENT_PROXY_URL` | Absolute or relative proxy URL (default `/api/kontent`) |

## Primary path: local HTTPS + ngrok

Kontent custom apps need a public **HTTPS** URL for the hosted code. For demos, run locally and tunnel with ngrok (Netlify deploy is optional / later).

### 1. Install and configure

```bash
pnpm i
cp .env.example .env
# edit .env → set KONTENT_MANAGEMENT_API_KEY
```

### 2. Run the app + Management API proxy

Prefer one process so the UI and `/.netlify/functions/kontent` (rewritten as `/api/kontent`) share an origin:

```bash
pnpm netlify:dev
```

Note the local port Netlify prints (commonly `8888`).  
`netlify.toml` already points the function at `netlify/functions` and rewrites `/api/kontent`.

Alternative: `pnpm dev` (Vite HTTP on `:3000`) plus a separate `netlify functions:serve` — more moving parts; use only if you need it.

### 3. Tunnel with ngrok

Point ngrok at the plain-HTTP process you started. ngrok provides the HTTPS URL.

```bash
ngrok http 8888   # netlify:dev
ngrok http 3000   # pnpm dev (Vite)
```

Copy the **HTTPS** forwarding URL (e.g. `https://abc123.ngrok-free.app`).  
Update Kontent whenever the tunnel URL changes.

### 4. Register that URL in Kontent

Environment settings → **Custom apps** → create/edit **Compare languages**:

- **Source / hosted code URL:** the ngrok HTTPS URL (no trailing path required for the Vite/Netlify root)
- **Display mode:** **Dialog**
- **Roles:** only demo roles (MAPI key is not user-scoped)
- Optional JSON `appConfig` (below)

Open the app, choose a content type, then a content item. Launching from an item editor still selects that item.

## Register in Kontent.ai (details)

1. Open the target environment → **Environment settings** → **Custom apps**.
2. **Create** a custom app:
   - **Name:** Compare languages
   - **Source URL:** your **ngrok HTTPS URL** (primary) — or a later hosted URL
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

## Optional later: Netlify hosting

Not required for the demo. When you want a stable URL instead of ngrok:

1. Connect this GitHub repo to Netlify (`netlify.toml` already sets build `pnpm build`, publish `dist`, functions `netlify/functions`).
2. Set `KONTENT_MANAGEMENT_API_KEY` (and optional `KONTENT_ENVIRONMENT_ID`) in Netlify env.
3. Point the Kontent custom app Source URL at the Netlify HTTPS site.
4. CSP `frame-ancestors https://app.kontent.ai` is set via `netlify.toml` and `public/_headers`.

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
