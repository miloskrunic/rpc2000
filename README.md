# RPC2000

Prezentacioni sajt firme za obradu metala iz Valjeva. Astro, TypeScript i CSS, sa statičkim izlazom.

## Lokalno pokretanje

```powershell
npm.cmd ci
npm.cmd run dev
```

Otvorite adresu koju Astro ispiše, podrazumevano `http://127.0.0.1:4321/`. Zaustavljanje: `Ctrl+C`. Astro izvor se ne otvara kroz Live Server.

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Na Linux/macOS koristite `npm` umesto `npm.cmd`. Build uključuje proveru tipova. Skripte koriste projektnu Node 22 zavisnost; gotovom sajtu nije potreban Node server.

## GitHub Pages

Sajt: https://miloskrunic.github.io/rpc2000/

Push na `main` pokreće `.github/workflows/deploy.yml`: instalaciju, proveru, build i objavu preko GitHub Actions. Pages source je **GitHub Actions**. Workflow koristi `SITE_URL=https://miloskrunic.github.io` i `BASE_PATH=/rpc2000/`; običan lokalni razvoj ostaje na `/`.

Za lokalnu proveru iste putanje u PowerShell-u:

```powershell
$env:SITE_URL = 'https://miloskrunic.github.io'
$env:BASE_PATH = '/rpc2000/'
npm.cmd run build
npm.cmd run preview
```

Zatim otvorite `/rpc2000/` na adresi preview servera. U novom terminalu bez tih promenljivih lokalni razvoj ponovo koristi koren.

## Izmene

- Podaci i usluge: `src/data/company.ts`.
- Sekcije: `src/components/sections/`.
- Boje i fontovi: `src/styles/tokens.css`.
- Kružna skrol scena: `src/styles/orbit.css` i `src/scripts/orbit.ts`.
- Navigacija i lokalni pregled upita: `src/scripts/site.ts`.
- Poreklo slika: [ASSETS.md](ASSETS.md).

Ovo je javno dostupna probna verzija sa ilustrativnim fotografijama i privremenim kontaktima. Forma omogućava samo lokalni pregled i kopiranje upita; ništa ne šalje. `noindex` ostaje uključen do odobrenja konačnog sadržaja. Interne beleške, QA artefakti i lokalni alati ne ulaze u javni repozitorijum.
