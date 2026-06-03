// screens/ClassementScreen.js - Classement des championnats Elite 1 et Elite 2
// Affiche un tableau de classement avec toggle entre les deux ligues
// TODO: Remplacer les Mock Data par GET /api/classement?ligue=elite1

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexte/ThemeContexte';

// --- DONNÉES FICTIVES CLASSEMENT ELITE 1 ---
// Simule la table "classement_clubs" de la base de données de Patrick
// Champs : position, club, matchs_joues, victoires, nuls, defaites, buts_pour, buts_contre, points
const fausseDonneesElite1 = [
  { position: 1,  clubId: 'c1',  club: 'Coton Sport de Garoua',    matchsJoues: 10, victoires: 8, nuls: 1, defaites: 1, butsPour: 22, butsContre: 7,  points: 25 },
  { position: 2,  clubId: 'c3',  club: 'Bamboutos FC',              matchsJoues: 10, victoires: 7, nuls: 2, defaites: 1, butsPour: 18, butsContre: 8,  points: 23 },
  { position: 3,  clubId: 'c2',  club: 'Canon de Yaoundé',          matchsJoues: 10, victoires: 6, nuls: 3, defaites: 1, butsPour: 16, butsContre: 9,  points: 21 },
  { position: 4,  clubId: 'c4',  club: 'Union de Douala',            matchsJoues: 10, victoires: 5, nuls: 3, defaites: 2, butsPour: 14, butsContre: 10, points: 18 },
  { position: 5,  clubId: 'c5',  club: 'Panthère du Ndé',            matchsJoues: 10, victoires: 5, nuls: 2, defaites: 3, butsPour: 15, butsContre: 11, points: 17 },
  { position: 6,  clubId: 'c6',  club: 'Colombe du Dja-et-Lobo',     matchsJoues: 10, victoires: 4, nuls: 3, defaites: 3, butsPour: 12, butsContre: 10, points: 15 },
  { position: 7,  clubId: 'c7',  club: 'Tonnerre KC',                matchsJoues: 10, victoires: 4, nuls: 2, defaites: 4, butsPour: 11, butsContre: 13, points: 14 },
  { position: 8,  clubId: 'c8',  club: 'Eding Sport de la Lékié',    matchsJoues: 10, victoires: 3, nuls: 4, defaites: 3, butsPour: 10, butsContre: 11, points: 13 },
  { position: 9,  clubId: 'c11', club: 'Stade Renard de Melong',     matchsJoues: 10, victoires: 3, nuls: 2, defaites: 5, butsPour: 9,  butsContre: 14, points: 11 },
  { position: 10, clubId: 'c9',  club: 'Astres FC de Douala',        matchsJoues: 10, victoires: 2, nuls: 3, defaites: 5, butsPour: 8,  butsContre: 15, points: 9  },
  { position: 11, clubId: 'c10', club: 'UMS de Loum',                matchsJoues: 10, victoires: 2, nuls: 2, defaites: 6, butsPour: 7,  butsContre: 16, points: 8  },
  { position: 12, clubId: 'c12', club: 'Feutcheu FC de Bandjoun',    matchsJoues: 10, victoires: 1, nuls: 1, defaites: 8, butsPour: 5,  butsContre: 22, points: 4  },
];

// --- DONNÉES FICTIVES CLASSEMENT ELITE 2 ---
const fausseDonneesElite2 = [
  { position: 1,  clubId: 'c13', club: 'AS Fortuna de Mfou',         matchsJoues: 10, victoires: 7, nuls: 2, defaites: 1, butsPour: 19, butsContre: 6,  points: 23 },
  { position: 2,  clubId: 'c14', club: 'Dynamo FC de Douala',         matchsJoues: 10, victoires: 6, nuls: 3, defaites: 1, butsPour: 17, butsContre: 8,  points: 21 },
  { position: 3,  clubId: 'c15', club: 'Racing FC de Bafoussam',      matchsJoues: 10, victoires: 6, nuls: 2, defaites: 2, butsPour: 15, butsContre: 9,  points: 20 },
  { position: 4,  clubId: 'c16', club: 'PWD de Bamenda',               matchsJoues: 10, victoires: 5, nuls: 3, defaites: 2, butsPour: 14, butsContre: 10, points: 18 },
  { position: 5,  clubId: 'v1',  club: 'Dragon de Yaoundé',           matchsJoues: 10, victoires: 5, nuls: 2, defaites: 3, butsPour: 13, butsContre: 12, points: 17 },
  { position: 6,  clubId: 'v2',  club: 'Fovu de Baham',                matchsJoues: 10, victoires: 4, nuls: 3, defaites: 3, butsPour: 11, butsContre: 11, points: 15 },
  { position: 7,  clubId: 'v3',  club: 'Yong Sports de Bamenda',      matchsJoues: 10, victoires: 4, nuls: 2, defaites: 4, butsPour: 10, butsContre: 12, points: 14 },
  { position: 8,  clubId: 'v4',  club: 'Avion Academy de Nkongsamba', matchsJoues: 10, victoires: 3, nuls: 3, defaites: 4, butsPour: 9,  butsContre: 13, points: 12 },
  { position: 9,  clubId: 'v5',  club: 'Les Astres de Nkongsamba',    matchsJoues: 10, victoires: 3, nuls: 2, defaites: 5, butsPour: 8,  butsContre: 14, points: 11 },
  { position: 10, clubId: 'v6',  club: 'Aigle Royal de la Menoua',    matchsJoues: 10, victoires: 2, nuls: 2, defaites: 6, butsPour: 7,  butsContre: 17, points: 8  },
];

