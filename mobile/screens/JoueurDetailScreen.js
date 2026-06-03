// screens/JoueurDetailScreen.js
import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';

export default function EcranJoueurDetail({ route, navigation }) {
  const { joueurId } = route.params;
  const { joueurs, getClubById, favorisJoueurIds, toggleFavoriJoueur } = useContext(DonneesContexte);
  const { couleurs, estSombre } = useTheme();

  const joueur = joueurs.find(j => j.id === joueurId) || { nom: 'Inconnu', poste: 'Inconnu', numero: 0, clubId: '', photo: null };
  const club = getClubById(joueur.clubId);
  const isFavori = favorisJoueurIds.includes(joueur.id);

  // Génération de stats déterministes basées sur l'ID
  const genererStatAleatoire = (str, max) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
  };

  const stats = useMemo(() => {
    return {
      matchsJoues: genererStatAleatoire(joueur.id + 'mj', 5) + 5,
      buts: joueur.poste === 'Attaquant' ? genererStatAleatoire(joueur.id + 'but', 12) : (joueur.poste === 'Milieu' ? genererStatAleatoire(joueur.id + 'but', 5) : 0),
      passes: genererStatAleatoire(joueur.id + 'passe', 8),
      cartonsJaunes: genererStatAleatoire(joueur.id + 'cj', 4),
      cartonsRouges: genererStatAleatoire(joueur.id + 'cr', 2),
      minutesJouees: (genererStatAleatoire(joueur.id + 'mj', 5) + 5) * 80 + genererStatAleatoire(joueur.id + 'min', 50),
    };
  }, [joueur.id, joueur.poste]);

  // Déterminer une note fictive pour le design "carte" (ex: 85)
  const noteGenerale = 70 + genererStatAleatoire(joueur.id + 'note', 20);

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* HEADER HERO (Style FIFA/Sorare) */}
      <View style={[styles.headerHero, { backgroundColor: couleurs.accent }]}>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnActionIcone}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavoriJoueur(joueur.id)} style={styles.btnActionIcone}>
            <Ionicons name={isFavori ? "star" : "star-outline"} size={22} color={isFavori ? "#FFD700" : "#FFF"} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfosJoueur}>
          <View style={styles.photoBadgeConteneur}>
            {/* Note Générale (Style jeu vidéo) */}
            <View style={styles.badgeNote}>
              <Text style={styles.texteNote}>{noteGenerale}</Text>
            </View>

            {joueur.photo ? (
              <Image source={joueur.photo} style={styles.imagePhoto} />
            ) : (
              <View style={[styles.cercleJoueurHero, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.initialeJoueurHero}>{joueur.nom.charAt(0)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.nomJoueurHero}>{joueur.nom}</Text>
          
          <View style={styles.clubInfosContainer}>
            {club.logo ? (
              <Image source={club.logo} style={styles.logoClubPetit} />
            ) : (
              <View style={[styles.logoClubPetit, { backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: couleurs.accent, fontWeight: 'bold', fontSize: 10 }}>{club.nom.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.texteClubHero}>{club.nom}</Text>
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagTexte}>{joueur.poste}</Text>
            </View>
            <View style={styles.tagBadge}>
              <Text style={styles.tagTexte}>N° {joueur.numero}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.contenu}>
        <Text style={[styles.titreSection, { color: couleurs.texte }]}>Statistiques de la saison</Text>

        {/* CARTES STATS AVANCÉES */}
        <View style={styles.grilleStats}>
          <View style={[styles.carteStat, { backgroundColor: couleurs.carte, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }]}>
            <View style={styles.enTeteStat}>
              <Ionicons name="football" size={20} color={couleurs.texteTertiaire} />
              <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Buts</Text>
            </View>
            <Text style={[styles.valeurStat, { color: couleurs.texte }]}>{stats.buts}</Text>
          </View>

          <View style={[styles.carteStat, { backgroundColor: couleurs.carte, borderLeftWidth: 4, borderLeftColor: couleurs.accent }]}>
            <View style={styles.enTeteStat}>
              <Ionicons name="walk" size={20} color={couleurs.texteTertiaire} />
              <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Passes</Text>
            </View>
            <Text style={[styles.valeurStat, { color: couleurs.texte }]}>{stats.passes}</Text>
          </View>

          <View style={[styles.carteStat, { backgroundColor: couleurs.carte, borderLeftWidth: 4, borderLeftColor: '#FF9800' }]}>
            <View style={styles.enTeteStat}>
              <Ionicons name="calendar" size={20} color={couleurs.texteTertiaire} />
              <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Matchs</Text>
            </View>
            <Text style={[styles.valeurStat, { color: couleurs.texte }]}>{stats.matchsJoues}</Text>
          </View>

          <View style={[styles.carteStat, { backgroundColor: couleurs.carte, borderLeftWidth: 4, borderLeftColor: '#9C27B0' }]}>
            <View style={styles.enTeteStat}>
              <Ionicons name="time" size={20} color={couleurs.texteTertiaire} />
              <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Minutes</Text>
            </View>
            <Text style={[styles.valeurStat, { color: couleurs.texte }]}>{stats.minutesJouees}'</Text>
          </View>
        </View>

        {/* DISCIPLINE */}
        <Text style={[styles.titreSection, { color: couleurs.texte, marginTop: 20 }]}>Discipline</Text>
        <View style={[styles.disciplineContainer, { backgroundColor: couleurs.carte }]}>
          <View style={styles.disciplineRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.carton, { backgroundColor: '#FDD835' }]} />
              <Text style={[styles.disciplineTexte, { color: couleurs.texte }]}>Cartons jaunes</Text>
            </View>
            <Text style={[styles.disciplineValeur, { color: couleurs.texte }]}>{stats.cartonsJaunes}</Text>
          </View>
          <View style={[styles.separateur, { backgroundColor: couleurs.separateur }]} />
          <View style={styles.disciplineRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.carton, { backgroundColor: '#E53935' }]} />
              <Text style={[styles.disciplineTexte, { color: couleurs.texte }]}>Cartons rouges</Text>
            </View>
            <Text style={[styles.disciplineValeur, { color: couleurs.texte }]}>{stats.cartonsRouges}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  headerHero: {
    paddingTop: 50, paddingBottom: 30,
    borderBottomLeftRadius: 35, borderBottomRightRadius: 35,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  headerActions: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  btnActionIcone: { padding: 10, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  headerInfosJoueur: { alignItems: 'center', marginTop: 10 },
  photoBadgeConteneur: { position: 'relative', marginBottom: 15 },
  cercleJoueurHero: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  imagePhoto: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FFF',
  },
  badgeNote: {
    position: 'absolute', top: -5, right: -10,
    backgroundColor: '#FFD700', width: 35, height: 35, borderRadius: 17.5,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10, borderWidth: 2, borderColor: '#FFF',
  },
  texteNote: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  initialeJoueurHero: { fontSize: 45, fontWeight: 'bold', color: '#FFF' },
  nomJoueurHero: { fontSize: 26, fontWeight: '900', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  
  clubInfosContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoClubPetit: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  texteClubHero: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  tagsContainer: { flexDirection: 'row', gap: 10 },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20,
  },
  tagTexte: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  
  contenu: { flex: 1, padding: 20 },
  titreSection: { fontSize: 18, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  grilleStats: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },
  carteStat: {
    width: '48%', borderRadius: 16, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  enTeteStat: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  labelStat: { fontSize: 13, fontWeight: '600', marginLeft: 6, textTransform: 'uppercase' },
  valeurStat: { fontSize: 28, fontWeight: '900' },
  
  disciplineContainer: {
    borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  disciplineRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8,
  },
  carton: { width: 16, height: 24, borderRadius: 4, marginRight: 15 },
  disciplineTexte: { fontSize: 16, fontWeight: '500' },
  disciplineValeur: { fontSize: 20, fontWeight: 'bold' },
  separateur: { height: 1, width: '100%', marginVertical: 8 },
});
