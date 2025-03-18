# create-express-crud-app

Un générateur de projets Express.js avec une architecture API CRUD prête à l'emploi.

## Caractéristiques

- Structure de projet organisée
- Configuration MongoDB avec Mongoose
- Système d'authentification JWT
- Routes CRUD prédéfinies
- Middleware de sécurité (helmet, cors)
- Gestion des rôles utilisateur/admin
- ESModules prêts à l'emploi

## Installation

```bash
npm install -g create-express-crud-app
```

## Utilisation

```bash
# Exécutez simplement la commande et suivez les instructions
create-express-crud-app
```

## Structure du projet généré

```
nom-du-projet/
├── .env              # Variables d'environnement
├── .gitignore        # Fichiers ignorés par Git
├── package.json      # Configuration du projet
└── src/
    ├── config/       # Configuration (BD, etc.)
    ├── controllers/  # Logique métier
    ├── middleware/   # Middleware (auth, etc.)
    ├── models/       # Modèles de données
    ├── routes/       # Routes API
    ├── utils/        # Utilitaires
    └── server.js     # Point d'entrée
```

## API Routes

| Méthode | Route | Description | Accès |
|---------|-------|-------------|-------|
| POST | /api/users | Enregistrer un utilisateur | Public |
| POST | /api/users/login | Authentifier un utilisateur | Public |
| GET | /api/users/profile | Obtenir le profil | Privé |
| PUT | /api/users/profile | Mettre à jour le profil | Privé |
| GET | /api/users | Lister tous les utilisateurs | Admin |
| DELETE | /api/users/:id | Supprimer un utilisateur | Admin |

## Licence

MIT

## Repo Github

https://github.com/Biowz/create-express-crud-app