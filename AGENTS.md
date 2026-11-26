# Verification

Before finishing code changes, the agent must run `npm test` and
`npm run typecheck` locally and fix any failures. Report the results in the
final response. If the user explicitly asks to skip these checks, follow that
instruction and report that the checks were skipped.

GitHub Actions checks are disabled to conserve the repository owner's Actions
quota. Do not re-enable automated workflows unless explicitly requested.
