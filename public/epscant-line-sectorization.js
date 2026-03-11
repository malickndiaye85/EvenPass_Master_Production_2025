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

    // Importer les fonctions Firebase (READ-ONLY: Scanner ne doit JAMAIS écrire)
    const { ref: dbRef, get: rtdbGet } = window.firebaseDatabase;
    const { doc, getDoc } = window.firebaseFirestore;

    let vehicleId = null;
    let vehiclePlate = null;
    let accessData = null;

    try {
        if (!firestore) {
            console.error('[SECTORISATION] ❌ Firestore non initialisé');
            throw new Error('Firestore non disponible');
        }

        const firestorePath = `access_codes/${codeStr}`;
        console.log('[SECTORISATION] 🔍 Recherche dans Firestore...');
        console.log('[SECTORISATION] 📍 Chemin Firestore:', firestorePath);
        console.log('[SECTORISATION] 📍 Collection: access_codes');
        console.log('[SECTORISATION] 📍 Document ID:', codeStr);

        const accessCodeRef = doc(firestore, 'access_codes', codeStr);
        console.log('[SECTORISATION] 🔧 Tentative getDoc()...');
        const accessCodeSnap = await getDoc(accessCodeRef);
        console.log('[SECTORISATION] 📥 Réponse Firestore reçue, exists():', accessCodeSnap.exists());

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
        console.error('[SECTORISATION] 📋 Détails erreur Firestore:', {
            code: firestoreError.code,
            message: firestoreError.message,
            name: firestoreError.name
        });
    }

    if (!vehicleId && rtdb) {
        const fallbackPath = `fleet_indices/codes/${codeStr}`;
        console.log('[SECTORISATION] 🔄 FALLBACK: Recherche dans Realtime Database...');
        console.log('[SECTORISATION] 📍 Chemin exact:', fallbackPath);
        console.log('[SECTORISATION] 📍 Code normalisé:', codeStr);
        try {
            const { ref: dbRef, get: rtdbGet } = window.firebaseDatabase;
            console.log('[SECTORISATION] 🔧 Création référence Firebase...');
            const indexRef = dbRef(rtdb, fallbackPath);
            console.log('[SECTORISATION] 🔧 Référence créée:', indexRef.toString());
            console.log('[SECTORISATION] 🔍 Tentative de lecture...');
            const indexSnap = await rtdbGet(indexRef);
            console.log('[SECTORISATION] 📥 Réponse reçue, exists():', indexSnap.exists());

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
            console.error('[SECTORISATION] 📋 Détails erreur:', {
                code: rtdbError.code,
                message: rtdbError.message,
                path: fallbackPath
            });
            if (rtdbError.code === 'PERMISSION_DENIED') {
                console.error('[SECTORISATION] 🔒 PERMISSION DENIED sur:', fallbackPath);
                console.error('[SECTORISATION] 💡 Vérifiez les règles Realtime Database pour ce chemin');
            }
            return { success: false, error: 'Code d\'accès invalide' };
        }
    }

    if (!vehicleId) {
        console.error('[SECTORISATION] ❌ Impossible de valider le code');
        return { success: false, error: 'Code d\'accès invalide' };
    }

    try {
        // 2. RÉCUPÉRER LE VÉHICULE ET SA LIGNE DANS FIREBASE REALTIME DATABASE
        const vehicleRef = dbRef(rtdb, `ops/transport/vehicles/${vehicleId}`);
        const vehicleSnap = await rtdbGet(vehicleRef);

        if (!vehicleSnap.exists()) {
            console.error('[SECTORISATION] ❌ Véhicule non trouvé dans ops/transport/vehicles');
            return { success: false, error: 'Véhicule non trouvé' };
        }

        const vehicleData = vehicleSnap.val();
        const lineId = vehicleData.line_id || vehicleData.lineId;

        let session;

        if (!lineId) {
            console.warn('[SECTORISATION] ⚠️ Véhicule non assigné à une ligne');
            console.log('[SECTORISATION] 🌐 Mode "Toutes Lignes" activé (véhicule de test)');

            // MODE "TOUTES LIGNES" - Véhicules de test sans ligne assignée
            session = {
                lineId: 'all_lines',
                lineName: 'Toutes Lignes (Mode Test)',
                lineRoute: 'Non sectorisé',
                vehicleId,
                vehiclePlate,
                accessCode,
                controllerName: accessData.staffName || 'Contrôleur',
                sessionStarted: Date.now(),
                testMode: true
            };

            console.log('[SECTORISATION] ✅ Session "Toutes Lignes" établie (test)');
        } else {
            console.log('[SECTORISATION] 🚍 Véhicule assigné à la ligne:', lineId);

            // 3. CHERCHER LA LIGNE DANS transport_lines (Source: /voyage/express)
            console.log('[SECTORISATION] 🔍 Recherche dans transport_lines (créées via /admin/transversal)...');

            let lineData = null;
            let lineKey = null;

            // D'abord essayer de récupérer par ID direct
            const directLineRef = dbRef(rtdb, `transport_lines/${lineId}`);
            const directLineSnap = await rtdbGet(directLineRef);

            if (directLineSnap.exists()) {
                // Ligne trouvée avec l'ID exact
                lineData = directLineSnap.val();
                lineKey = lineId;
                console.log('[SECTORISATION] ✅ Ligne trouvée par ID Firebase:', lineKey);
            } else {
                // Si pas trouvé par ID, chercher par nom/route
                console.log('[SECTORISATION] 📋 Ligne non trouvée par ID, scan par nom...');
                console.log('[SECTORISATION] 🔍 Nom recherché:', lineId);

                const allLinesRef = dbRef(rtdb, 'transport_lines');
                const allLinesSnap = await rtdbGet(allLinesRef);

                if (allLinesSnap.exists()) {
                    const allLines = allLinesSnap.val();

                    // Chercher la ligne dont le name ou route correspond
                    for (const [key, line] of Object.entries(allLines)) {
                        // Comparaison exacte du nom complet
                        if (line.name === lineId || line.route === lineId) {
                            lineData = line;
                            lineKey = key;
                            console.log('[SECTORISATION] ✅ Ligne trouvée par nom/route');
                            console.log('[SECTORISATION] 🆔 ID Firebase réel:', lineKey);
                            console.log('[SECTORISATION] 📛 Nom ligne:', line.name);
                            break;
                        }
                    }
                }
            }

            // Si ligne toujours non trouvée - ERREUR (pas d'auto-création)
            if (!lineData || !lineKey) {
                console.error('[SECTORISATION] ❌ Ligne non trouvée dans transport_lines');
                console.error('[SECTORISATION] 📋 Nom/ID recherché:', lineId);
                console.error('[SECTORISATION] 💡 Action requise: Créer la ligne dans /admin/transversal');
                console.error('[SECTORISATION] 💡 Source données: /voyage/express');
                return {
                    success: false,
                    error: `Erreur : La ligne "${lineId}" n'est pas configurée dans Voyage Express`
                };
            }

            // Vérifier que la ligne est active
            if (!lineData.is_active) {
                console.error('[SECTORISATION] ❌ Ligne désactivée');
                return { success: false, error: 'Ligne désactivée' };
            }

            const lineName = lineData.name || lineId;
            const lineRoute = lineData.route || lineId;

            console.log('[SECTORISATION] ✅ Ligne active:', lineName);
            console.log('[SECTORISATION] 📍 Trajet:', lineRoute);
            console.log('[SECTORISATION] 🆔 ID Firebase pour validation QR:', lineKey);
            console.log('[SECTORISATION] 💡 Les SAMA PASS doivent avoir routeId === "' + lineKey + '"');

            // 4. CRÉER LA SESSION DE LIGNE
            session = {
                lineId: lineKey, // ✅ ID FIREBASE RÉEL pour matcher routeId des SAMA PASS
                lineName,
                lineRoute,
                vehicleId,
                vehiclePlate,
                accessCode,
                controllerName: accessData.staffName || 'Contrôleur',
                sessionStarted: Date.now()
            };
        }

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
        const subscriberRouteId = subscription.routeId || '';
        const subscriberRouteName = subscription.routeName || '';

        console.log('[SECTORISATION] 📋 Ligne abonné:', subscriberRouteName);
        console.log('[SECTORISATION] 📋 Route ID abonné:', subscriberRouteId);
        console.log('[SECTORISATION] 📋 Ligne contrôleur:', session.lineName);
        console.log('[SECTORISATION] 📋 Line ID contrôleur:', session.lineId);

        // MODE TEST : Accepter toutes les lignes
        const isTestMode = session.testMode || session.lineId === 'all_lines';
        if (isTestMode) {
            console.log('[SECTORISATION] 🧪 MODE TEST - Toutes lignes acceptées');
            await incrementLineStats(session.lineId, session.vehicleId, rtdb);
            return {
                isValid: true,
                isAuthorized: true,
                message: 'VALIDE (MODE TEST)',
                shouldDisplay: true,
                subscription,
                lineInfo: {
                    subscriberLine: subscriberRouteName,
                    controllerLine: session.lineName
                }
            };
        }

        // MODE PRODUCTION : VALIDATION INTELLIGENTE MULTI-NIVEAUX
        console.log('[SECTORISATION] 🔐 VALIDATION INTELLIGENTE:');
        console.log('[SECTORISATION]    Pass routeId:', subscriberRouteId);
        console.log('[SECTORISATION]    Scanner lineId:', session.lineId);

        // FONCTION DE NORMALISATION POUR COMPARAISON
        function normalizeForComparison(str) {
            if (!str) return '';
            return str
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
                .replace(/[^a-z0-9]/g, '_') // Remplacer caractères spéciaux par _
                .replace(/_+/g, '_') // Remplacer multiples _ par un seul
                .replace(/^_|_$/g, ''); // Enlever _ au début/fin
        }

        // FONCTION D'EXTRACTION DU TERME PRINCIPAL (ex: "Ligne C")
        function extractMainTerm(str) {
            if (!str) return '';
            // Chercher "Ligne X" ou "ligne X"
            const ligneMatch = str.match(/ligne\s+([a-z0-9]+)/i);
            if (ligneMatch) return ligneMatch[1].toLowerCase();

            // Chercher premier mot significatif
            const words = str.split(/[\s\-⇄]+/).filter(w => w.length > 2);
            return words[0] ? words[0].toLowerCase() : '';
        }

        let isLineMatch = false;
        let matchMethod = '';

        // NIVEAU 1 : Comparaison stricte des IDs Firebase
        if (subscriberRouteId && session.lineId && subscriberRouteId === session.lineId) {
            isLineMatch = true;
            matchMethod = 'ID exact Firebase';
            console.log('[SECTORISATION] ✅ NIVEAU 1 : Match ID exact');
        }
        // NIVEAU 2 : Comparaison normalisée des IDs
        else if (subscriberRouteId && session.lineId) {
            const normalizedSubscriberId = normalizeForComparison(subscriberRouteId);
            const normalizedSessionId = normalizeForComparison(session.lineId);

            if (normalizedSubscriberId === normalizedSessionId) {
                isLineMatch = true;
                matchMethod = 'ID normalisé';
                console.log('[SECTORISATION] ✅ NIVEAU 2 : Match ID normalisé');
                console.log('[SECTORISATION]    Normalisé abonné:', normalizedSubscriberId);
                console.log('[SECTORISATION]    Normalisé scanner:', normalizedSessionId);
            }
            // NIVEAU 3 : L'un contient l'autre (partial match)
            else if (normalizedSubscriberId.includes(normalizedSessionId) || normalizedSessionId.includes(normalizedSubscriberId)) {
                isLineMatch = true;
                matchMethod = 'ID partiel';
                console.log('[SECTORISATION] ✅ NIVEAU 3 : Match ID partiel');
            }
        }

        // NIVEAU 4 : Comparaison par noms de lignes
        if (!isLineMatch && subscriberRouteName && session.lineName) {
            const normalizedSubscriberName = normalizeForComparison(subscriberRouteName);
            const normalizedSessionName = normalizeForComparison(session.lineName);

            if (normalizedSubscriberName === normalizedSessionName) {
                isLineMatch = true;
                matchMethod = 'Nom normalisé';
                console.log('[SECTORISATION] ✅ NIVEAU 4 : Match nom normalisé');
            }
            // NIVEAU 5 : Partial match sur les noms
            else if (normalizedSubscriberName.includes(normalizedSessionName) || normalizedSessionName.includes(normalizedSubscriberName)) {
                isLineMatch = true;
                matchMethod = 'Nom partiel';
                console.log('[SECTORISATION] ✅ NIVEAU 5 : Match nom partiel');
            }
        }

        // NIVEAU 6 : Extraction du terme principal (ex: "Ligne C")
        if (!isLineMatch) {
            const subscriberMainTerm = extractMainTerm(subscriberRouteName || subscriberRouteId);
            const sessionMainTerm = extractMainTerm(session.lineName || session.lineId);

            if (subscriberMainTerm && sessionMainTerm && subscriberMainTerm === sessionMainTerm) {
                isLineMatch = true;
                matchMethod = 'Terme principal';
                console.log('[SECTORISATION] ✅ NIVEAU 6 : Match terme principal');
                console.log('[SECTORISATION]    Terme abonné:', subscriberMainTerm);
                console.log('[SECTORISATION]    Terme scanner:', sessionMainTerm);
            }
        }

        if (!isLineMatch) {
            console.warn('[SECTORISATION] ⚠️ LIGNE NON AUTORISÉE - Aucun match trouvé');
            console.warn('[SECTORISATION] ⚠️ Pass valide pour:', subscriberRouteName, '(ID:', subscriberRouteId + ')');
            console.warn('[SECTORISATION] ⚠️ Scanner sur:', session.lineName, '(ID:', session.lineId + ')');

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

        console.log('[SECTORISATION] ✅ VALIDATION RÉUSSIE - Méthode:', matchMethod);
        console.log('[SECTORISATION] ✅ Pass autorisé sur cette ligne');

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
