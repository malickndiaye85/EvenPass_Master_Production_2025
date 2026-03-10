/**
 * EPscanT - Système d'Alertes Audio et Tactiles
 * Feedback immédiat pour les contrôleurs sans regarder l'écran
 */

class EPscanTAlerts {
    constructor() {
        this.audioContext = null;
        this.isAudioEnabled = true;
        this.isHapticsEnabled = true;

        // Initialiser l'AudioContext au premier clic utilisateur
        this.initAudio();

        console.log('[ALERTS] ✅ Système d\'alertes initialisé');
    }

    /**
     * Initialise le contexte audio (nécessite une interaction utilisateur)
     */
    initAudio() {
        try {
            // AudioContext moderne
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Reprendre le contexte si suspendu (politique navigateur)
            if (this.audioContext.state === 'suspended') {
                document.addEventListener('click', () => {
                    this.audioContext.resume();
                }, { once: true });
            }

            console.log('[ALERTS] 🔊 AudioContext créé');
        } catch (error) {
            console.error('[ALERTS] ❌ Erreur création AudioContext:', error);
            this.isAudioEnabled = false;
        }
    }

    /**
     * Joue une fréquence avec envelope ADSR
     */
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.isAudioEnabled || !this.audioContext) {
            console.warn('[ALERTS] ⚠️ Audio désactivé');
            return;
        }

        try {
            const now = this.audioContext.currentTime;

            // Oscillateur (générateur de son)
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
            oscillator.frequency.setValueAtTime(frequency, now);

            // Gain (volume)
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, now);

            // Envelope ADSR (Attack, Decay, Sustain, Release)
            const attackTime = 0.01;
            const decayTime = 0.05;
            const sustainLevel = volume * 0.7;
            const releaseTime = 0.1;

            // Attack
            gainNode.gain.linearRampToValueAtTime(volume, now + attackTime);
            // Decay
            gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
            // Sustain (maintien)
            gainNode.gain.setValueAtTime(sustainLevel, now + duration - releaseTime);
            // Release
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            // Connexion
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Démarrage et arrêt
            oscillator.start(now);
            oscillator.stop(now + duration);

        } catch (error) {
            console.error('[ALERTS] ❌ Erreur lecture son:', error);
        }
    }

    /**
     * Vibration tactile (si supporté)
     */
    vibrate(pattern) {
        if (!this.isHapticsEnabled) {
            return;
        }

        try {
            if ('vibrate' in navigator) {
                navigator.vibrate(pattern);
                console.log('[ALERTS] 📳 Vibration:', pattern);
            } else {
                console.warn('[ALERTS] ⚠️ Vibration non supportée');
            }
        } catch (error) {
            console.error('[ALERTS] ❌ Erreur vibration:', error);
        }
    }

    /**
     * ✅ ALERTE SUCCÈS - Ligne Valide
     * Son : Ding positif et clair (880 Hz)
     * Vibration : Courte (50ms)
     */
    playSuccessAlert() {
        console.log('[ALERTS] ✅ Alerte SUCCÈS');

        // Son : Note A5 (La 5) = 880 Hz - Son clair et positif
        this.playTone(880, 0.15, 'sine', 0.4);

        // Vibration courte
        this.vibrate(50);
    }

    /**
     * ⚠️ ALERTE AVERTISSEMENT - Ligne Non Autorisée
     * Son : Double bip d'avertissement (660 Hz)
     * Vibration : Double vibration (100ms x 2)
     */
    playWarningAlert() {
        console.log('[ALERTS] ⚠️ Alerte AVERTISSEMENT');

        // Premier bip
        this.playTone(660, 0.12, 'square', 0.35);

        // Deuxième bip (légèrement différent)
        setTimeout(() => {
            this.playTone(600, 0.12, 'square', 0.35);
        }, 150);

        // Double vibration
        this.vibrate([100, 80, 100]);
    }

    /**
     * ❌ ALERTE ERREUR - Pass Expiré/Invalide
     * Son : Buzz grave et prolongé (220 Hz)
     * Vibration : Triple vibration forte (150ms x 3)
     */
    playErrorAlert() {
        console.log('[ALERTS] ❌ Alerte ERREUR');

        // Son grave et prolongé : Note A3 (La 3) = 220 Hz
        this.playTone(220, 0.4, 'square', 0.4);

        // Triple vibration forte
        this.vibrate([150, 100, 150, 100, 150]);
    }

    /**
     * 📊 ALERTE QUOTA - Limite Atteinte (2 scans/jour)
     * Son : Triple bip rapide montant
     * Vibration : Longue vibration (300ms)
     */
    playQuotaAlert() {
        console.log('[ALERTS] 📊 Alerte QUOTA');

        // Triple bip rapide montant
        this.playTone(500, 0.08, 'sine', 0.3);
        setTimeout(() => this.playTone(600, 0.08, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(700, 0.08, 'sine', 0.3), 200);

        // Vibration longue
        this.vibrate(300);
    }

    /**
     * ⏱️ ALERTE ANTI-PASSBACK - Scan Trop Rapproché
     * Son : Double bip rapide
     * Vibration : Double courte
     */
    playAntiPassbackAlert() {
        console.log('[ALERTS] ⏱️ Alerte ANTI-PASSBACK');

        // Double bip rapide
        this.playTone(550, 0.08, 'sine', 0.3);
        setTimeout(() => this.playTone(550, 0.08, 'sine', 0.3), 120);

        // Double vibration courte
        this.vibrate([80, 60, 80]);
    }

    /**
     * 🔊 Test de tous les sons
     */
    testAllAlerts() {
        console.log('[ALERTS] 🎵 Test de tous les sons');

        this.playSuccessAlert();

        setTimeout(() => this.playWarningAlert(), 1000);
        setTimeout(() => this.playErrorAlert(), 2500);
        setTimeout(() => this.playQuotaAlert(), 4000);
        setTimeout(() => this.playAntiPassbackAlert(), 5500);

        console.log('[ALERTS] ✅ Test terminé');
    }

    /**
     * Active/Désactive les sons
     */
    toggleAudio(enabled) {
        this.isAudioEnabled = enabled;
        console.log('[ALERTS] 🔊 Audio:', enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ');
    }

    /**
     * Active/Désactive les vibrations
     */
    toggleHaptics(enabled) {
        this.isHapticsEnabled = enabled;
        console.log('[ALERTS] 📳 Vibrations:', enabled ? 'ACTIVÉES' : 'DÉSACTIVÉES');
    }
}

// Instance globale
window.EPscanTAlerts = new EPscanTAlerts();

console.log('[ALERTS] 🎯 Module d\'alertes audio/tactiles chargé');
