
# Gestion d'annonces immobilières

Projet du TP « Frameworks côté serveur » (M2 IWOCS), réalisé par **Melissa Mermouri** et **Imane Ammour**.

Le site permet de consulter des annonces de vente et de location, de poser des questions aux agents, de mettre des annonces en favoris, et pour les agents de publier leurs propres biens avec des photos.

Technos : Next.js 16 (App Router), TypeScript strict, Prisma 7, PostgreSQL (Docker), Better Auth, Zod, Vitest.

## Lancer le projet

Il faut Node 22 ou plus et Docker.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

Avant `npm run dev`, attendez que `docker compose ps` affiche `healthy` (quelques secondes).

`npm run dev` fait trois choses avant de démarrer Next : il génère le client Prisma, applique les migrations, puis charge les données de démonstration si la base est vide. Relancer la commande ne casse rien et n'écrase aucune donnée.

Le site est ensuite sur http://localhost:3000.


## Comptes de démonstration

Mot de passe commun : `motdepasse123`

| Email                        | Rôle             | À quoi il sert                                           |
| ---------------------------- | ---------------- | -------------------------------------------------------- |
| admin@immo.fr                | ADMIN            | valide les agents, tous les droits                       |
| agent1@immo.fr               | AGENT validé     | publie et gère ses annonces                              |
| agent2@immo.fr               | AGENT validé     | vérifier qu'il ne peut pas toucher aux annonces d'agent1 |
| agent3@immo.fr               | AGENT en attente | voir ce qu'un agent non validé ne peut pas faire         |
| user1@immo.fr, user2@immo.fr | USER             | questions et favoris                                     |

Le seed crée aussi 50 annonces réparties entre agent1 et agent2, dont des brouillons.

## Rôles et droits

| Rôle           | Ce qu'il peut faire                                          |
| -------------- | ------------------------------------------------------------ |
| Visiteur       | voir les annonces publiées                                   |
| USER           | poser des questions, gérer ses favoris                       |
| AGENT (validé) | créer, modifier, supprimer, publier ou dépublier **ses** annonces, répondre aux questions sur **ses** annonces |
| ADMIN          | tout, et valider ou refuser les agents                       |

Comment on devient agent : un visiteur clique sur « Devenir agent » et s'inscrit (un utilisateur déjà connecté n'a qu'à cliquer). Son compte passe en `EN_ATTENTE`. Tant que l'admin ne l'a pas validé, il ne peut rien publier. Nous avons gardé cette validation parce que sans elle, n'importe qui pourrait publier de fausses annonces.

## Organisation du code
```
src/app/         une URL = un dossier, avec les Server Actions à côté de leur page
 src/components/  les morceaux d’interface (pas d’accès à la base)
 src/lib/         la logique : prisma, auth, session, authz, schémas Zod, requêtes
 prisma/          schéma, migrations, seed
 tests/           tests Vitest
```

**Nos Choix :**

- **`authz.ts` et `session.ts` sont séparés.** Les règles de droits (qui peut créer, modifier, voir) sont des fonctions pures, donc testables sans serveur. `session.ts` s'occupe seulement de lire la session.
- **Pas de Route Handler pour nos formulaires**, tout passe par des Server Actions. Il y a deux routes seulement : `/api/auth` (imposée par Better Auth) et `/photos/[nom]`, qui sert un fichier après avoir vérifié que l'annonce est visible.

- **Pas de `loading.tsx`**, car il mettrait les routes en streaming et fausserait les codes 404 et 307.

## Sécurité

Chaque Server Action suit le même ordre : authentification, autorisation, validation Zod, puis écriture.

- **Le rôle ne vient jamais du client.** `role` et `statutPro` sont déclarés avec `input: false` dans Better Auth, donc une inscription envoyée avec `role=ADMIN` crée un simple USER. Le passage en agent est écrit côté serveur.
- **Pas d'IDOR.** La propriété de l'annonce est dans la condition SQL (`where: { id, ...filtreProprietaire(user) }`). Une annonce inexistante ou qui n'est pas à vous donne la même réponse : 404.
- **Brouillons** visibles uniquement par leur auteur et les admins.
- **Actions admin** : chacune revérifie le rôle admin, puisqu'une Server Action peut être appelée par n'importe qui.
- **Validation** avec Zod sur les formulaires, les paramètres d'URL et les identifiants. 
- **Photos** : le vrai type est lu dans les premiers octets du fichier (pas celui annoncé par le navigateur), la taille et le nombre sont limités, les noms sont des UUID.
- **Sessions en base** (table `session`) : pour exclure quelqu'un immédiatement, on supprime sa ligne.
- Les secrets restent dans `.env`, qui n'est pas versionné ; `.env.example` montre ce qu'il faut renseigner.

## Performance et base de données

En développement, chaque requête SQL est résumée dans le terminal (action, table, durée, total par page). Le SQL complet est écrit dans `logs-sql.log`.

La page `/annonces` fait 3 requêtes pour le contenu (`COUNT`, `Annonce`, et `Photo ... WHERE annonceId IN (...)`), plus 1  pour la session si on est connecté. Les photos sont chargées en une seule requête groupée, donc le nombre de requêtes ne dépend pas du nombre d'annonces affichées. Un test le vérifie.

## Tests

```bash
npm test
```

Les tests tournent sur une base séparée (`DATABASE_URL_TEST`). Ils couvrent :

| Sujet | Fichier |
|---|---|
| Droits : un agent ne modifie que ses annonces, un USER ne crée rien, un agent en attente ne crée pas | `authz.test.ts`, `actions.test.ts` |
| Validation : prix négatif, titre trop court | `validation.test.ts` |
| Visibilité des brouillons, pas de N+1 | `annonces.test.ts` |
| Rôle non falsifiable | `auth.test.ts` |

## Vérifier à la main avec curl

```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/999999   # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/abc      # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/1/edit   # 307 vers /login
curl -s localhost:3000/annonces | grep -c "maison"                         
```

## Limites


- Les photos du seed sont des liens externes , pas des fichiers uploadés.
- La connexion Google ne s'active que si les clés sont dans `.env`.

## Usage de l'IA

Voir `AI.md`.
