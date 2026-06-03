# Migrations BD - Version 2.1 (Actualités & Notifications)

> Ce document est destiné au développeur backend (Patrick).  
> Mise à jour pour inclure le système de notifications et le lien avec les actualités.

---

## Nouvelles Tables

### 1. Table `categories_actualites` (Rappel)
Stocke les types d'actus.

```sql
CREATE TABLE categories_actualites (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(50) NOT NULL UNIQUE,
    icone           VARCHAR(50) DEFAULT NULL,
    couleur         VARCHAR(10) DEFAULT '#888',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Table `actualites` (Mise à jour)
Ajout d'un lien optionnel vers un club spécifique pour les actus ciblées.

```sql
CREATE TABLE actualites (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    contenu_complet     TEXT DEFAULT NULL,
    image_url           VARCHAR(500) DEFAULT NULL,    -- IMPORTANT: URL de l'image (Firebase/S3)
    categorie_id        INT NOT NULL,
    club_id             INT DEFAULT NULL,             -- OPTIONNEL: Si l'actu concerne un club précis
    ligue               ENUM('Elite 1', 'Elite 2', 'Général') DEFAULT 'Général',
    source              VARCHAR(100) DEFAULT NULL,
    est_important       BOOLEAN DEFAULT FALSE,
    date_publication    DATETIME NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (categorie_id) REFERENCES categories_actualites(id),
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);
```

### 3. Table `user_push_tokens`
Pour stocker les tokens Expo/FCM des utilisateurs afin d'envoyer des notifications.

```sql
CREATE TABLE user_push_tokens (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    uuid                VARCHAR(255) NOT NULL,        -- UUID de l'utilisateur mobile
    push_token          VARCHAR(255) NOT NULL,        -- Token Expo ou FCM
    plateforme          ENUM('ios', 'android') NOT NULL,
    dernier_acces       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (uuid, push_token)
);
```

### 4. Table `notifications_preferences`
Stocke les abonnements des utilisateurs aux matchs ou aux clubs.

```sql
CREATE TABLE notifications_preferences (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    uuid                VARCHAR(255) NOT NULL,
    type_sujet          ENUM('match', 'club', 'general') NOT NULL,
    sujet_id            INT DEFAULT NULL,             -- ID du match ou du club
    actif               BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (uuid, type_sujet, sujet_id)
);
```

---

## Logique de Notification (Back-end)

### A. Notifications Matchs
1. **Avant Match** : Un script (CRON job) doit vérifier les matchs commençant dans 1 heure. Envoyer une notification aux utilisateurs ayant `sujet_id` (match) ou suivant les deux clubs.
   - *Message* : "Le match [Club A] vs [Club B] commence dans 1 heure ! Préparez-vous."
2. **Début Match** : Au moment du changement de statut vers "En cours".
   - *Message* : "C'est parti ! Le match [Club A] vs [Club B] vient de commencer."
3. **Buts / Événements** : Lors de l'ajout d'un événement "but" dans la table `match_events`.
   - *Message* : "BUT ! [Club A] [ScoreA] - [ScoreB] [Club B]. Buteur : [Nom Joueur]."

### B. Notifications Actualités Club
Lorsqu'une nouvelle actualité est insérée dans la table `actualites` avec un `club_id` non nul :
1. Identifier tous les utilisateurs abonnés aux notifications de ce club.
2. Envoyer une notification push.
   - *Message* : "[Nom Club] : [Titre de l'actu]"

---

## Endpoints Push

| Méthode | Endpoint                         | Description                                    |
|---------|----------------------------------|------------------------------------------------|
| POST    | `/api/notifications/register`    | Enregistrer un `push_token` pour un UUID       |
| POST    | `/api/notifications/subscribe`   | S'abonner à un match ou un club                |
| POST    | `/api/notifications/unsubscribe` | Se désabonner                                  |
| GET     | `/api/notifications/my-subs`     | Liste mes abonnements actifs                   |

### Exemple de Payload pour `/register` :
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "plateforme": "android"
}
```
