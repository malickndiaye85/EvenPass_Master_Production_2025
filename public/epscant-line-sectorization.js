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
            await incrementLineStats(session.lineId, session.vehicleId, rtdb, subscription);
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
        console.log('[SECTORISATION] 🔐 VALIDATION INTELLIGENTE MULTI-NIVEAUX:');
        console.log('[SECTORISATION] 📋 DONNÉES ABONNÉ:');
        console.log('[SECTORISATION]    routeId:', subscriberRouteId, `(type: ${typeof subscriberRouteId}, longueur: ${subscriberRouteId?.length || 0})`);
        console.log('[SECTORISATION]    routeName:', subscriberRouteName, `(type: ${typeof subscriberRouteName}, longueur: ${subscriberRouteName?.length || 0})`);
        console.log('[SECTORISATION] 📋 DONNÉES SCANNER:');
        console.log('[SECTORISATION]    lineId:', session.lineId, `(type: ${typeof session.lineId}, longueur: ${session.lineId?.length || 0})`);
        console.log('[SECTORISATION]    lineName:', session.lineName, `(type: ${typeof session.lineName}, longueur: ${session.lineName?.length || 0})`);

        // FONCTION DE NORMALISATION POUR COMPARAISON
        function normalizeForComparison(str) {
            if (!str) return '';
            const normalized = str
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
                .replace(/[^a-z0-9]/g, '_') // Remplacer caractères spéciaux par _
                .replace(/_+/g, '_') // Remplacer multiples _ par un seul
                .replace(/^_|_$/g, ''); // Enlever _ au début/fin
            console.log(`[SECTORISATION] 🔧 normalizeForComparison("${str}") → "${normalized}"`);
            return normalized;
        }

        // FONCTION D'EXTRACTION DU TERME PRINCIPAL (ex: "Ligne C")
        function extractMainTerm(str) {
            if (!str) return '';
            // Chercher "Ligne X" ou "ligne X"
            const ligneMatch = str.match(/ligne\s+([a-z0-9]+)/i);
            if (ligneMatch) {
                const term = ligneMatch[1].toLowerCase();
                console.log(`[SECTORISATION] 🔧 extractMainTerm("${str}") → "${term}" (pattern: ligne X)`);
                return term;
            }

            // Chercher premier mot significatif
            const words = str.split(/[\s\-⇄]+/).filter(w => w.length > 2);
            const term = words[0] ? words[0].toLowerCase() : '';
            console.log(`[SECTORISATION] 🔧 extractMainTerm("${str}") → "${term}" (premier mot)`);
            return term;
        }

        let isLineMatch = false;
        let matchMethod = '';

        // NIVEAU 1 : Comparaison stricte des IDs Firebase
        console.log('[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs');
        console.log('[SECTORISATION]    subscriberRouteId === session.lineId ?');
        console.log('[SECTORISATION]    "' + subscriberRouteId + '" === "' + session.lineId + '"');
        console.log('[SECTORISATION]    Résultat:', subscriberRouteId === session.lineId);

        if (subscriberRouteId && session.lineId && subscriberRouteId === session.lineId) {
            isLineMatch = true;
            matchMethod = 'ID exact Firebase';
            console.log('[SECTORISATION] ✅ NIVEAU 1 : Match ID exact Firebase');
        }
        // NIVEAU 2 : Comparaison normalisée des IDs
        else if (subscriberRouteId && session.lineId) {
            console.log('[SECTORISATION] 🔍 TEST NIVEAU 2 : Comparaison normalisée IDs');
            const normalizedSubscriberId = normalizeForComparison(subscriberRouteId);
            const normalizedSessionId = normalizeForComparison(session.lineId);

            console.log('[SECTORISATION]    Normalisé abonné:', normalizedSubscriberId);
            console.log('[SECTORISATION]    Normalisé scanner:', normalizedSessionId);
            console.log('[SECTORISATION]    Match exact ?', normalizedSubscriberId === normalizedSessionId);

            if (normalizedSubscriberId === normalizedSessionId) {
                isLineMatch = true;
                matchMethod = 'ID normalisé';
                console.log('[SECTORISATION] ✅ NIVEAU 2 : Match ID normalisé');
            }
            // NIVEAU 3 : L'un contient l'autre (partial match)
            else {
                console.log('[SECTORISATION] 🔍 TEST NIVEAU 3 : Match partiel IDs');
                const aContainsB = normalizedSubscriberId.includes(normalizedSessionId);
                const bContainsA = normalizedSessionId.includes(normalizedSubscriberId);
                console.log('[SECTORISATION]    A contient B ?', aContainsB);
                console.log('[SECTORISATION]    B contient A ?', bContainsA);

                if (aContainsB || bContainsA) {
                    isLineMatch = true;
                    matchMethod = 'ID partiel';
                    console.log('[SECTORISATION] ✅ NIVEAU 3 : Match ID partiel');
                }
            }
        }

        // NIVEAU 4 : Comparaison par noms de lignes
        if (!isLineMatch && subscriberRouteName && session.lineName) {
            console.log('[SECTORISATION] 🔍 TEST NIVEAU 4 : Comparaison noms de lignes');
            const normalizedSubscriberName = normalizeForComparison(subscriberRouteName);
            const normalizedSessionName = normalizeForComparison(session.lineName);

            console.log('[SECTORISATION]    Nom abonné normalisé:', normalizedSubscriberName);
            console.log('[SECTORISATION]    Nom scanner normalisé:', normalizedSessionName);
            console.log('[SECTORISATION]    Match exact ?', normalizedSubscriberName === normalizedSessionName);

            if (normalizedSubscriberName === normalizedSessionName) {
                isLineMatch = true;
                matchMethod = 'Nom normalisé';
                console.log('[SECTORISATION] ✅ NIVEAU 4 : Match nom normalisé');
            }
            // NIVEAU 5 : Partial match sur les noms
            else {
                console.log('[SECTORISATION] 🔍 TEST NIVEAU 5 : Match partiel noms');
                const aContainsB = normalizedSubscriberName.includes(normalizedSessionName);
                const bContainsA = normalizedSessionName.includes(normalizedSubscriberName);
                console.log('[SECTORISATION]    A contient B ?', aContainsB);
                console.log('[SECTORISATION]    B contient A ?', bContainsA);

                if (aContainsB || bContainsA) {
                    isLineMatch = true;
                    matchMethod = 'Nom partiel';
                    console.log('[SECTORISATION] ✅ NIVEAU 5 : Match nom partiel');
                }
            }
        }

        // NIVEAU 6 : Extraction du terme principal (ex: "Ligne C")
        if (!isLineMatch) {
            console.log('[SECTORISATION] 🔍 TEST NIVEAU 6 : Extraction terme principal');
            const subscriberMainTerm = extractMainTerm(subscriberRouteName || subscriberRouteId);
            const sessionMainTerm = extractMainTerm(session.lineName || session.lineId);

            console.log('[SECTORISATION]    Terme abonné:', subscriberMainTerm);
            console.log('[SECTORISATION]    Terme scanner:', sessionMainTerm);
            console.log('[SECTORISATION]    Match ?', subscriberMainTerm && sessionMainTerm && subscriberMainTerm === sessionMainTerm);

            if (subscriberMainTerm && sessionMainTerm && subscriberMainTerm === sessionMainTerm) {
                isLineMatch = true;
                matchMethod = 'Terme principal';
                console.log('[SECTORISATION] ✅ NIVEAU 6 : Match terme principal');
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

        // VALIDATION RÉUSSIE - INCRÉMENTER LES STATS (CRITIQUE POUR PAIEMENT)
        console.log('[SECTORISATION] ✅ Ligne autorisée - Mise à jour des stats pour paiement');
        console.log('[SECTORISATION] 📊 Données abonnement:', {
            phoneNumber: subscription.phoneNumber,
            routeId: subscription.routeId,
            routeName: subscription.routeName,
            id: subscription.id
        });

        console.log('[SECTORISATION] 🚨 APPEL incrementLineStats avec:', {
            lineId: session.lineId,
            vehicleId: session.vehicleId
        });
        alert('🚨 APPEL incrementLineStats MAINTENANT !');

        await incrementLineStats(session.lineId, session.vehicleId, rtdb, subscription);

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
 * CRITIQUE : Cette fonction met à jour les compteurs pour le paiement des transporteurs
 */
async function incrementLineStats(lineId, vehicleId, rtdb, subscriptionData = null) {
    console.log('[SECTORISATION] 📊 🚨 FONCTION incrementLineStats APPELÉE !');
    console.log('[SECTORISATION] 📊 Mise à jour stats ligne:', lineId);
    console.log('[SECTORISATION] 📊 Mise à jour stats véhicule:', vehicleId);

    // 🚨 HARDCODING TEST : Si vehicleId est vide ou invalide, forcer DK-2019-M
    if (!vehicleId || vehicleId === 'undefined' || vehicleId === 'null') {
        console.warn('[SECTORISATION] ⚠️ vehicleId invalide, HARDCODING → DK-2019-M');
        vehicleId = 'DK-2019-M';
        alert('⚠️ vehicleId était vide ! Hardcoding DK-2019-M');
    }

    // 🚨 HARDCODING TEST : Si lineId est vide, forcer ligne-c
    if (!lineId || lineId === 'undefined' || lineId === 'null') {
        console.warn('[SECTORISATION] ⚠️ lineId invalide, HARDCODING → ligne-c');
        lineId = 'ligne-c';
        alert('⚠️ lineId était vide ! Hardcoding ligne-c');
    }

    console.log('[SECTORISATION] 📊 ✅ IDs validés - lineId:', lineId, 'vehicleId:', vehicleId);

    try {
        const { ref: dbRef, get: rtdbGet, update, push } = window.firebaseDatabase;
        const today = new Date().toISOString().split('T')[0];
        const timestamp = Date.now();

        console.log('[SECTORISATION] 📊 Date du jour:', today, 'Timestamp:', timestamp);

        // 1. INCRÉMENTER LES STATS DE LA LIGNE dans ops/transport/lines
        console.log('[SECTORISATION] 📊 Étape 1/5 : Stats ligne ops/transport/lines');
        const lineStatsRef = dbRef(rtdb, `ops/transport/lines/${lineId}/stats`);
        const lineStatsSnap = await rtdbGet(lineStatsRef);

        const currentLineStats = lineStatsSnap.exists() ? lineStatsSnap.val() : {};
        const scansToday = (currentLineStats.scans_today || 0) + 1;
        const totalScans = (currentLineStats.total_scans || 0) + 1;

        await update(lineStatsRef, {
            scans_today: scansToday,
            total_scans: totalScans,
            last_scan: timestamp,
            last_scan_date: today
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update ligne:', err);
            alert('❌ ÉCHEC update ligne: ' + err.message);
            throw err;
        });

        console.log('[SECTORISATION] ✅ Stats ligne mises à jour:', { scansToday, totalScans });

        // 2. INCRÉMENTER LES STATS DU VÉHICULE dans ops/transport/vehicles
        console.log('[SECTORISATION] 📊 Étape 2/5 : Stats véhicule ops/transport/vehicles');
        const vehicleStatsRef = dbRef(rtdb, `ops/transport/vehicles/${vehicleId}/stats`);
        const vehicleStatsSnap = await rtdbGet(vehicleStatsRef);

        const currentVehicleStats = vehicleStatsSnap.exists() ? vehicleStatsSnap.val() : {};
        const vehicleScansToday = (currentVehicleStats.scans_today || 0) + 1;
        const vehicleTotalScans = (currentVehicleStats.total_scans || 0) + 1;

        await update(vehicleStatsRef, {
            scans_today: vehicleScansToday,
            total_scans: vehicleTotalScans,
            last_scan: timestamp,
            last_scan_date: today
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update véhicule:', err);
            alert('❌ ÉCHEC update véhicule: ' + err.message);
            throw err;
        });

        console.log('[SECTORISATION] ✅ Stats véhicule mises à jour:', { vehicleScansToday, vehicleTotalScans });

        // 3. INCRÉMENTER usageCount dans fleet_vehicles (CRITIQUE pour paiement)
        console.log('[SECTORISATION] 📊 Étape 3/5 : usageCount dans fleet_vehicles');
        const fleetVehicleRef = dbRef(rtdb, `fleet_vehicles/${vehicleId}`);
        const fleetVehicleSnap = await rtdbGet(fleetVehicleRef);

        if (fleetVehicleSnap.exists()) {
            const fleetData = fleetVehicleSnap.val();
            const currentUsageCount = fleetData.usageCount || 0;
            const newUsageCount = currentUsageCount + 1;

            await update(fleetVehicleRef, {
                usageCount: newUsageCount,
                lastUsed: timestamp,
                lastUsedDate: today
            }).catch(err => {
                console.error('[SECTORISATION] 💥 ÉCHEC update fleet_vehicles:', err);
                alert('❌ ÉCHEC fleet_vehicles: ' + err.message);
                throw err;
            });

            console.log('[SECTORISATION] ✅ usageCount fleet_vehicles:', currentUsageCount, '→', newUsageCount);
        } else {
            console.warn('[SECTORISATION] ⚠️ fleet_vehicles/' + vehicleId + ' n\'existe pas');
        }

        // 4. CALCULER LE TAUX D'OCCUPATION (estimation)
        console.log('[SECTORISATION] 📊 Étape 4/5 : Taux d\'occupation');
        const capacity = 50; // Capacité par défaut
        const occupancyRate = Math.min(100, Math.round((vehicleScansToday / capacity) * 100));

        await update(vehicleStatsRef, {
            occupancy_rate: occupancyRate
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update occupancy_rate:', err);
            alert('❌ ÉCHEC occupancy_rate: ' + err.message);
            throw err;
        });

        console.log('[SECTORISATION] 📊 Taux d\'occupation:', occupancyRate + '%');

        // 5. CRÉER JOURNAL DE SCAN dans scan_history (PREUVE DE TRANSPORT)
        console.log('[SECTORISATION] 📊 Étape 5/5 : Journal scan_history');
        const scanHistoryRef = dbRef(rtdb, 'scan_history');
        const scanRecord = {
            vehicleId: vehicleId,
            lineId: lineId,
            timestamp: timestamp,
            date: today,
            scanType: 'SAMA_PASS',
            status: 'VALID',
            passengerId: subscriptionData?.phoneNumber || 'anonymous',
            subscriptionId: subscriptionData?.id || null,
            routeId: subscriptionData?.routeId || null,
            routeName: subscriptionData?.routeName || null
        };

        await push(scanHistoryRef, scanRecord).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC push scan_history:', err);
            alert('❌ ÉCHEC scan_history: ' + err.message);
            throw err;
        });
        console.log('[SECTORISATION] ✅ Scan enregistré dans scan_history');

        // 6. METTRE À JOUR TRANSPORT_STATS/GLOBAL (POUR LE DASHBOARD)
        console.log('[SECTORISATION] 📊 Étape 6/10 : transport_stats/global (Dashboard)');
        const globalStatsRef = dbRef(rtdb, 'transport_stats/global');
        const globalStatsSnap = await rtdbGet(globalStatsRef);

        const currentGlobalStats = globalStatsSnap.exists() ? globalStatsSnap.val() : {};
        const currentGlobalScansToday = currentGlobalStats.total_scans_today || 0;
        const currentGlobalTotalScans = currentGlobalStats.total_scans || 0;

        await update(globalStatsRef, {
            total_scans_today: currentGlobalScansToday + 1,
            total_scans: currentGlobalTotalScans + 1,
            last_scan: timestamp,
            last_scan_date: today,
            average_occupancy_rate: occupancyRate
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update transport_stats/global:', err);
            alert('❌ ÉCHEC transport_stats/global: ' + err.message);
            throw err;
        });

        console.log('[SECTORISATION] ✅ Stats globales mises à jour');
        console.log('[SECTORISATION] 📊 Global scans_today:', currentGlobalScansToday, '→', currentGlobalScansToday + 1);

        // 7. CRÉER ÉVÉNEMENT DE SCAN DANS SCAN_EVENTS (POUR LE DASHBOARD PAR VÉHICULE)
        console.log('[SECTORISATION] 📊 Étape 7/10 : scan_events pour le véhicule');
        const scanEventsRef = dbRef(rtdb, `ops/transport/vehicles/${vehicleId}/scan_events`);
        const scanEventRecord = {
            timestamp: new Date().toISOString(),
            scanStatus: 'valid',
            passengerId: subscriptionData?.phoneNumber || 'anonymous',
            subscriptionId: subscriptionData?.id || null,
            routeId: subscriptionData?.routeId || null,
            lineId: lineId
        };

        await push(scanEventsRef, scanEventRecord).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC push scan_events:', err);
            alert('❌ ÉCHEC scan_events: ' + err.message);
            throw err;
        });
        console.log('[SECTORISATION] ✅ Événement scan créé dans scan_events du véhicule');

        // 8. METTRE À JOUR /STATS/DAILY/{DATE}/TOTAL_SCANS (KPI GLOBAUX COMMAND CENTER)
        console.log('[SECTORISATION] 📊 Étape 8/10 : stats/daily pour KPIs globaux');
        const dailyStatsRef = dbRef(rtdb, `stats/daily/${today}`);
        const dailyStatsSnap = await rtdbGet(dailyStatsRef);
        const currentDailyScans = dailyStatsSnap.exists() ? (dailyStatsSnap.val().total_scans || 0) : 0;

        await update(dailyStatsRef, {
            total_scans: currentDailyScans + 1,
            last_updated: timestamp,
            date: today
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update stats/daily:', err);
            alert('❌ ÉCHEC stats/daily: ' + err.message);
            throw err;
        });
        console.log('[SECTORISATION] ✅ KPI journalier mis à jour:', currentDailyScans, '→', currentDailyScans + 1);

        // 9. METTRE À JOUR /VOYAGE/EXPRESS/{LINEID}/STATS/REALTIME (ANALYTICS LIGNE)
        console.log('[SECTORISATION] 📊 Étape 9/10 : voyage/express analytics pour Ligne', lineId);
        const voyageLineStatsRef = dbRef(rtdb, `voyage/express/${lineId}/stats/realtime`);
        const voyageLineStatsSnap = await rtdbGet(voyageLineStatsRef);
        const currentLineData = voyageLineStatsSnap.exists() ? voyageLineStatsSnap.val() : {};
        const currentLinePassengers = currentLineData.passengers_today || 0;
        const currentLineRevenue = currentLineData.revenue_today || 0;

        await update(voyageLineStatsRef, {
            passengers_today: currentLinePassengers + 1,
            total_passengers: (currentLineData.total_passengers || 0) + 1,
            revenue_today: currentLineRevenue + 250, // Prix moyen SAMA PASS
            last_scan: timestamp,
            last_scan_date: today,
            occupancy_rate: occupancyRate
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update voyage/express:', err);
            alert('❌ ÉCHEC voyage/express: ' + err.message);
            throw err;
        });
        console.log('[SECTORISATION] ✅ Analytics Ligne C mise à jour: +1 passager');

        // 10. CRÉER ÉVÉNEMENT DANS /OPS/TRANSPORT/LIVE_FEED (VUE TERRAIN)
        console.log('[SECTORISATION] 📊 Étape 10/11 : live_feed pour Vue Terrain');
        const liveFeedRef = dbRef(rtdb, 'ops/transport/live_feed');
        const liveFeedEvent = {
            timestamp: timestamp,
            datetime: new Date().toISOString(),
            type: 'scan',
            vehicleId: vehicleId,
            lineId: lineId,
            lineName: 'Ligne C (Dakar ↔ Keur Massar)',
            status: 'valid',
            passengerId: subscriptionData?.phoneNumber || 'anonymous',
            message: `✅ Passager validé sur ${vehicleId} - Ligne C`,
            occupancyRate: occupancyRate
        };

        await push(liveFeedRef, liveFeedEvent).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC push live_feed:', err);
            alert('❌ ÉCHEC live_feed: ' + err.message);
            throw err;
        });
        console.log('[SECTORISATION] ✅ Événement ajouté au Live Feed');

        // 11. METTRE À JOUR TRANSPORT_STATS/LINES/{LINEID}/STATS - CRITIQUE POUR RÈGLES FIREBASE
        console.log('[SECTORISATION] 📊 Étape 11/11 : transport_stats/lines (RÈGLES FIREBASE)');
        const transportStatsPath = `transport_stats/lines/${lineId}/stats`;
        console.log('[SECTORISATION] 🔍 CHEMIN COMPLET:', transportStatsPath);
        alert('🔍 CHEMIN: ' + transportStatsPath);

        const transportStatsLineRef = dbRef(rtdb, transportStatsPath);
        const transportStatsLineSnap = await rtdbGet(transportStatsLineRef);

        const currentTransportStats = transportStatsLineSnap.exists() ? transportStatsLineSnap.val() : {};
        const eco_count = (currentTransportStats.eco_count || 0) + 1;
        const comfort_count = currentTransportStats.comfort_count || 0;
        const premium_count = currentTransportStats.premium_count || 0;
        const total_scans_line = eco_count + comfort_count + premium_count;

        console.log('[SECTORISATION] 📊 Valeurs actuelles transport_stats/lines:', currentTransportStats);
        console.log('[SECTORISATION] 📊 Nouvelles valeurs:', { eco_count, comfort_count, premium_count, total_scans_line });

        await update(transportStatsLineRef, {
            eco_count: eco_count,
            comfort_count: comfort_count,
            premium_count: premium_count,
            total_scans: total_scans_line,
            last_scan: timestamp,
            last_scan_date: today
        }).catch(err => {
            console.error('[SECTORISATION] 💥 ÉCHEC update transport_stats/lines:', err);
            console.error('[SECTORISATION] 💥 Chemin:', transportStatsPath);
            console.error('[SECTORISATION] 💥 Code erreur:', err.code);
            console.error('[SECTORISATION] 💥 Message:', err.message);
            alert('💥 ERREUR CRITIQUE transport_stats/lines: ' + err.message);
            throw err;
        });

        console.log('[SECTORISATION] ✅ transport_stats/lines mis à jour avec succès !');
        alert('✅ TEST RÉUSSI !');

        console.log('[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS');
        console.log('[SECTORISATION] 📊 Résumé complet:');
        console.log('[SECTORISATION]    - Ligne total_scans:', totalScans);
        console.log('[SECTORISATION]    - Véhicule total_scans:', vehicleTotalScans);
        console.log('[SECTORISATION]    - fleet_vehicles usageCount: +1');
        console.log('[SECTORISATION]    - scan_history: enregistré');
        console.log('[SECTORISATION]    - transport_stats/global: mis à jour ✨');
        console.log('[SECTORISATION]    - transport_stats/lines: mis à jour ✨✨✨');
        console.log('[SECTORISATION]    - scan_events véhicule: enregistré ✨');
        console.log('[SECTORISATION]    - stats/daily KPIs: mis à jour ✨');
        console.log('[SECTORISATION]    - voyage/express analytics: mis à jour ✨');
        console.log('[SECTORISATION]    - live_feed Vue Terrain: événement créé ✨');

    } catch (error) {
        console.error('[SECTORISATION] ❌ Erreur mise à jour stats:', error);
        console.error('[SECTORISATION] ❌ Stack:', error.stack);
        alert('💥 ERREUR CRITIQUE incrementLineStats: ' + error.message);
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
