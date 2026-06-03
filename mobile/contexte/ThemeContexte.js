// contexte/ThemeContexte.js - Gestion centralisée des thèmes (Sombre / Clair / Système)
// Fournit un contexte global avec les couleurs du thème actif
// Persisté dans AsyncStorage pour que le choix soit conservé entre les sessions

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// DÉFINITION DES PALETTES DE COULEURS
// ============================================

const THEME_SOMBRE = {
  fond: '#121212',
  fondSecondaire: '#1A1A1A',
  fondTertiaire: '#222',
  carte: '#1A1A1A',
  carteBordure: '#333',
  header: '#121212',
  tabBar: '#121212',
  tabBarBordure: '#333',

  texte: '#FFF',
  texteSecondaire: '#CCC',
  texteTertiaire: '#888',
  texteQuaternaire: '#555',
  textePlaceholder: '#666',

  accent: '#1E90FF',
  accentFond: '#1A365D',
  accentDoux: 'rgba(30, 144, 255, 0.15)',

  vert: '#4CAF50',
  vertDoux: 'rgba(76, 175, 80, 0.1)',
  rouge: '#E53935',
  rougeDoux: 'rgba(229, 57, 53, 0.08)',
  jaune: '#FDD835',
  jauneDoux: 'rgba(249, 168, 37, 0.15)',
  orange: '#FFB300',
  or: '#F9A825',

  inputFond: '#222',
  inputTexte: '#FFF',
  inputBordure: '#333',

  separateur: '#333',
  separateurLeger: '#222',

  boutonPrimaire: '#1E90FF',
  boutonDesactive: '#333',

  modalFond: 'rgba(0,0,0,0.85)',
  modalContenu: '#141414',

  cercleBleu: '#1565C0',
  cercleRouge: '#C62828',

  // Spécifique classement
  classementLigneImpaire: '#141414',
  classementLignePaire: '#1A1A1A',

  // Couleurs du Cameroun
  camerounVert: '#007A5E',
  camerounRouge: '#CE1126',
  camerounJaune: '#FCD116',
};

const THEME_CLAIR = {
  fond: '#F5F5F5',
  fondSecondaire: '#FFFFFF',
  fondTertiaire: '#EBEBEB',
  carte: '#FFFFFF',
  carteBordure: '#E0E0E0',
  header: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBordure: '#E0E0E0',

  texte: '#1A1A1A',
  texteSecondaire: '#333',
  texteTertiaire: '#666',
  texteQuaternaire: '#999',
  textePlaceholder: '#ABABAB',

  accent: '#1565C0',
  accentFond: '#E3F2FD',
  accentDoux: 'rgba(21, 101, 192, 0.1)',

  vert: '#2E7D32',
  vertDoux: 'rgba(46, 125, 50, 0.08)',
  rouge: '#C62828',
  rougeDoux: 'rgba(198, 40, 40, 0.06)',
  jaune: '#F9A825',
  jauneDoux: 'rgba(249, 168, 37, 0.1)',
  orange: '#EF6C00',
  or: '#F57F17',

  inputFond: '#F0F0F0',
  inputTexte: '#1A1A1A',
  inputBordure: '#DDD',

  separateur: '#E0E0E0',
  separateurLeger: '#EBEBEB',

  boutonPrimaire: '#1565C0',
  boutonDesactive: '#CCC',

  modalFond: 'rgba(0,0,0,0.4)',
  modalContenu: '#FFFFFF',

  cercleBleu: '#1565C0',
  cercleRouge: '#C62828',

  // Spécifique classement
  classementLigneImpaire: '#FFFFFF',
  classementLignePaire: '#F5F5F5',

  // Couleurs du Cameroun
  camerounVert: '#007A5E',
  camerounRouge: '#CE1126',
  camerounJaune: '#FCD116',
};

// ============================================
// CONTEXTE
// ============================================
export const ThemeContexte = createContext();

// Modes disponibles : 'systeme', 'sombre', 'clair'
const CLE_STOCKAGE = '@theme_mode';

export function ThemeProvider({ children }) {
  const schemaSysteme = useColorScheme(); // 'dark' ou 'light'
  const [modeTheme, setModeTheme] = useState('systeme'); // 'systeme' | 'sombre' | 'clair'
  const [pret, setPret] = useState(false);

  // Charger le thème depuis AsyncStorage au lancement
  useEffect(() => {
    const charger = async () => {
      try {
        const modeSauvegarde = await AsyncStorage.getItem(CLE_STOCKAGE);
        if (modeSauvegarde) {
          setModeTheme(modeSauvegarde);
        }
      } catch (e) {
        console.error('❌ Erreur chargement thème:', e);
      } finally {
        setPret(true);
      }
    };
    charger();
  }, []);

  // Changer le thème et le sauvegarder
  const changerTheme = async (nouveauMode) => {
    setModeTheme(nouveauMode);
    try {
      await AsyncStorage.setItem(CLE_STOCKAGE, nouveauMode);
    } catch (e) {
      console.error('❌ Erreur sauvegarde thème:', e);
    }
  };

  // Résoudre les couleurs du thème actif
  const estSombre = modeTheme === 'systeme'
    ? (schemaSysteme === 'dark')
    : (modeTheme === 'sombre');

  const couleurs = estSombre ? THEME_SOMBRE : THEME_CLAIR;

  return (
    <ThemeContexte.Provider value={{
      couleurs,
      estSombre,
      modeTheme,      // 'systeme' | 'sombre' | 'clair'
      changerTheme,    // (mode) => void
      pret,
    }}>
      {children}
    </ThemeContexte.Provider>
  );
}

// Hook raccourci pour accéder au thème dans n'importe quel écran
export function useTheme() {
  return useContext(ThemeContexte);
}