import { DonneesContexte } from '../contexte/DonneesContexte';

export default function EcranClassement({ navigation }) {
  const [ligueSelectionnee, setLigueSelectionnee] = useState('elite1');
  const [donneesAffichees, setDonneesAffichees] = useState([]);
  const [chargementEnCours, setChargementEnCours] = useState(true);
  const { couleurs } = useTheme();
  const { classement } = useContext(DonneesContexte);

  // --- CHARGEMENT DES DONNÉES SELON LA LIGUE ---
  useEffect(() => {
    setChargementEnCours(true);
    // Simulation d'un petit délai pour la fluidité visuelle
    const timer = setTimeout(() => {
      if (classement) {
        if (ligueSelectionnee === 'elite1') {
          setDonneesAffichees(classement.elite1 || []);
        } else {
          setDonneesAffichees(classement.elite2 || []);
        }
      }
      setChargementEnCours(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [ligueSelectionnee, classement]);

  // --- COULEUR DE POSITION ---
  const obtenirCouleurPosition = (position, totalClubs) => {
    if (position <= 3) return '#4CAF50';
    if (position >= totalClubs - 1) return '#E53935';
    return couleurs.texte;
  };

  // --- FOND DE LA LIGNE ---
  const obtenirFondLigne = (position, totalClubs) => {
    if (position <= 3) return couleurs.vertDoux;
    if (position >= totalClubs - 1) return couleurs.rougeDoux;
    return position % 2 === 0 ? couleurs.classementLignePaire : couleurs.classementLigneImpaire;
  };

  // --- DIFFÉRENCE DE BUTS ---
  const calculerDifferenceButs = (butsPour, butsContre) => {
    const difference = butsPour - butsContre;
    return difference > 0 ? `+${difference}` : `${difference}`;
  };

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* ============================================ */}
      {/* TOGGLE ELITE 1 / ELITE 2                     */}
      {/* ============================================ */}
      <View style={[styles.conteneurToggle, { backgroundColor: couleurs.fondSecondaire }]}>
        <TouchableOpacity
          style={[styles.boutonToggle, ligueSelectionnee === 'elite1' && [styles.boutonToggleActif, { backgroundColor: couleurs.accent }]]}
          onPress={() => setLigueSelectionnee('elite1')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="football"
            size={16}
            color={ligueSelectionnee === 'elite1' ? '#FFF' : couleurs.texteTertiaire}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.texteToggle, { color: couleurs.texteTertiaire }, ligueSelectionnee === 'elite1' && styles.texteToggleActif]}>
            Elite 1
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boutonToggle, ligueSelectionnee === 'elite2' && [styles.boutonToggleActif, { backgroundColor: couleurs.accent }]]}
          onPress={() => setLigueSelectionnee('elite2')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="football-outline"
            size={16}
            color={ligueSelectionnee === 'elite2' ? '#FFF' : couleurs.texteTertiaire}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.texteToggle, { color: couleurs.texteTertiaire }, ligueSelectionnee === 'elite2' && styles.texteToggleActif]}>
            Elite 2
          </Text>
        </TouchableOpacity>
      </View>

      {/* ============================================ */}
      {/* LÉGENDE                                       */}
      {/* ============================================ */}
      <View style={styles.conteneurLegende}>
        <View style={styles.elementLegende}>
          <View style={[styles.pastilleLegende, { backgroundColor: '#4CAF50' }]} />
          <Text style={[styles.texteLegende, { color: couleurs.texteTertiaire }]}>Tête du classement</Text>
        </View>
        <View style={styles.elementLegende}>
          <View style={[styles.pastilleLegende, { backgroundColor: '#E53935' }]} />
          <Text style={[styles.texteLegende, { color: couleurs.texteTertiaire }]}>Zone de relégation</Text>
        </View>
      </View>

      {chargementEnCours ? (
        <View style={styles.conteneurChargement}>
          <ActivityIndicator size="large" color="#1E90FF" />
          <Text style={[styles.texteChargement, { color: couleurs.texteTertiaire }]}>Chargement du classement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.conteneurTableau, { backgroundColor: couleurs.carte }]}>
          {/* BANDE CAMEROUN */}
          <View style={{ flexDirection: 'row', height: 3, width: '100%' }}>
            <View style={{ flex: 1, backgroundColor: couleurs.camerounVert || '#007A5E' }} />
            <View style={{ flex: 1, backgroundColor: couleurs.camerounRouge || '#CE1126' }} />
            <View style={{ flex: 1, backgroundColor: couleurs.camerounJaune || '#FCD116' }} />
          </View>

          {/* EN-TÊTE DU TABLEAU */}
          <View style={[styles.enTeteTableau, { backgroundColor: couleurs.accent }]}>
            <Text style={[styles.colPosition, styles.texteEnTete]}>#</Text>
            <Text style={[styles.colClub, styles.texteEnTete]}>Club</Text>
            <Text style={[styles.colStat, styles.texteEnTete]}>MJ</Text>
            <Text style={[styles.colStat, styles.texteEnTete]}>V</Text>
            <Text style={[styles.colStat, styles.texteEnTete]}>N</Text>
            <Text style={[styles.colStat, styles.texteEnTete]}>D</Text>
            <Text style={[styles.colStat, styles.texteEnTete]}>DB</Text>
            <Text style={[styles.colPoints, styles.texteEnTete]}>PTS</Text>
          </View>

          {/* LIGNES DU CLASSEMENT */}
          {donneesAffichees.map((equipe) => (
            <TouchableOpacity
              key={equipe.position}
              style={[
                styles.ligneTableau,
                { backgroundColor: obtenirFondLigne(equipe.position, donneesAffichees.length), borderBottomColor: couleurs.separateur },
              ]}
              onPress={() => navigation.navigate('ClubDetail', { clubId: equipe.clubId, infosStat: equipe })}
              activeOpacity={0.7}
            >
              <View style={styles.colPosition}>
                <Text style={[
                  styles.textePosition,
                  { color: obtenirCouleurPosition(equipe.position, donneesAffichees.length) },
                ]}>
                  {equipe.position}
                </Text>
              </View>
              <Text style={[styles.colClub, { color: couleurs.texte }]} numberOfLines={1}>{equipe.club}</Text>
              <Text style={styles.colStat}>{equipe.matchsJoues}</Text>
              <Text style={[styles.colStat, { color: '#4CAF50' }]}>{equipe.victoires}</Text>
              <Text style={styles.colStat}>{equipe.nuls}</Text>
              <Text style={[styles.colStat, { color: '#E53935' }]}>{equipe.defaites}</Text>
              <Text style={[
                styles.colStat,
                {
                  color: equipe.butsPour - equipe.butsContre > 0 ? '#4CAF50' :
                         equipe.butsPour - equipe.butsContre < 0 ? '#E53935' : '#888',
                },
              ]}>
                {calculerDifferenceButs(equipe.butsPour, equipe.butsContre)}
              </Text>
              <Text style={[styles.colPoints, { color: couleurs.accent }]}>{equipe.points}</Text>
            </TouchableOpacity>
          ))}

          {/* PIED DU TABLEAU */}
          <View style={styles.piedTableau}>
            <Text style={[styles.textePiedTableau, { color: couleurs.texteQuaternaire }]}>
              Saison 2025-2026 • Mis à jour le 15 Avril 2026
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // Toggle
  conteneurToggle: {
    flexDirection: 'row', margin: 15, marginBottom: 5,
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4,
  },
  boutonToggle: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 12, borderRadius: 10,
  },
  boutonToggleActif: {
    backgroundColor: '#1A365D',
    shadowColor: '#1E90FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  texteToggle: { fontSize: 15, fontWeight: '700', color: '#1E90FF' },
  texteToggleActif: { color: '#FFF' },

  // Légende
  conteneurLegende: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    marginBottom: 10, paddingHorizontal: 15,
  },
  elementLegende: { flexDirection: 'row', alignItems: 'center' },
  pastilleLegende: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  texteLegende: { fontSize: 11, color: '#888' },

  // Chargement
  conteneurChargement: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texteChargement: { marginTop: 10, color: '#888', fontSize: 14 },

  // Tableau
  conteneurTableau: {
    flex: 1, marginHorizontal: 10,
    borderRadius: 14, marginBottom: 15,
  },
  enTeteTableau: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 8, backgroundColor: '#1A365D',
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  texteEnTete: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  ligneTableau: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    paddingHorizontal: 8, borderBottomWidth: 1,
  },
  colPosition: { width: 30, alignItems: 'center' },
  textePosition: { fontSize: 14, fontWeight: 'bold' },
  colClub: { flex: 1, fontSize: 12, fontWeight: '600', color: '#DDD', paddingRight: 4 },
  colStat: { width: 28, textAlign: 'center', fontSize: 12, color: '#AAA' },
  colPoints: { width: 34, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#1E90FF' },

  // Pied
  piedTableau: { padding: 12, alignItems: 'center' },
  textePiedTableau: { fontSize: 11, color: '#555' },
});
