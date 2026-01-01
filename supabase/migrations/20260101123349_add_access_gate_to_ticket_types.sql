/*
  # Ajout du champ 'Porte d'accès' aux zones de billets

  1. Modifications
    - Ajouter colonne `access_gate` (text) à `ticket_types` pour indiquer la porte d'accès (ex: 'Porte C2')
    - Cette information sera affichée sur le QR code du client
    - Le scanner affichera la couleur de la zone en plein écran après validation

  2. Notes
    - Exemples de portes : 'Porte C2', 'Entrée VIP Nord', 'Porte Tribune Est'
    - La couleur est déjà présente dans `zone_color`
*/

-- Ajouter la colonne access_gate aux ticket_types
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS access_gate text;

-- Commentaire
COMMENT ON COLUMN ticket_types.access_gate IS 'Porte d''accès pour cette zone (ex: Porte C2, Entrée VIP Nord). Affiché sur le QR code.';

-- Mettre à jour les tickets existants avec des valeurs par défaut basées sur la zone
UPDATE ticket_types
SET access_gate = CASE
  WHEN LOWER(name) LIKE '%vip%' OR LOWER(name) LIKE '%premium%' THEN 'Entrée VIP Principale'
  WHEN LOWER(name) LIKE '%tribune%' OR LOWER(name) LIKE '%honneur%' THEN 'Porte Tribune Est'
  WHEN LOWER(name) LIKE '%pelouse%' OR LOWER(name) LIKE '%populaire%' THEN 'Porte Pelouse Sud'
  WHEN LOWER(name) LIKE '%balcon%' THEN 'Porte Balcon Nord'
  ELSE 'Entrée Générale'
END
WHERE access_gate IS NULL;
