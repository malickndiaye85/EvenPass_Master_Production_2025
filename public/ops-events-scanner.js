// OPS Events Scanner Integration
// Enregistre automatiquement les scans dans Firebase pour le système OPS Manager Events

import { getDatabase, ref as dbRef, push, set, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let rtdb = null;

export function initOpsEventsScanner(database) {
    rtdb = database;
    console.log('[OPS Events] Scanner initialized');
}

export async function recordOpsEventScan(ticketId, ticketData, isFraud = false) {
    try {
        const controllerType = sessionStorage.getItem('controller_type');

        if (controllerType !== 'ops_events') {
            return;
        }

        const controllerId = sessionStorage.getItem('controller_id');
        const controllerName = sessionStorage.getItem('controller_name');
        const eventId = sessionStorage.getItem('event_id');

        if (!controllerId || !eventId) {
            console.warn('[OPS Events] Missing controller or event data');
            return;
        }

        const scansRef = dbRef(rtdb, 'opsEvents/scans');
        const newScanRef = push(scansRef);

        const scanRecord = {
            id: newScanRef.key,
            controllerId: controllerId,
            controllerName: controllerName,
            eventId: eventId,
            ticketId: ticketId,
            timestamp: Date.now(),
            isFraud: isFraud,
            ticketType: ticketData?.ticketType || ticketData?.type || 'Standard',
            attendeeName: ticketData?.attendeeName || ticketData?.name || 'N/A'
        };

        await set(newScanRef, scanRecord);

        const controllerRef = dbRef(rtdb, `opsEvents/controllers/${controllerId}`);
        const controllerSnap = await get(controllerRef);

        if (controllerSnap.exists()) {
            const controller = controllerSnap.val();
            await update(controllerRef, {
                totalScans: (controller.totalScans || 0) + 1,
                fraudAttempts: (controller.fraudAttempts || 0) + (isFraud ? 1 : 0),
                lastScanAt: Date.now()
            });
        }

        if (!isFraud) {
            const eventRef = dbRef(rtdb, `opsEvents/events/${eventId}`);
            const eventSnap = await get(eventRef);

            if (eventSnap.exists()) {
                const event = eventSnap.val();
                await update(eventRef, {
                    scannedTickets: (event.scannedTickets || 0) + 1
                });
            }
        }

        console.log('[OPS Events] ✅ Scan recorded:', {
            ticket: ticketId,
            controller: controllerName,
            fraud: isFraud
        });

    } catch (error) {
        console.error('[OPS Events] ❌ Error recording scan:', error);
    }
}
