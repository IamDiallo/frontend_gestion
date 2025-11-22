# Analyse et Correction du Problème de Cache

## ❌ Problème Identifié

### Appels Multiples à /users/me/
Au login, l'endpoint `/core/users/me/` était appelé **5 fois** au lieu d'une seule fois.

### Cause Racine
Le `PermissionContext.tsx` contenait un **fallback** qui faisait un appel **direct** via `axios.get()` au lieu d'utiliser le service avec cache :

```typescript
// ❌ AVANT (ligne 139)
const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/core/users/me/`, {
  headers: { 'Authorization': `Bearer ${token}` },
  signal: abortSignal
});
```

Ce fallback se déclenchait si `/user_permissions/` échouait, contournant complètement le système de cache.

## ✅ Corrections Appliquées

### 1. **PermissionContext.tsx** - Fallback avec Cache
Remplacé l'appel axios direct par `AuthService.getCurrentUser()` :

```typescript
// ✅ APRÈS
try {
  console.log('⚠️ /user_permissions/ failed, trying fallback with cached getCurrentUser...');
  const userData = await AuthService.getCurrentUser(); // Utilise le cache 5 min
  
  if (userData?.permissions) {
    // Process permissions...
  }
} catch (fallbackErr) {
  console.error('Fallback fetch also failed:', fallbackErr);
}
```

### 2. **Layout.tsx** - Optimisation useEffect
```typescript
// ✅ APRÈS - Ne s'exécute qu'au mount, pas à chaque changement de userRole
useEffect(() => {
  const fetchUserInfo = async () => {
    const userData = await AuthService.getCurrentUser(); // Cache 5 min
    setCurrentUser({ /* ... */ });
  };
  fetchUserInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // ← Pas de dépendance sur userRole
```

### 3. **core.api.ts** - fetchCurrentUser avec Cache
```typescript
// ✅ Délègue à la version avec cache
import { getCurrentUser as getCachedCurrentUser } from './auth.api';

export const fetchCurrentUser = async (forceRefresh = false): Promise<User> => {
  return getCachedCurrentUser(forceRefresh); // Cache 5 min
};
```

### 4. **inventory.api.ts** - Cache Produits (3 min)
```typescript
const PRODUCTS_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

export const fetchProducts = async (forceRefresh = false): Promise<Product[]> => {
  // Check cache first...
  if (!forceRefresh && cachedData && age < PRODUCTS_CACHE_DURATION) {
    return JSON.parse(cachedData);
  }
  // Fetch and cache...
};

// Invalidation sur CRUD
export const createProduct = async (data) => {
  const response = await api.post('/inventory/products/', data);
  localStorage.removeItem(PRODUCTS_CACHE_KEY);
  localStorage.removeItem(PRODUCTS_CACHE_TIME_KEY);
  return response.data;
};
```

### 5. **core.api.ts** - Cache Zones (10 min)
```typescript
const ZONES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const fetchZones = async (forceRefresh = false): Promise<Zone[]> => {
  // Check cache first...
  if (!forceRefresh && cachedData && age < ZONES_CACHE_DURATION) {
    console.log('✅ Using cached zones');
    return JSON.parse(cachedData);
  }
  // Fetch and cache...
};

// Invalidation sur CRUD
export const createZone = async (data: Partial<Zone>): Promise<Zone> => {
  const response = await api.post('/core/zones/', data);
  localStorage.removeItem(ZONES_CACHE_KEY);
  localStorage.removeItem(ZONES_CACHE_TIME_KEY);
  return response.data;
};
```

### 6. **auth.api.ts** - Nettoyage au Logout
```typescript
export const logout = () => {
  // Clear all caches
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_permissions');
  localStorage.removeItem(USER_CACHE_KEY);
  localStorage.removeItem(USER_CACHE_TIME_KEY);
  localStorage.removeItem('zones_cache');
  localStorage.removeItem('zones_cache_time');
  localStorage.removeItem('products_cache');
  localStorage.removeItem('products_cache_time');
};
```

## 📊 Résultats Attendus

| Endpoint | Avant | Après | Gain |
|----------|-------|-------|------|
| `/users/me/` | 5x au login | 1x toutes les 5 min | **~80-90%** |
| `/user_permissions/` | 3x au login | 1x toutes les 5 min | **~66%** |
| `/zones/` | Multiple/composant | 1x toutes les 10 min | **~80%** |
| `/products/` | Multiple/composant | 1x toutes les 3 min | **~75%** |

## 🧪 Comment Tester

1. **Ouvrir DevTools** (F12)
2. **Onglet Console** - Vérifier les logs :
   - `✅ Using cached user data`
   - `✅ Using cached permissions`
   - `✅ Using cached zones`
   - `✅ Using cached products`

3. **Onglet Network** - Filtrer par :
   - `users/me` → Devrait être appelé **1 seule fois**
   - `user_permissions` → Devrait être appelé **1 seule fois**
   - `zones` → Devrait être appelé **1 seule fois**

4. **Test de Navigation** :
   - Se connecter
   - Naviguer entre Dashboard → Inventory → Sales → Products
   - Vérifier que les appels API ne se répètent pas

5. **Test de Durée de Cache** :
   - Attendre 5 minutes
   - Naviguer vers un nouveau composant
   - Vérifier qu'un nouvel appel est fait (cache expiré)

## 🎯 Architecture du Cache

```
┌─────────────────────────────────────────────┐
│         APPLICATION STARTUP                 │
├─────────────────────────────────────────────┤
│                                             │
│  PermissionContext (mount)                  │
│    ↓                                        │
│  GET /user_permissions/  ← Cache 5min       │
│    ↓ (fallback si erreur)                   │
│  AuthService.getCurrentUser()  ← Cache 5min │
│                                             │
│  Layout (mount)                             │
│    ↓                                        │
│  AuthService.getCurrentUser()  ← HIT CACHE  │
│                                             │
│  Components (Inventory, Sales, etc.)        │
│    ↓                                        │
│  fetchZones()  ← Cache 10min                │
│  fetchProducts()  ← Cache 3min              │
│                                             │
└─────────────────────────────────────────────┘
```

## 🔄 Invalidation du Cache

### Automatique (au logout)
Tous les caches sont effacés lors du logout

### Sur Mutation
- **Produits** : Invalidé sur create/update/delete
- **Zones** : Invalidé sur create/update/delete

### Expiration
- **User data** : 5 minutes
- **Permissions** : 5 minutes
- **Produits** : 3 minutes (changent fréquemment)
- **Zones** : 10 minutes (changent rarement)

## ✅ Avantages

1. **Performance** : Réduction de 75-90% des appels API
2. **AWS EC2** : Moins de charge sur le serveur
3. **UX** : Navigation plus fluide
4. **Cohérence** : Tous les appels utilisent le même système de cache
5. **Maintenance** : Cache centralisé dans les services API

