# Status check

Génère `/var/www/status-data/status.json`, lu par `thomasbasquin.fr/status`.

## Installation sur le serveur (une fois)

`/var/www` appartient à `thomas`, donc pas besoin de sudo pour le dossier de
sortie :

```bash
mkdir -p /var/www/status-data
```

Le reste (units systemd) nécessite root :

```bash
sudo ln -s /home/thomas/projects/portfolio-thomas/infra/status/vps-status-check.service /etc/systemd/system/
sudo ln -s /home/thomas/projects/portfolio-thomas/infra/status/vps-status-check.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vps-status-check.timer
```

## Vérifier

```bash
sudo systemctl start vps-status-check.service   # forcer un run immédiat
cat /var/www/status-data/status.json
systemctl list-timers vps-status-check.timer
```

## Comment la liste des sites est construite

Les domaines sont découverts automatiquement depuis
`/etc/nginx/sites-enabled/*` : un site par fichier, le domaine vient du
premier `server_name`, et la méthode de vérification est déduite du
`proxy_pass` (présent -> on surveille le ou les ports cibles ; absent -> site
statique, considéré up tant que nginx tourne). Un nouveau site ajouté sur le
VPS apparaît donc tout seul au prochain run, pas besoin de toucher au script.

Deux choses restent à régler à la main dans `check.sh` :

- `LABELS` : libellé affiché pour un domaine donné (sinon le domaine brut
  sert de libellé)
- `EXCLUDE` : domaines à ne pas afficher (ex: une redirection pure vers un
  autre site déjà listé, comme `myshelf.thomasbasquin.fr` -> `nook`)

Après une modif de `check.sh`, relancer le service pour voir l'effet tout de
suite (`sudo systemctl start vps-status-check.service`) — pas besoin de
réinstaller les units.
