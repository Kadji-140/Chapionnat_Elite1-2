// screens/MatchsScreen.js - Liste des matchs Elite 1 & Elite 2
// Affiche les matchs en cours, à venir et terminés avec filtres et recherche
// Les données viennent du DonneesContexte (Mock Data → future API de Patrick)

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';

export default function EcranMatchs({ navigation }) {
  const {
    matchs,
    getClubById,
    getInitialeClub,
    matchNotificationsIds,
    toggleNotificationMatch,
  } = useContext(DonneesContexte);
  const { couleurs } = useTheme();

  // --- FILTRES ---
  const [filtreLigue, setFiltreLigue] = useState('Tout');    // 'Tout', 'Elite 1', 'Elite 2'
  const [filtreStatut, setFiltreStatut] = useState('Tout');   // 'Tout', 'En cours', 'À venir', 'Terminé'
  const [rechercheTexte, setRechercheTexte] = useState('');
  const [rechercheVisible, setRechercheVisible] = useState(false);

  // --- FILTRAGE DES MATCHS ---
  const matchsFiltres = matchs.filter((match) => {
    // Filtre par ligue
    if (filtreLigue !== 'Tout' && match.ligue !== filtreLigue) return false;
    // Filtre par statut
    if (filtreStatut !== 'Tout' && match.statut !== filtreStatut) return false;
    // Filtre par recherche texte (nom d'équipe)
    if (rechercheTexte.trim()) {
      const clubDom = getClubById(match.clubDomId);
      const clubExt = getClubById(match.clubExtId);
      const texte = rechercheTexte.toLowerCase();
      if (!clubDom.nom.toLowerCase().includes(texte) && !clubExt.nom.toLowerCase().includes(texte)) {
        return false;
      }
    }
    return true;
  });

  // --- FORMATER LA DATE EN jj/mm/yyyy ---
  const formaterDate = (dateStr) => {
    if (!dateStr) return '';
    const [annee, mois, jour] = dateStr.split('-');
    return `${jour}/${mois}/${annee}`;
  };

  // --- GROUPER PAR DATE ET JOURNÉE pour SectionList ---
  const sections = [];
  const groupes = {};
  matchsFiltres.forEach((match) => {
    // Clé unique pour grouper par Date + Journée + Ligue
    const cle = `${match.dateMatch}|${match.journee}|${match.ligue}`;
    if (!groupes[cle]) {
      groupes[cle] = { 
        dateStr: match.dateMatch,
        journee: match.journee,
        ligue: match.ligue,
        data: [] 
      };
    }
    groupes[cle].data.push(match);
  });

  Object.values(groupes).forEach((groupe) => {
    sections.push({
      title: `${groupe.ligue} - ${groupe.journee}`,
      dateStr: groupe.dateStr,
      date: formaterDate(groupe.dateStr),
      data: groupe.data
    });
  });

  // Trier les sections par date croissante
  sections.sort((a, b) => {
    if (a.dateStr < b.dateStr) return -1;
    if (a.dateStr > b.dateStr) return 1;
    return 0;
  });

  // --- NAVIGUER VERS LE DÉTAIL ---
  const ouvrirDetailMatch = (match) => {
    navigation.navigate('DetailMatch', { matchId: match.id });
  };

  // --- COULEUR DE PROBABILITÉ ---
  const getCouleurProb = (prob) => {
    if (prob >= 50) return couleurs.vert;
    if (prob >= 30) return couleurs.orange;
    return couleurs.rouge;
  };

  // --- RENDU D'UNE CARTE DE MATCH ---
  const afficherMatch = ({ item }) => {
    const clubDom = getClubById(item.clubDomId);
    const clubExt = getClubById(item.clubExtId);
    const isLive = item.statut === 'En cours';
    const isTermine = item.statut === 'Terminé';
    const isNotifActif = matchNotificationsIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => ouvrirDetailMatch(item)}
        style={[styles.corpsMatch, { backgroundColor: couleurs.fondSecondaire, borderBottomColor: couleurs.separateurLeger }]}
      >
        {/* Colonne Temps */}
        <View style={styles.colonneTemps}>
          <Text style={[styles.texteHeure, { color: couleurs.texteTertiaire }, isLive && { color: couleurs.texte }]}>{item.heure}</Text>
          {isLive && item.minuteActuelle && (
            <Text style={[styles.texteMinuteRouge, { color: couleurs.rouge }]}>{item.minuteActuelle}'</Text>
          )}
          {isTermine && <Text style={[styles.texteTermine, { color: couleurs.texteTertiaire }]}>FT</Text>}
        </View>

        {/* Séparateur vertical */}
        <View style={[styles.separateurVertical, { backgroundColor: couleurs.separateur }]} />

        {/* Colonne Equipes avec scores */}
        <View style={styles.colonneEquipes}>
          {/* Équipe Domicile */}
          <View style={styles.ligneEquipe}>
            {clubDom.logo ? (
              <Image source={clubDom.logo} style={styles.cercleInitiale} />
            ) : (
              <View style={[styles.cercleInitiale, { backgroundColor: couleurs.cercleBleu }]}>
                <Text style={styles.texteInitiale}>{getInitialeClub(item.clubDomId)}</Text>
              </View>
            )}
            <Text style={[styles.nomEquipe, { color: couleurs.texte }]} numberOfLines={1}>{clubDom.nom}</Text>
            {item.scoreDom !== null && (
              <Text style={[styles.texteScoreLigne, { color: couleurs.texte }, isLive && { color: couleurs.rouge }]}>{item.scoreDom}</Text>
            )}
          </View>
          {/* Équipe Extérieure */}
          <View style={styles.ligneEquipe}>
            {clubExt.logo ? (
              <Image source={clubExt.logo} style={styles.cercleInitiale} />
            ) : (
              <View style={[styles.cercleInitiale, { backgroundColor: couleurs.cercleRouge }]}>
                <Text style={styles.texteInitiale}>{getInitialeClub(item.clubExtId)}</Text>
              </View>
            )}
            <Text style={[styles.nomEquipe, { color: couleurs.texte }]} numberOfLines={1}>{clubExt.nom}</Text>
            {item.scoreExt !== null && (
              <Text style={[styles.texteScoreLigne, { color: couleurs.texte }, isLive && { color: couleurs.rouge }]}>{item.scoreExt}</Text>
            )}
          </View>
        </View>

        {/* Colonne Probabilités */}
        <View style={styles.colonneCotes}>
          <Text style={[styles.texteCote, { color: getCouleurProb(item.prediction.victoireDom) }]}>
            {item.prediction.victoireDom}%
          </Text>
          <Text style={[styles.texteCote, { color: getCouleurProb(item.prediction.nul) }]}>
            {item.prediction.nul}%
          </Text>
          <Text style={[styles.texteCote, { color: getCouleurProb(item.prediction.victoireExt) }]}>
            {item.prediction.victoireExt}%
          </Text>
        </View>

        {/* Colonne Notification */}
        <TouchableOpacity style={styles.colonneFavori} onPress={() => toggleNotificationMatch(item.id)}>
          <Ionicons
            name={isNotifActif ? 'notifications' : 'notifications-outline'}
            size={22}
            color={isNotifActif ? "#FFD700" : couleurs.texteQuaternaire}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // --- RENDER HEADER DE SECTION (Date + Ligue + Journée) ---
  const renderSectionHeader = ({ section }) => (
    <View style={[styles.enteteLigue, { backgroundColor: couleurs.fondSecondaire, flexDirection: 'column', alignItems: 'center', paddingVertical: 10 }]}>
      {/* Date du jour centrée */}
      <View style={{ backgroundColor: couleurs.fondTertiaire, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, marginBottom: 8 }}>
        <Text style={{ color: couleurs.texte, fontWeight: 'bold', fontSize: 13 }}>{section.date}</Text>
      </View>
      
      {/* Ligue et Journée */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="football" size={16} color={couleurs.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.texteLigue, { color: couleurs.texteTertiaire }]}>{section.title.split(' - ')[0]}</Text>
        </View>
        <Text style={[styles.texteJournee, { color: couleurs.texteTertiaire }]}>{section.title.split(' - ')[1]}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* ============================================ */}
      {/* TOP BAR                                       */}
      {/* ============================================ */}
      <View style={[styles.topBar, { backgroundColor: couleurs.header }]}>
        <Text style={[styles.titreTopBar, { color: couleurs.texte }]}>DIRECT & RÉSULTATS</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setRechercheVisible(!rechercheVisible)} style={{ marginRight: 15 }}>
            <Ionicons name="search" size={22} color={couleurs.texte} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="filter" size={22} color={couleurs.texte} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================ */}
      {/* BARRE DE RECHERCHE (toggle)                   */}
      {/* ============================================ */}
      {rechercheVisible && (
        <View style={[styles.barreRecherche, { backgroundColor: couleurs.fondSecondaire }]}>
          <Ionicons name="search" size={18} color={couleurs.texteTertiaire} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.inputRecherche, { color: couleurs.inputTexte }]}
            placeholder="Rechercher une équipe..."
            placeholderTextColor={couleurs.textePlaceholder}
            value={rechercheTexte}
            onChangeText={setRechercheTexte}
            autoFocus
          />
          {rechercheTexte.length > 0 && (
            <TouchableOpacity onPress={() => setRechercheTexte('')}>
              <Ionicons name="close-circle" size={20} color={couleurs.texteTertiaire} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ============================================ */}
      {/* FILTRES LIGUE                                 */}
      {/* ============================================ */}
      <View style={styles.conteneurFiltres}>
        {['Tout', 'Elite 1', 'Elite 2'].map((ligue) => (
          <TouchableOpacity
            key={ligue}
            style={[styles.btnFiltre,
              { backgroundColor: couleurs.fondSecondaire },
              filtreLigue === ligue && { backgroundColor: couleurs.accentFond, borderWidth: 1, borderColor: couleurs.accent }]}
            onPress={() => setFiltreLigue(ligue)}
          >
            <Text style={[styles.txtFiltre, { color: couleurs.texteTertiaire }, filtreLigue === ligue && { color: couleurs.texte }]}>
              {ligue}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ============================================ */}
      {/* FILTRES STATUT                                */}
      {/* ============================================ */}
      <View style={styles.conteneurFiltresStatut}>
        {['Tout', 'En cours', 'À venir', 'Terminé'].map((statut) => (
          <TouchableOpacity
            key={statut}
            style={[styles.btnFiltreStatut,
              { backgroundColor: couleurs.fondSecondaire },
              filtreStatut === statut && styles.btnFiltreStatutActif]}
            onPress={() => setFiltreStatut(statut)}
          >
            <Text style={[styles.txtFiltreStatut, { color: couleurs.texteTertiaire }, filtreStatut === statut && { color: '#FFF' }]}>
              {statut}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ============================================ */}
      {/* LISTE DES MATCHS                              */}
      {/* ============================================ */}
      {sections.length === 0 ? (
        <View style={styles.conteneurVide}>
          <Ionicons name="football-outline" size={50} color={couleurs.texteQuaternaire} />
          <Text style={[styles.texteVide, { color: couleurs.texteTertiaire }]}>Aucun match trouvé</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={afficherMatch}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingTop: 50, paddingBottom: 15,
  },
  titreTopBar: { fontSize: 18, fontWeight: 'bold' },

  // Barre recherche
  barreRecherche: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 15, paddingHorizontal: 15, borderRadius: 10, marginBottom: 10,
  },
  inputRecherche: { flex: 1, height: 42, fontSize: 14 },

  // Filtres ligue
  conteneurFiltres: {
    flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10, marginTop: 10,
  },
  btnFiltre: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    marginRight: 10,
  },
  txtFiltre: { fontSize: 13, fontWeight: '600' },

  // Filtres statut
  conteneurFiltresStatut: {
    flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 10,
  },
  btnFiltreStatut: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15,
    marginRight: 8,
  },
  btnFiltreStatutActif: { backgroundColor: '#2E7D32' },
  txtFiltreStatut: { fontSize: 12, fontWeight: '600' },

  // Section header (nom de la ligue)
  enteteLigue: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 10,
  },
  texteLigue: { fontSize: 14, fontWeight: 'bold' },
  texteJournee: { fontSize: 12 },

  // Match card
  corpsMatch: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15,
    borderBottomWidth: 1, alignItems: 'center',
  },
  colonneTemps: { width: 45, alignItems: 'center' },
  texteHeure: { fontSize: 12, fontWeight: '600' },
  texteMinuteRouge: { fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  texteTermine: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  separateurVertical: { width: 1, height: '100%', marginHorizontal: 10 },

  colonneEquipes: { flex: 1 },
  ligneEquipe: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  cercleInitiale: {
    width: 22, height: 22, borderRadius: 11, justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  texteInitiale: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  nomEquipe: { flex: 1, fontSize: 13, fontWeight: '500' },
  texteScoreLigne: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  colonneCotes: { width: 45, alignItems: 'flex-end', justifyContent: 'center' },
  texteCote: { fontSize: 11, fontWeight: 'bold', marginVertical: 1 },

  colonneFavori: { width: 35, alignItems: 'center', justifyContent: 'center' },

  // Vide
  conteneurVide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texteVide: { fontSize: 15, marginTop: 10 },
});
