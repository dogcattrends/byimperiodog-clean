# A11y Contrast Report

Base URL: http://localhost:3000

- /: ERROR page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
[2m - navigating to "http://localhost:3000/", waiting until "load"[22m

- /sobre: ERROR page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/sobre
Call log:
[2m - navigating to "http://localhost:3000/sobre", waiting until "load"[22m

- /contato: ERROR page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/contato
Call log:
[2m - navigating to "http://localhost:3000/contato", waiting until "load"[22m

- /filhote/test: ERROR page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/filhote/test
Call log:
[2m - navigating to "http://localhost:3000/filhote/test", waiting until "load"[22m

- /admin: ERROR page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin
Call log:
[2m - navigating to "http://localhost:3000/admin", waiting until "load"[22m


## Fixes propostos (tokens neutros)
- Ajustes sugeridos em app/globals.css para tokens: --surface, --surface-2, --border, --text-muted
- Sem alterações sugeridas (tokens já presentes)