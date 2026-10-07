# Upload PDF dizajna — podešavanje na Ubuntu serveru (karpas.app)

Aplikacija snima uploadovane PDF dizajne u folder na serveru.
PDF se otvara samo kroz aplikaciju (prijavljeni korisnici), folder se NE izlaže direktno preko nginx-a.

Rute u aplikaciji:
- `POST /api/dizajni`                   — upload (samo vlasnik)
- `GET  /api/dizajni/<mjesec>/<fajl>`   — pregled PDF-a (svi prijavljeni)

U bazu (`dodatna_stampa`) se upisuje putanja oblika:
`/api/dizajni/2026-10/1791361693739_K_K_AGRO_TRADE_140+90x300_02-26.pdf`

---

## 1. Napraviti folder

Prvo provjeriti pod kojim korisnikom radi Node:

```bash
ps -o user= -C node
```

Zatim napraviti folder i dati ga tom korisniku (`<node_korisnik>` zamijeniti):

```bash
sudo mkdir -p /srv/proizvodnja/dizajni
sudo chown -R <node_korisnik>:<node_korisnik> /srv/proizvodnja
sudo chmod 750 /srv/proizvodnja/dizajni
```

## 2. Podesiti `.env` na serveru

U `.env` backenda dodati:

```
DIZAJNI_DIR=/srv/proizvodnja/dizajni
DIZAJNI_MAX_MB=20
```

Restartovati backend (zavisno kako se pokreće):

```bash
pm2 restart <ime_aplikacije>
# ili
sudo systemctl restart <ime_servisa>
```

## 3. nginx — dozvoliti veće fajlove

nginx po defaultu odbija zahtjeve veće od 1 MB (greška 413).
U `server { ... }` blok za karpas.app dodati:

```nginx
client_max_body_size 25m;
```

Provjeriti i učitati konfiguraciju:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Backup

Folder nije dio baze — backup baze ga ne pokriva.
Dnevna kopija u 02:00 (`crontab -e`):

```bash
0 2 * * * tar czf /var/backups/dizajni_$(date +\%F).tar.gz -C /srv/proizvodnja dizajni
```

## 5. Provjera

Nakon prvog uploada iz aplikacije:

```bash
ls -la /srv/proizvodnja/dizajni/$(date +%Y-%m)/
```

Fajl treba biti tu, a dugme 👁 pored polja „Dodatna štampa“ treba otvoriti PDF.

---

## Napomena

Dugme **📎 PDF** (putanja `\\172.16.20.200\Aplikacije\Kese_deklaracija\...`) radi kao i ranije.
Ako se PDF uploaduje (**⬆ Upload**), u `dodatna_stampa` ide serverska putanja (`/api/dizajni/...`),
koju postojeći program kod klijenata ne može otvoriti — za te narudžbe koristiti 📎 PDF.
