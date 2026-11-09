# Application de Gestion d'Annonces Immobilières 🏠

Ce projet est une application Web full-stack . Il s'agit d'une plateforme de gestion d'annonces immobilières permettant de publier, consulter et gérer des biens selon différents niveaux de droits.

## 🛠 Stack Technique

Ce projet respecte les contraintes techniques imposées par le cahier des charges[cite: 4] :
* **Framework :** Next.js 16+ (App Router)[cite: 4]
* **Langage :** TypeScript (avec `strict: true`)[cite: 4]
* **Base de données :** PostgreSQL (hébergé via Docker)[cite: 4]
* **ORM :** Prisma 7.x[cite: 4]
* **Authentification :** Better Auth[cite: 4]
* **Validation :** Zod (pour la validation au runtime de toute entrée)[cite: 4]
* **Tests :** Vitest (sur une base de test séparée)[cite: 4]

---

## 🚀 Démarrage en partant de zéro

Voici les étapes pour lancer le projet sur une machine vierge[cite: 8, 10].

### 1. Prérequis
* Node.js (version 20 minimum)
* Docker et Docker Compose

### 2. Installation
Clonez le dépôt puis installez les dépendances :
```bash
npm install
cp .env.example .env
docker compose up -d
npx @better-auth/cli generate
npx prisma migrate dev
npm run db:seed
npm run dev
``
