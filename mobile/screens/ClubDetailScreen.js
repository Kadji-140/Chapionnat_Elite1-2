// screens/ClubDetailScreen.js - Détails d'un club et performances de ses joueurs
// Affiche les informations sur une équipe, l'effectif, et les statistiques individuelles

import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';

export default function EcranClubDetail({ route, navigation }) {
  const { clubId, infosStat } = route.params;
  const { 
    clubs, 
    joueurs, 
    favorisClubIds, 
    toggleFavoriClub, 
    getInitialeClub,
    clubNotificationsIds,
    toggleNotificationClub
  } = useContext(DonneesContexte);
  const { couleurs } = useTheme();
  
  const [ongletActif, setOngletActif] = useState('Aperçu');

  // Trouver le club dans Data
  let club = clubs.find(c => c.id === clubId);
  if (!club && infosStat) {
    club = { id: clubId, nom: infosStat.club, ligue: ligueAssumee(infosStat), ville: 'Cameroun' };
  } else if (!club) {
    club = { id: clubId, nom: 'Equipe inconnue', ligue: '', ville: '' };
  }

  function ligueAssumee(stat) {
    return stat.club.includes('Fortuna') || stat.club.includes('Dynamo') || stat.club.includes('Racing') ? 'Elite 2' : 'Elite 1';
  }

  const isFavori = favorisClubIds.includes(club.id);
  const isNotifActif = clubNotificationsIds.includes(club.id);

  // Fonction pour générer un nombre pseudo-aléatoire déterministe basé sur une chaîne
  const genererStatAleatoire = (str, max) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
  };

  // Filtrer les joueurs de cette équipe et générer des stats fictives (déterministes)
  const effectif = useMemo(() => {
    const effectifBase = joueurs.filter(j => j.clubId === club.id).map(j => ({
      ...j,
      matchsJoues: genererStatAleatoire(j.id + 'mj', 5) + 5,
      buts: j.poste === 'Attaquant' ? genererStatAleatoire(j.id + 'but', 6) : (j.poste === 'Milieu' ? genererStatAleatoire(j.id + 'but', 3) : 0),
      passes: genererStatAleatoire(j.id + 'passe', 4),
      cartonsJaunes: genererStatAleatoire(j.id + 'cj', 3),
      cartonsRouges: genererStatAleatoire(j.id + 'cr', 2),
    }));

    // Remplir si pas assez de joueurs
    if (effectifBase.length < 5) {
      effectifBase.push({ id: `j_fake_1_${club.id}`, nom: 'Joueur Anonyme 1', poste: 'Milieu', numero: 6, matchsJoues: 4, buts: 0, passes: 1, cartonsJaunes: 1, cartonsRouges: 0 });
      effectifBase.push({ id: `j_fake_2_${club.id}`, nom: 'Joueur Anonyme 2', poste: 'Défenseur', numero: 4, matchsJoues: 6, buts: 0, passes: 0, cartonsJaunes: 2, cartonsRouges: 1 });
      effectifBase.push({ id: `j_fake_3_${club.id}`, nom: 'Joueur Anonyme 3', poste: 'Attaquant', numero: 11, matchsJoues: 5, buts: 3, passes: 0, cartonsJaunes: 0, cartonsRouges: 0 });
      effectifBase.push({ id: `j_fake_4_${club.id}`, nom: 'Joueur Anonyme 4', poste: 'Gardien', numero: 1, matchsJoues: 7, buts: 0, passes: 0, cartonsJaunes: 0, cartonsRouges: 0 });
    }
    
    // On trie l'effectif directement ici pour ne pas le trier à chaque rendu
    return effectifBase.sort((a,b) => b.matchsJoues - a.matchsJoues);
  }, [club.id, joueurs]);

  // --- MOCK ACTUALITÉS DU CLUB ---
  const newsClub = [
    {
      id: 'nc1',
      titre: `Reprise des entraînements pour ${club.nom}`,
      date: 'Hier, 10:30',
      description: 'Le groupe a repris le chemin des terrains ce matin sous la direction du coach.',
      image: require('../assets/actualites/actu_match.png'),
    },
    {
      id: 'nc2',
      titre: 'Point médical : 2 joueurs à l\'infirmerie',
      date: 'Il y a 2 jours',
      description: 'Le staff médical a communiqué sur l\'état de santé des blessés du week-end dernier.',
      image: require('../assets/actualites/actu_officiel.png'),
    }
  ];

  // Barre de progression
  const BarreProgression = ({ valeur, max, couleurBarre }) => {
    const pourcentage = max > 0 ? (valeur / max) * 100 : 0;
    return (
      <View style={styles.barreProgressionFond}>
        <View style={[styles.barreProgressionRemplie, { width: `${pourcentage}%`, backgroundColor: couleurBarre }]} />
      </View>
    );
  };

  // --- RENDU ONGLET APERÇU ---
  const renderApercu = () => (
    <ScrollView style={styles.contenuOnglet} showsVerticalScrollIndicator={false}>
      {/* PERFORMANCES DE LA SAISON */}
      <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
        <View style={styles.titreBlocContainer}>
          <Ionicons name="stats-chart" size={18} color={couleurs.accent} />
          <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Performances de la saison</Text>
        </View>
        {infosStat ? (
          <View>
            {/* Cercles V-N-D */}
            <View style={styles.cerclesContainer}>
              <View style={styles.cercleStatWrapper}>
                <View style={[styles.cercleStat, { borderColor: '#4CAF50' }]}>
                  <Text style={[styles.cercleStatValeur, { color: '#4CAF50' }]}>{infosStat.victoires}</Text>
                </View>
                <Text style={[styles.cercleStatLabel, { color: couleurs.texteTertiaire }]}>Victoires</Text>
              </View>
              <View style={styles.cercleStatWrapper}>
                <View style={[styles.cercleStat, { borderColor: '#FFB300' }]}>
                  <Text style={[styles.cercleStatValeur, { color: '#FFB300' }]}>{infosStat.nuls}</Text>
                </View>
                <Text style={[styles.cercleStatLabel, { color: couleurs.texteTertiaire }]}>Nuls</Text>
              </View>
              <View style={styles.cercleStatWrapper}>
                <View style={[styles.cercleStat, { borderColor: '#E53935' }]}>
                  <Text style={[styles.cercleStatValeur, { color: '#E53935' }]}>{infosStat.defaites}</Text>
                </View>
                <Text style={[styles.cercleStatLabel, { color: couleurs.texteTertiaire }]}>Défaites</Text>
              </View>
            </View>

            {/* Stats détaillées avec barres */}
            <View style={styles.statsDetailContainer}>
              <View style={[styles.statDetailRow, { backgroundColor: couleurs.fondTertiaire }]}>
                <View style={styles.statDetailLeft}>
                  <Ionicons name="football" size={16} color="#4CAF50" />
                  <Text style={[styles.statDetailLabel, { color: couleurs.texte }]}>Buts marqués</Text>
                </View>
                <Text style={[styles.statDetailValue, { color: '#4CAF50' }]}>{infosStat.butsPour}</Text>
              </View>
              <BarreProgression valeur={infosStat.butsPour} max={30} couleurBarre="#4CAF50" />

              <View style={[styles.statDetailRow, { backgroundColor: couleurs.fondTertiaire, marginTop: 10 }]}>
                <View style={styles.statDetailLeft}>
                  <Ionicons name="shield" size={16} color="#E53935" />
                  <Text style={[styles.statDetailLabel, { color: couleurs.texte }]}>Buts encaissés</Text>
                </View>
                <Text style={[styles.statDetailValue, { color: '#E53935' }]}>{infosStat.butsContre}</Text>
              </View>
              <BarreProgression valeur={infosStat.butsContre} max={30} couleurBarre="#E53935" />

              <View style={[styles.statDetailRow, { backgroundColor: couleurs.fondTertiaire, marginTop: 10 }]}>
                <View style={styles.statDetailLeft}>
                  <Ionicons name="trophy" size={16} color={couleurs.accent} />
                  <Text style={[styles.statDetailLabel, { color: couleurs.texte }]}>Points totaux</Text>
                </View>
                <View style={[styles.badgePoints, { backgroundColor: couleurs.accentFond }]}>
                  <Text style={[styles.badgePointsTexte, { color: couleurs.accent }]}>{infosStat.points} pts</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <Text style={[styles.texteVide, { color: couleurs.texteTertiaire, marginTop: 10 }]}>Statistiques générales non disponibles</Text>
        )}
      </View>

      {/* FORME RÉCENTE */}
      <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
        <View style={styles.titreBlocContainer}>
          <Ionicons name="trending-up" size={18} color={couleurs.or} />
          <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Forme Récente</Text>
          <Text style={[styles.sousTitreBloc, { color: couleurs.texteTertiaire }]}>(5 derniers matchs)</Text>
        </View>
        <View style={styles.formeContainer}>
          {(club.forme || ['?', '?', '?', '?', '?']).map((res, i) => (
            <View key={i} style={[styles.cercleForme, { backgroundColor: res === 'V' ? '#4CAF50' : res === 'D' ? '#E53935' : res === 'N' ? '#FFB300' : '#444' }]}>
              <Text style={styles.texteFormeLettre}>{res}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  // --- RENDU ONGLET ACTUALITÉS CLUB ---
  const renderNews = () => (
    <ScrollView style={styles.contenuOnglet} showsVerticalScrollIndicator={false}>
      {newsClub.map((item) => (
        <TouchableOpacity key={item.id} style={[styles.carteNewsClub, { backgroundColor: couleurs.carte }]}>
            <Image source={item.image} style={styles.imageNewsClub} />
            <View style={styles.contenuNewsClub}>
                <Text style={[styles.titreNewsClub, { color: couleurs.texte }]}>{item.titre}</Text>
                <Text style={[styles.dateNewsClub, { color: couleurs.texteQuaternaire }]}>{item.date}</Text>
                <Text style={[styles.descNewsClub, { color: couleurs.texteSecondaire }]} numberOfLines={2}>{item.description}</Text>
            </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderEffectif = () => (
    <View style={styles.contenuOnglet}>
      <View style={[styles.enTeteTableauJoueurs, { backgroundColor: couleurs.accent }]}>
        <Text style={[styles.colJoueur, styles.texteEnTete, { color: '#FFF' }]}>Joueur</Text>
        <Text style={[styles.colStatPerso, styles.texteEnTete, { color: '#FFF' }]}>MJ</Text>
        <Text style={[styles.colStatPerso, styles.texteEnTete, { color: '#FFF' }]}>⚽</Text>
        <Text style={[styles.colStatPerso, styles.texteEnTete, { color: '#FFF' }]}>🟨</Text>
        <Text style={[styles.colStatPerso, styles.texteEnTete, { color: '#FFF' }]}>🟥</Text>
      </View>

      <FlatList
        data={effectif}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            style={[styles.ligneTableauJoueurs, { backgroundColor: index % 2 === 0 ? couleurs.classementLignePaire : couleurs.classementLigneImpaire }]}
            onPress={() => navigation.navigate('JoueurDetail', { joueurId: item.id })}
          >
            <View style={styles.colJoueur}>
              <Text style={[styles.texteNomJoueur, { color: couleurs.texte }]} numberOfLines={1}>{item.nom}</Text>
              <Text style={[styles.textePosteJoueur, { color: couleurs.texteTertiaire }]}>{item.poste} • N° {item.numero}</Text>
            </View>
            <Text style={[styles.colStatPerso, { color: couleurs.texteSecondaire }]}>{item.matchsJoues}</Text>
            <Text style={[styles.colStatPerso, { color: '#4CAF50', fontWeight: 'bold' }]}>{item.buts}</Text>
            <Text style={[styles.colStatPerso, { color: '#FDD835' }]}>{item.cartonsJaunes}</Text>
            <Text style={[styles.colStatPerso, { color: '#E53935', fontWeight: 'bold' }]}>{item.cartonsRouges}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* HEADER */}
      <View style={[styles.headerHero, { backgroundColor: couleurs.accent }]}>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnActionIcone}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => toggleNotificationClub(club.id)} style={[styles.btnActionIcone, { marginRight: 10 }]}>
                <Ionicons name={isNotifActif ? "notifications" : "notifications-outline"} size={22} color={isNotifActif ? "#FFD700" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavoriClub(club.id)} style={styles.btnActionIcone}>
                <Ionicons name={isFavori ? "star" : "star-outline"} size={22} color={isFavori ? "#FFD700" : "#FFF"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerInfosClub}>
          {club.logo ? (
            <Image source={club.logo} style={styles.cercleLogoGrand} />
          ) : (
            <View style={[styles.cercleLogoGrand, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
               <Text style={styles.texteLogoGrand}>{club.nom.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.nomClubInfo}>{club.nom}</Text>
          <View style={styles.badgeLigue}>
            <Ionicons name="football" size={12} color="#FFF" />
            <Text style={styles.badgeLigueTexte}>{club.ligue} • {club.ville}</Text>
          </View>
        </View>
      </View>

      {/* ONGLETS */}
      <View style={[styles.ongletsBar, { borderBottomColor: couleurs.separateur }]}>
        {['Aperçu', 'Actualités', 'Effectif'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setOngletActif(tab)} style={styles.ongletUnique}>
            <Text style={[styles.texteOnglet, { color: couleurs.texteTertiaire }, ongletActif === tab && { color: couleurs.accent }]}>
              {tab}
            </Text>
            {ongletActif === tab && <View style={[styles.ligneActiveOnglet, { backgroundColor: couleurs.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENU */}
      {ongletActif === 'Aperçu' ? renderApercu() : ongletActif === 'Actualités' ? renderNews() : renderEffectif()}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // Header Hero
  headerHero: {
    paddingTop: 50, paddingBottom: 25,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerActions: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15,
  },
  btnActionIcone: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.15)' },
  headerInfosClub: { alignItems: 'center', marginTop: 10 },
  cercleLogoGrand: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  texteLogoGrand: { color: '#FFF', fontSize: 38, fontWeight: 'bold' },
  nomClubInfo: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', paddingHorizontal: 20 },
  badgeLigue: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  badgeLigueTexte: { color: '#FFF', fontSize: 13, marginLeft: 6, fontWeight: '500' },

  // Onglets
  ongletsBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderBottomWidth: 1, marginTop: 15,
  },
  ongletUnique: { alignItems: 'center', paddingVertical: 12, flex: 1 },
  texteOnglet: { fontSize: 14, fontWeight: '600' },
  ligneActiveOnglet: { position: 'absolute', bottom: -1, width: '40%', height: 3, borderRadius: 2 },

  // Contenu
  contenuOnglet: { flex: 1 },

  // Blocs
  blocGris: {
    margin: 15, marginBottom: 0,
    borderRadius: 16, padding: 18,
  },
  titreBlocContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingBottom: 12, marginBottom: 16,
  },
  titreBloc: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  sousTitreBloc: { fontSize: 12, marginLeft: 6 },
  texteVide: { fontStyle: 'italic', textAlign: 'center', paddingVertical: 15 },

  // Cercles stats
  cerclesContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  cercleStatWrapper: { alignItems: 'center' },
  cercleStat: { 
    width: 80, height: 80, borderRadius: 40, borderWidth: 4, 
    justifyContent: 'center', alignItems: 'center',
  },
  cercleStatValeur: { fontSize: 24, fontWeight: 'bold' },
  cercleStatLabel: { fontSize: 12, marginTop: 6, fontWeight: '500' },

  // Stats détaillées
  statsDetailContainer: { marginTop: 16 },
  statDetailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12,
  },
  statDetailLeft: { flexDirection: 'row', alignItems: 'center' },
  statDetailLabel: { fontSize: 14, marginLeft: 10, fontWeight: '500' },
  statDetailValue: { fontSize: 18, fontWeight: 'bold' },
  badgePoints: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgePointsTexte: { fontSize: 16, fontWeight: 'bold' },

  // Barres de progression
  barreProgressionFond: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, marginBottom: 6,
  },
  barreProgressionRemplie: { height: 4, borderRadius: 2 },

  // Forme
  formeContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12, gap: 14 },
  cercleForme: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  texteFormeLettre: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },

  // News Club
  carteNewsClub: {
    flexDirection: 'row', marginHorizontal: 15, marginTop: 15,
    borderRadius: 12, padding: 10, alignItems: 'center'
  },
  imageNewsClub: { width: 70, height: 70, borderRadius: 8 },
  contenuNewsClub: { flex: 1, marginLeft: 12 },
  titreNewsClub: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  dateNewsClub: { fontSize: 11, marginBottom: 4 },
  descNewsClub: { fontSize: 12, lineHeight: 16 },

  // Effectif Tableau
  enTeteTableauJoueurs: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 12, marginTop: 15, marginHorizontal: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  texteEnTete: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  ligneTableauJoueurs: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 12, marginHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  colJoueur: { flex: 1, paddingRight: 8 },
  texteNomJoueur: { fontSize: 14, fontWeight: '600' },
  textePosteJoueur: { fontSize: 11, marginTop: 3 },
  colStatPerso: { width: 34, textAlign: 'center', fontSize: 14 },
});
