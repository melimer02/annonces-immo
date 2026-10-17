#  Gestion d'annonces immobilières

Application full-stack : Next.js  (App Router), TypeScript strict, Prisma 7,
PostgreSQL (Docker), Better Auth, Zod, Vitest.

**Binôme : Melissa MERMOURI | Imane AMMOUR** 

## Démarrage depuis zéro

Prérequis : Node 22+, Docker.

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```


Pour lancer les test

```bash
npm test
```

Application : http://localhost:3000



## Comptes de test (mot de passe : `motdepasse123`)

| Email | Rôle | Pour tester |
|---|---|---|
| admin@immo.fr | ADMIN | tous les droits |
| agent1@immo.fr | AGENT | publie, modifie, répond aux questions |
| agent2@immo.fr | AGENT | tester qu'il ne peut PAS toucher aux annonces d'agent1 |
| user1@immo.fr | USER | pose des questions, favoris |
| user2@immo.fr | USER | idem |

Le seed crée 50 annonces réparties entre les deux agents, dont des brouillons.

## Rôles et droits

| Rôle | Droits |
|---|---|
| Visiteur | consulte les annonces publiées |
| USER | + questions, favoris |
| AGENT | + crée, modifie, supprime, (dé)publie SES annonces, répond aux questions de SES annonces |
| ADMIN | tout |

Un visiteur devient agent via « Devenir agent » (inscription directe en agent)

## Architecture

```
src/app/         une URL = un dossier ; + les serveurs actions
src/components/  pièces d'interface
src/lib/         logique : prisma, auth, session, authz, schemas (Zod), annonces
```




## Sécurité

Chaque Server Action suit l'ordre : authentification, autorisation, validation Zod, écriture.

- **Rôle non falsifiable** : `role` est déclaré avec `input: false` dans Better Auth ;
  une inscription qui poste `role=ADMIN` crée un compte USER (testé).
  Le passage en AGENT est écrit côté serveur, jamais accepté du client.
- **Pas d'IDOR** : la propriété fait partie de la condition SQL
  (`where: { id, ...filtreProprietaire(user) }`). Inexistante ou pas à toi : même 404.
- **Brouillons** visibles seulement de leur auteur et des admins (filtre dans `listerAnnonces`).
- **Validation** : Zod sur formulaires, paramètres d'URL et ids. Les valeurs saisies sont conservées après erreur.
- **Photos** : type réel vérifié sur les octets (pas sur le type déclaré), taille et nombre limités, noms en UUID.
- **Sessions en base** (table `session`) : un compte se révoque immédiatement en supprimant sa ligne.

## Performance et base de données

Chaque requête SQL est résumée dans le terminal
(action, table, durée, total par page) ; le SQL complet est écrit
dans `logs-sql.log`.

`/annonces` : **3 requêtes métier** (`COUNT`, `Annonce`, `Photo ... WHERE annonceId IN (...)`)
+ 2 d'authentification si connecté. Les photos sont chargées en une requête groupée.
Le nombre ne dépend pas du nombre d'annonces affichées (test `annonces.test.ts`).


## Tests

`npm test` (Vitest) tourne sur une base **séparée** (`DATABASE_URL_TEST`) ;
`tests/setup.ts` refuse de démarrer si elle est absente.

| Exigence | Fichier |
|---|---|
| Un agent ne modifie que ses annonces, un USER ne crée rien | `authz.test.ts`, `actions.test.ts` |
| Prix négatif, titre trop court rejetés | `validation.test.ts` |
| Un brouillon n'apparaît pas dans la liste publique | `annonces.test.ts` |
| Pas de N+1 (invariance du nombre de requêtes) | `annonces.test.ts` |
| Rôle non falsifiable | `auth.test.ts` |

Chaque test a été vérifié en cassant volontairement le code correspondant.

## Vérifications par curl

```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/999999   # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/abc      # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/1/edit   # 307 -> /login
curl -s localhost:3000/annonces | grep -c "pièces"                        # HTML déjà rendu serveur
```



## Usage de l'IA
voir `AI.md`
