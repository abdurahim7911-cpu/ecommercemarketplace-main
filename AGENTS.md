<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- App code is written in plain JavaScript (.js/.jsx); only framework scaffolding (router, root, start, ui kit) stays TypeScript — the user asked for JS.
- Order lifecycle rules live in the `validate_order_status` DB trigger and checkout in the `place_order` RPC — the database is the source of truth, UI only mirrors it.
- Checkout splits a cart into one order per seller so each seller manages its own order status.
