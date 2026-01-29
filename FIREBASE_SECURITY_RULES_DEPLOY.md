# 🔐 RÈGLES DE SÉCURITÉ FIREBASE - DÉPLOIEMENT URGENT

## ⚠️ ERREUR 403 FORBIDDEN - SOLUTION

Si vous recevez une erreur **403 Forbidden** lors de la connexion admin, c'est que les règles de sécurité Firebase ne sont pas déployées correctement.

---

## 📋 ÉTAPE 1 : Realtime Database Rules

### Instructions :
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **evenpasssenegal**
3. Dans le menu latéral : **Realtime Database** → **Règles**
4. Remplacez TOUT le contenu par les règles ci-dessous
5. Cliquez sur **Publier**

### ✅ RÈGLES REALTIME DATABASE (Copiez-collez exactement) :

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "finances": {
      ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    },

    "logs": {
      ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    },

    "systemLogs": {
      ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    },

    "events": {
      ".read": true,
      "$eventId": {
        ".write": "auth != null && (data.child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",

        "tickets": {
          ".read": true,
          ".write": "auth != null && (root.child('events').child($eventId).child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
        },

        "scans": {
          ".read": "auth != null && (root.child('events').child($eventId).child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
          ".write": "auth != null && (root.child('events').child($eventId).child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
        },

        "attendees": {
          ".read": "auth != null && (root.child('events').child($eventId).child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
          ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
        }
      }
    },

    "orders": {
      "$orderId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
        ".write": "auth != null && (!data.exists() && newData.child('userId').val() === auth.uid) || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
      }
    },

    "users": {
      ".read": "auth != null",
      "$userId": {
        ".write": "auth != null && (auth.uid === $userId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
      }
    },

    "organizers": {
      ".read": "auth != null",
      "$organizerId": {
        ".write": "auth != null && (auth.uid === $organizerId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
      }
    },

    "admins": {
      ".read": "auth != null",
      "$adminId": {
        ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
      }
    },

    "payments": {
      "$paymentId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
        ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
      }
    },

    "statistics": {
      ".read": "auth != null",
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    },

    "config": {
      ".read": true,
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    },

    "evenpass": {
      "global_config": {
        "home_ads": {
          ".read": true,
          ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
        }
      },
      "controllers": {
        ".read": "auth != null",
        ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
      },
      "sessions": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "scans": {
        ".read": "auth != null",
        ".write": "auth != null"
      },
      "tickets": {
        ".read": "auth != null",
        "$ticketId": {
          ".write": "auth != null"
        }
      },
      "events": {
        ".read": true,
        "$eventId": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

---

## 📋 ÉTAPE 2 : Firestore Rules (si vous utilisez Firestore)

### Instructions :
1. Dans Firebase Console : **Firestore Database** → **Règles**
2. Remplacez TOUT le contenu par les règles ci-dessous
3. Cliquez sur **Publier**

### ✅ RÈGLES FIRESTORE (Copiez-collez exactement) :

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function - Admin Finance UID
    function isAdminFinance() {
      return request.auth != null && request.auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
    }

    // Helper function - Authenticated user
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function - Event owner
    function isEventOwner(eventId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/events/$(eventId)).data.organizer_id == request.auth.uid;
    }

    // ============================================
    // FINANCES COLLECTION - ADMIN ONLY
    // ============================================
    match /finances/{document=**} {
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // LOGS SYSTÈME - ADMIN ONLY
    // ============================================
    match /logs/{document=**} {
      allow read, write: if isAdminFinance();
    }

    match /systemLogs/{document=**} {
      allow read, write: if isAdminFinance();
    }

    match /auditLogs/{document=**} {
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // EVENTS COLLECTION
    // ============================================
    match /events/{eventId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                      request.resource.data.organizer_id == request.auth.uid;
      allow update: if isEventOwner(eventId) || isAdminFinance();
      allow delete: if isEventOwner(eventId) || isAdminFinance();

      match /tickets/{ticketId} {
        allow read: if true;
        allow write: if isEventOwner(eventId) || isAdminFinance();
      }

      match /scans/{scanId} {
        allow read, write: if isEventOwner(eventId) || isAdminFinance();
      }

      match /attendees/{attendeeId} {
        allow read: if isEventOwner(eventId) || isAdminFinance();
        allow create: if isAuthenticated();
        allow update, delete: if isAdminFinance();
      }
    }

    // ============================================
    // ORDERS COLLECTION (Commandes)
    // ============================================
    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
                    resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // USERS COLLECTION (Profils)
    // ============================================
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // ORGANIZERS COLLECTION
    // ============================================
    match /organizers/{organizerId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.uid == organizerId;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // PAYMENTS COLLECTION
    // ============================================
    match /payments/{paymentId} {
      allow read: if isAuthenticated() &&
                    resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // STATISTICS COLLECTION
    // ============================================
    match /statistics/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdminFinance();
    }

    // ============================================
    // CONFIGURATION SYSTÈME
    // ============================================
    match /config/{document=**} {
      allow read: if true;
      allow write: if isAdminFinance();
    }

    // ============================================
    // CATEGORIES COLLECTION
    // ============================================
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update: if isAuthenticated();
      allow delete: if isAdminFinance();
    }

    match /event_categories/{categoryId} {
      allow read: if true;
      allow create, update: if isAuthenticated();
      allow delete: if isAdminFinance();
    }

    // ============================================
    // SECURITY AGENTS COLLECTION (Contrôleurs)
    // ============================================
    match /security_agents/{agentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdminFinance();
    }

    // ============================================
    // TICKET TYPES COLLECTION
    // ============================================
    match /ticket_types/{ticketTypeId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() || isAdminFinance();
    }

    // ============================================
    // MODIFICATION REQUESTS COLLECTION
    // ============================================
    match /modification_requests/{requestId} {
      allow create: if isAuthenticated() &&
                      request.resource.data.organizer_id == request.auth.uid;
      allow read: if isAuthenticated() &&
                    resource.data.organizer_id == request.auth.uid;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // PAYOUT REQUESTS COLLECTION
    // ============================================
    match /payout_requests/{requestId} {
      allow create: if isAuthenticated() &&
                      request.resource.data.organizer_id == request.auth.uid;
      allow read: if isAuthenticated() &&
                    resource.data.organizer_id == request.auth.uid;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // BULK SALES COLLECTION
    // ============================================
    match /bulk_sales/{saleId} {
      allow read: if isAuthenticated() &&
                    resource.data.organizer_id == request.auth.uid;
      allow read, write: if isAdminFinance();
    }

    // ============================================
    // AGENT ACCESS CODES COLLECTION (EPscan)
    // ============================================
    match /agent_access_codes/{codeId} {
      allow read: if isAuthenticated();
      allow write: if isAdminFinance();
    }

    // ============================================
    // AGENT SCANS COLLECTION (EPscan)
    // ============================================
    match /agent_scans/{scanId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdminFinance();
    }

    // ============================================
    // MARITIME USERS COLLECTION (Pass)
    // ============================================
    match /maritime_users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdminFinance();
    }

    // ============================================
    // MARITIME SUBSCRIPTIONS COLLECTION (Pass)
    // ============================================
    match /maritime_subscriptions/{subId} {
      allow read: if isAuthenticated();
      allow write: if isAdminFinance();
    }

    // ============================================
    // MARITIME BOOKINGS COLLECTION (Pass)
    // ============================================
    match /maritime_bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdminFinance();
    }

    // ============================================
    // BLOCAGE PAR DÉFAUT
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🧪 ÉTAPE 3 : Vérification

Après avoir déployé les règles :

1. **Ouvrez la console de votre navigateur** (F12)
2. **Tentez de vous connecter** avec votre compte admin
3. **Observez les logs** dans la console :
   - ✅ `[FIREBASE AUTH] User data loaded: true`
   - ✅ `[FIREBASE AUTH] Admin data loaded: { exists: true }`
   - ❌ Si vous voyez `403 PERMISSION DENIED`, les règles ne sont pas encore appliquées

---

## 🔑 POINTS CLÉS

### UID Super Admin autorisé :
```
Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

### Chemins autorisés pour cet UID :
- ✅ `users/{uid}` - Lecture/Écriture
- ✅ `admins/{uid}` - Lecture/Écriture
- ✅ `organizers/{uid}` - Lecture/Écriture
- ✅ `finances/*` - Lecture/Écriture
- ✅ `logs/*` - Lecture/Écriture
- ✅ Toutes les autres collections - Accès complet

---

## ⚠️ IMPORTANT

- Ces règles DOIVENT être déployées dans la **Firebase Console** directement
- Le fichier `database.rules.json` local ne suffit PAS, il faut publier via la console
- Après modification, attendez **30 secondes** pour que les règles prennent effet
- Si l'erreur persiste, videz le cache du navigateur (Ctrl+Shift+Delete)

---

## 📞 EN CAS DE PROBLÈME

Si après avoir déployé les règles, l'erreur 403 persiste :

1. Vérifiez que l'UID dans les règles est exactement : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
2. Vérifiez que vous êtes bien connecté avec ce compte
3. Ouvrez la console et vérifiez les logs `[FIREBASE AUTH]`
4. Contactez-moi avec les logs de la console
