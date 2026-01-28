# Preflight Vercel Report

Data: 2026-01-28T14:59:43.647Z
Repository: by-imperio-dog

## Environment detected
- Node: v20.19.0
- Package manager: npm

## Stages executed
| Stage | Status | Duration | Command | Observation |
| --- | --- | --- | --- | --- |
| Essential env vars | PASS | 0.00s | Env validation | - |
| lint | PASS | 22.71s | npm.cmd run lint | - |
| typecheck | PASS | 9.66s | npm.cmd run typecheck | - |
| test | PASS | 25.61s | npm.cmd run test | - |
| seo:audit | PASS | 3.25s | npm.cmd run seo:audit | - |
| check:all | WARN | 37.17s | npm.cmd run check:all | errors.ts        |      46 |       50 |      50 |      46 | 33-34,39-54,57-67 |
| build | PASS | 55.90s | npm.cmd run build | - |
| Smoke tests HTTP | PASS | 1.16s | npx next start -p 3100 + smoke requests | - |

## Final decision
- Result: GO
- Warnings: check:all