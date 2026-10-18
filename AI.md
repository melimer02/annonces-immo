# AI.md : usage de l'IA dans notre Application MI IMMO

**Outils :** Claude (utilisé tout au long du projet). ChatGPT et Gemini testés puis abandonnés : le premier inventait des API et des options, le second produisait beaucoup de code vite sans tenir compte du cours. Nous fournissons à l'IA le contenu du cours et des prompts longs et précis (versions, fichiers, contraintes de sécurité).

## 1. Délégué et décidé par nous

**Délégué à l'IA** : l'essentiel de la rédaction du code répétitif  (formulaires, Server Actions, requêtes Prisma, classes Tailwind, script `prisma/seed.ts` avec de nombreuses annonces et photos pour tester l'interface, squelettes de tests Vitest) et l'aide Git pour retrouver des versions perdues après un conflit. 

Raison : ce code est long et peu risqué à relire, et le déléguer fait gagner du temps.

**Décidé, relu et testé par nous** : les fonctionnalités et leur périmètre (brouillons, compte agent, dates, photos), les règles de sécurité tirées du cours (authentifier, autoriser, valider avec Zod, aucun `GET` qui modifie des données), la structure du projet et les migrations. Raison : ce sont les endroits où une erreur coûte cher, et nous devons pouvoir les défendre. Chaque changement est lancé dans le navigateur et passe `npx tsc --noEmit` et Vitest avant le commit.

## 2. Suggestions rejetées

1. **Une route `GET /agent` qui passait l'utilisateur connecté au rôle agent.** Rejetée : un `GET` ne doit jamais modifier de données. Il peut être déclenché par le préchargement d'un lien, par un robot ou par une balise `<img>` sur un autre site (CSRF), et n'importe quel utilisateur pouvait devenir agent en ouvrant l'adresse. Nous l'avons supprimée et remplacée par une Server Action en `POST` .


2. Mettre un use client sur toute la page d'une annonce : Pour faire marcher notre bouton "Ajouter aux favoris", l'IA nous a dit de passer toute la page /annonces/[id]/page.tsx en use client. Refusé. Ça cassait complètement le principe du rendu serveur (SSR) demandé. À la place, on a gardé la page en composant serveur, et on a juste isolé le petit bouton "Favoris" dans son propre composant client.


## 3. Un bug introduit par génération : les photos s'écrasaient

Le composant de téléversement généré par l'IA remplaçait la première photo à chaque nouvelle sélection au lieu de les accumuler. Le code compilait et les tests passaient. Nous l'avons détecté en testant à la main dans le navigateur : le champ fichier ne garde que la dernière sélection. Correction : garder la liste des fichiers dans l'état React et les envoyer avec le formulaire via une action qui les ajoute au `FormData`, avec un bouton « Retirer » par photo. Leçon : nos tests automatiques ne couvraient pas cette interaction, et l'IA ne peut pas la vérifier sans navigateur.

## 5. Les confusions de versions 
Nous avons remarqué que l'IA mélangeait souvent les anciennes et les nouvelles versions des outils. Par exemple avec Prisma : elle essayait constamment de nous faire utiliser Prisma 8, alors que le TP imposait strictement Prisma 7 . Nous avons dû surveiller  les commandes d'installation et le code généré pour ne pas détruire notre configuration d'authentification.

## 4. Ce que nous avons appris sur les tests générés par l'IA
L'IA nous a beaucoup aidées pour écrire les tests. Mais nous avons vite compris que **l'IA ne teste pas tout**. Elle a tendance à oublier les cas limites. Nous avons dû repasser derrière elle et écrire nous-mêmes les tests de sécurité (vérification des failles IDOR, modification des annonces selon les rôles) pour garantir qu'ils testent réellement notre application .



## Apprendre à bien utiliser l'IA
ce TP nous a  entraînées à rédiger de meilleurs "prompts" et à comprendre la délégation. Nous avons appris que bien utiliser l'IA ne signifie pas la laisser coder à notre place  mais plutôt la guider avec un contexte strict et garder un esprit critique sur tout ce qu'elle produit.