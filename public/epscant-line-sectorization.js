/**
 * EPscanT - Service de Sectorisation par Code d'Accès
 * Lie Code d'Accès → Véhicule → Ligne → Stats
 */

const SESSION_KEY = 'epscant_line_session';

/**
 * Authentifie un contrôleur avec son code d'accès et établit la ligne active
 */
async function authenticateWithAccessCode(accessCode, firestore, rtdb) {
    const codeStr = String(accessCode).trim();
    console.log('[SECTORISATION] 🔐 Authentification avec code:', codeStr);

    let vehicleId = null;
    let vehiclePlate = null;
    let accessData = null;

    try {
        if (!firestore) {
            console.error('[SECTORISATION] ❌ Firestore non initialisé');
            throw new Error('Firestore non disponible');
        }

        console.log('[SECTORISATION] 🔍 Recherche dans Firestore access_codes...');

        const { doc: fsDoc, getDoc: fsGetDoc } = window.firebaseFirestore;
        const accessCodeRef = fsDoc(firestore, 'access_codes', codeStr);
        const accessCodeSnap = await fsGetDoc(accessCodeRef);

        if (accessCodeSnap.exists()) {
            accessData = accessCodeSnap.data();
            console.log('[SECTORISATION] ✅ Code trouvé dans Firestore:', accessData);

            if (!accessData.isActive) {
                console.error('[SECTORISATION] ❌ Code d\'accès désactivé');
                return { success: false, error: 'Code d\'accès désactivé' };
            }

            if (accessData.type !== 'vehicle') {
                console.error('[SECTORISATION] ❌ Ce code n\'est pas lié à un véhicule');
                return { success: false, error: 'Ce code n\'est pas un code véhicule' };
            }

            vehicleId = accessData.vehicleId;
            vehiclePlate = accessData.vehiclePlate;

            console.log('[SECTORISATION] ✅ Code valide pour véhicule:', vehiclePlate);
        } else {
            console.warn('[SECTORISATION] ⚠️ Code non trouvé dans Firestore, tentative fallback Realtime DB...');
        }
    } catch (firestoreError) {
        console.error('[SECTORISATION] ❌ Erreur Firestore (tentative fallback):', firestoreError);
    }

    if (!vehicleId && rtdb) {
        console.log('[SECTORISATION] 🔄 FALLBACK: Recherche dans Realtime Database...');
        try {
            const { ref: dbRef, get: rtdbGet } = window.firebaseDatabase;
            const indexRef = dbRef(rtdb, `fleet_indices/codes/${codeStr}`);
            const indexSnap = await rtdbGet(indexRef);

            if (indexSnap.exists()) {
                const indexData = indexSnap.val();
                console.log('[SECTORISATION] ✅ Code trouvé dans fleet_indices:', indexData);

                if (!indexData.isActive) {
                    console.error('[SECTORISATION] ❌ Code désactivé');
                    return { success: false, error: 'Code d\'accès désactivé' };
                }

                vehicleId = indexData.vehicleId;
                vehiclePlate = indexData.vehiclePlate || 'N/A';

                accessData = {
                    vehicleId,
                    vehiclePlate,
                    staffName: `Véhicule ${vehiclePlate}`,
                    isActive: true,
                    type: 'vehicle'
                };

                console.log('[SECTORISATION] ✅ FALLBACK réussi - Code valide pour véhicule:', vehiclePlate);
            } else {
                console.error('[SECTORISATION] ❌ Code invalide (absent de Firestore et Realtime DB)');
                return { success: false, error: 'Code d\'accès invalide' };
            }
        } catch (rtdbError) {
            console.error('[SECTORISATION] ❌ Erreur fallback Realtime DB:', rtdbError);
            return { success: false, error: 'Code d\'accès invalide' };
        }
    }

    if (!vehicleId) {
        console.error('[SECTORISATION] ❌ Impossible de valider le code');
        return { success: false, error: 'Code d\'accès invalide' };
    }

        // 2. RÉCUPÉRER LE VÉHICULE ET SA LIGNE DANS FIREBASE REALTIME DATABASE
        const { ref: dbRef, get: rtdbGet } = window.firebaseDatabase;
        const vehicleRef = dbRef(rtdb, `ops/transport/vehicles/${vehicleId}`);
        const vehicleSnap = await rtdbGet(vehicleRef);

        if (!vehicleSnap.exists()) {
            console.error('[SECTORISATION] ❌ Véhicule non trouvé dans ops/transport/vehicles');
            return { success: false, error: 'Véhicule non trouvé' };
        }

        const vehicleData = vehicleSnap.val();
        const lineId = vehicleData.line_id || vehicleData.lineId;

        if (!lineId) {
            console.error('[SECTORISATION] ❌ Véhicule non assigné à une ligne');
            return { success: false, error: 'Véhicule non assigné à une ligne' };
        }

        console.log('[SECTORISATION] 🚍 Véhicule assigné à la ligne:', lineId);

        // 3. RÉCUPÉRER LES INFOS DE LA LIGNE
        const lineRef = dbRef(rtdb, `transport_lines/${lineId}`);
        const lineSnap = await rtdbGet(lineRef);

        if (!lineSnap.exists()) {
            console.error('[SECTORISATION] ❌ Ligne non trouvée dans transport_lines');
            return { success: false, error: 'Ligne non trouvée' };
        }

        const lineData = lineSnap.val();

        if (!lineData.is_active) {
            console.error('[SECTORISATION] ❌ Ligne désactivée');
            return { success: false, error: 'Ligne désactivée' };
        }

        const lineName = lineData.name;
        const lineRoute = lineData.route;

        console.log('[SECTORISATION] ✅ Ligne active:', lineName);
        console.log('[SECTORISATION] 📍 Trajet:', lineRoute);

        // 4. CRÉER LA SESSION DE LIGNE
        const session = {
            lineId,
            lineName,
            lineRoute,
            vehicleId,
            vehiclePlate,
            accessCode,
            controllerName: accessData.staffName || 'Contrôleur',
            sessionStarted: Date.now()
        };

        // 5. STOCKER LA SESSION LOCALEMENT
        saveLineSession(session);

        console.log('[SECTORISATION] ✅ Session établie:', session);

        return { success: true, session };
    } catch (error) {
        console.error('[SECTORISATION] ❌ Erreur lors de l\'authentification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Valide si un abonnement SAMA PASS est autorisé sur la ligne active
 */
async function validateSubscriptionForLine(subscription, rtdb) {
    const session = getLineSession();

    if (!session) {
        console.error('[SECTORISATION] ❌ Aucune session active');
        return {
            isValid: false,
            isAuthorized: false,
            message: 'AUCUNE SESSION ACTIVE',
            shouldDisplay: false
        };
    }

    console.log('[SECTORISATION] 🔍 Validation abonnement');
    console.log('[SECTORISATION] 📍 Ligne active:', session.lineName);
    console.log('[SECTORISATION] 📍 Route ID contrôleur:', session.lineId);

    try {
        // VÉRIFIER LA VALIDITÉ DE L'ABONNEMENT
        const now = Date.now();
        const expiresAt = subscription.expiresAt || subscription.endDate;

        if (subscription.status !== 'active') {
            return {
                isValid: false,
                isAuthorized: false,
                message: 'ABONNEMENT INACTIF',
                shouldDisplay: true,
                subscription
            };
        }

        if (expiresAt < now) {
            return {
                isValid: false,
                isAuthorized: false,
                message: 'ABONNEMENT EXPIRÉ',
                shouldDisplay: true,
                subscription
            };
        }

        // VÉRIFIER LA SECTORISATION PAR LIGNE
        const subscriberRouteId = subscription.routeId;
        const subscriberRouteName = subscription.routeName;

        console.log('[SECTORISATION] 📋 Ligne abonné:', subscriberRouteName);
        console.log('[SECTORISATION] 📋 Route ID abonné:', subscriberRouteId);
        console.log('[SECTORISATION] 📋 Ligne contrôleur:', session.lineName);
        console.log('[SECTORISATION] 📋 Line ID contrôleur:', session.lineId);

        // COMPARAISON STRICTE : L'ID de la ligne doit correspondre
        const isLineMatch = subscriberRouteId === session.lineId;

        if (!isLineMatch) {
            console.warn('[SECTORISATION] ⚠️ Ligne non autorisée');
            console.warn('[SECTORISATION] ⚠️ Abonné sur:', subscriberRouteName);
            console.warn('[SECTORISATION] ⚠️ Contrôleur sur:', session.lineName);

            return {
                isValid: true,
                isAuthorized: false,
                message: `LIGNE NON AUTORISÉE`,
                details: `Ce pass est valide uniquement pour la ligne ${subscriberRouteName}`,
                shouldDisplay: true,
                subscription,
                lineInfo: {
                    subscriberLine: subscriberRouteName,
                    controllerLine: session.lineName
                }
            };
        }

        // VALIDATION RÉUSSIE - INCRÉMENTER LES STATS
        console.log('[SECTORISATION] ✅ Ligne autorisée - Mise à jour des stats');
        await incrementLineStats(session.lineId, session.vehicleId, rtdb);

        return {
            isValid: true,
            isAuthorized: true,
            message: 'VALIDE',
            shouldDisplay: true,
            subscription,
            lineInfo: {
                subscriberLine: subscriberRouteName,
                controllerLine: session.lineName
            }
        };
    } catch (error) {
        console.error('[SECTORISATION] ❌ Erreur validation:', error);
        return {
            isValid: false,
            isAuthorized: false,
            message: 'ERREUR DE VALIDATION',
            shouldDisplay: true,
            subscription
        };
    }
}

/**
 * Incrémente les statistiques de la ligne et du véhicule
 */
async function incrementLineStats(lineId, vehicleId, rtdb) {
    console.log('[SECTORISATION] 📊 Mise à jour stats ligne:', lineId);

    try {
        const { ref: dbRef, get: rtdbGet, update } = window.firebaseDatabase;
        const today = new Date().toISOString().split('T')[0];

        // 1. INCRÉMENTER LES STATS DE LA LIGNE
        const lineStatsRef = dbRef(rtdb, `ops/transport/lines/${lineId}/stats`);
        const lineStatsSnap = await rtdbGet(lineStatsRef);

        const currentLineStats = lineStatsSnap.exists() ? lineStatsSnap.val() : {};
        const scansToday = (currentLineStats.scans_today || 0) + 1;
        const totalScans = (currentLineStats.total_scans || 0) + 1;

        await update(lineStatsRef, {
            scans_today: scansToday,
            total_scans: totalScans,
            last_scan: Date.now(),
            last_scan_date: today
        });

        console.log('[SECTORISATION] ✅ Stats ligne mises à jour:', { scansToday, totalScans });

        // 2. INCRÉMENTER LES STATS DU VÉHICULE
        const vehicleStatsRef = dbRef(rtdb, `ops/transport/vehicles/${vehicleId}/stats`);
        const vehicleStatsSnap = await rtdbGet(vehicleStatsRef);

        const currentVehicleStats = vehicleStatsSnap.exists() ? vehicleStatsSnap.val() : {};
        const vehicleScansToday = (currentVehicleStats.scans_today || 0) + 1;
        const vehicleTotalScans = (currentVehicleStats.total_scans || 0) + 1;

        await update(vehicleStatsRef, {
            scans_today: vehicleScansToday,
            total_scans: vehicleTotalScans,
            last_scan: Date.now(),
            last_scan_date: today
        });

        console.log('[SECTORISATION] ✅ Stats véhicule mises à jour:', { vehicleScansToday, vehicleTotalScans });

        // 3. CALCULER LE TAUX D'OCCUPATION (estimation)
        const capacity = 50; // Capacité par défaut
        const occupancyRate = Math.min(100, Math.round((vehicleScansToday / capacity) * 100));

        await update(vehicleStatsRef, {
            occupancy_rate: occupancyRate
        });

        console.log('[SECTORISATION] 📊 Taux d\'occupation:', occupancyRate + '%');
    } catch (error) {
        console.error('[SECTORISATION] ❌ Erreur mise à jour stats:', error);
    }
}

/**
 * Sauvegarde la session dans localStorage
 */
function saveLineSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log('[SECTORISATION] 💾 Session sauvegardée localement');
}

/**
 * Récupère la session active
 */
function getLineSession() {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
        return null;
    }

    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
}

/**
 * Efface la session
 */
function clearLineSession() {
    localStorage.removeItem(SESSION_KEY);
    console.log('[SECTORISATION] 🗑️ Session effacée');
}

/**
 * Vérifie si une session est active
 */
function hasActiveLineSession() {
    return getLineSession() !== null;
}

// Export pour utilisation dans epscant-transport.html
window.LineSectorization = {
    authenticateWithAccessCode,
    validateSubscriptionForLine,
    incrementLineStats,
    saveLineSession,
    getLineSession,
    clearLineSession,
    hasActiveLineSession
};

console.log('[SECTORISATION] ✅ Module de sectorisation chargé');
