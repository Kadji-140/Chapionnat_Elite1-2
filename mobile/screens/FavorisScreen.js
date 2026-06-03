// screens/FavorisScreen.js - Écran des favoris (Équipes, Ligues, Joueurs)
// Les favoris sont gérés via DonneesContexte et persistés dans AsyncStorage
// TODO: Synchroniser avec l'API de Patrick via POST/DELETE /api/favoris

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';

// Ligues disponibles (données statiques car seulement 2 ligues)
const LIGUES = [
  { id: 'l1', nom: 'Elite 1', pays: 'Cameroun' },
  { id: 'l2', nom: 'Elite 2', pays: 'Cameroun' },
];

export default function EcranFavoris() {
  const {
    clubs,
    joueurs,
    matchs,
    getClubById,
    getInitialeClub,
    favorisClubIds,
    favorisJoueurIds,
    favorisMatchIds,
    toggleFavoriClub,
    toggleFavoriJoueur,
    toggleFavoriMatch,
  } = useContext(DonneesContexte);
  const { couleurs } = useTheme();

  const [ongletActif, setOngletActif] = useState('Équipes');
  const [rechercheJoueur, setRechercheJoueur] = useState('');
  const [rechercheEquipe, setRechercheEquipe] = useState('');

  // ============================================
  // ONGLET : ÉQUIPES
  // ============================================
  const renderEquipes = () => {
    // Filtrer les clubs favoris + recherche
    const equipesAffichees = clubs.filter((club) => {
      const estFavori = favorisClubIds.includes(club.id);
      const correspondRecherche = club.nom.toLowerCase().includes(rechercheEquipe.toLowerCase());
      // Afficher : soit tous (pour permettre d'ajouter), soit filtrer par recherche
      return correspondRecherche;
    });

    return (
      <View style={{ flex: 1 }}>
        {/* Barre de recherche */}
        <View style={[styles.rechercheConteneur, { backgroundColor: couleurs.fondTertiaire, borderColor: couleurs.separateur }]}>
          <Ionicons name="search" size={18} color={couleurs.texteTertiaire} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.inputRecherche, { color: couleurs.inputTexte }]}
            placeholder="Rechercher une équipe..."
            placeholderTextColor={couleurs.textePlaceholder}
            value={rechercheEquipe}
            onChangeText={setRechercheEquipe}
          />
          {rechercheEquipe.length > 0 && (
            <TouchableOpacity onPress={() => setRechercheEquipe('')}>
              <Ionicons name="close-circle" size={18} color={couleurs.texteTertiaire} />
            </TouchableOpacity>
          )}
        </View>

        {/* Compteur de favoris */}
        <Text style={[styles.compteurFavoris, { color: couleurs.accent }]}>
          {favorisClubIds.length} équipe(s) en favoris
        </Text>

        <FlatList
          key={'flatlist-equipes'}
          data={equipesAffichees}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listeGrille}
          columnWrapperStyle={styles.ligneGrille}
          renderItem={({ item }) => {
            const isFavori = favorisClubIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.carteEquipe, { backgroundColor: couleurs.carte }, isFavori && { borderWidth: 1, borderColor: couleurs.accent }]}
                onPress={() => toggleFavoriClub(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.enteteCarte}>
                  {item.logo ? (
                    <Image source={item.logo} style={styles.cercleClub} />
                  ) : (
                    <View style={[styles.cercleClub, { backgroundColor: isFavori ? couleurs.cercleBleu : couleurs.fondTertiaire }]}>
                      <Text style={styles.texteInitialeCarte}>{item.nom.charAt(0)}</Text>
                    </View>
                  )}
                  <Ionicons
                    name={isFavori ? 'star' : 'star-outline'}
                    size={20}
                    color={isFavori ? couleurs.accent : couleurs.texteQuaternaire}
                  />
                </View>
                <Text style={[styles.nomEquipeCarte, { color: couleurs.texte }]}>{item.nom}</Text>
                <View style={styles.infoLigue}>
                  <Ionicons name="football" size={12} color={couleurs.texteTertiaire} />
                  <Text style={[styles.texteLigue, { color: couleurs.texteTertiaire }]}>{item.ligue}</Text>
                </View>
                <Text style={[styles.texteVille, { color: couleurs.texteQuaternaire }]}>{item.ville}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // ============================================
  // ONGLET : LIGUES
  // ============================================
  const renderLigues = () => (
    <FlatList
      key={'flatlist-ligues'}
      data={LIGUES}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.listeGrille}
      columnWrapperStyle={styles.ligneGrille}
      renderItem={({ item }) => (
        <View style={[styles.carteEquipe, { backgroundColor: couleurs.carte }]}>
          <View style={styles.enteteCarte}>
            <View style={[styles.cercleClub, { backgroundColor: item.nom === 'Elite 1' ? '#2E7D32' : '#F9A825' }]}>
              <Text style={styles.texteInitialeCarte}>{item.nom === 'Elite 1' ? 'E1' : 'E2'}</Text>
            </View>
            <Ionicons name="star" size={20} color={couleurs.accent} />
          </View>
          <Text style={[styles.nomEquipeCarte, { color: couleurs.texte }]}>{item.nom}</Text>
          <View style={styles.infoLigue}>
            <Ionicons name="flag" size={12} color={couleurs.texteTertiaire} />
            <Text style={[styles.texteLigue, { color: couleurs.texteTertiaire }]}>{item.pays}</Text>
          </View>
        </View>
      )}
    />
  );

  // ============================================
  // ONGLET : JOUEURS
  // ============================================
  const renderJoueurs = () => {
    const joueursFiltres = joueurs.filter(j =>
      j.nom.toLowerCase().includes(rechercheJoueur.toLowerCase())
    );

    return (
      <View style={{ flex: 1 }}>
        {/* Barre de recherche */}
        <View style={[styles.rechercheConteneur, { backgroundColor: couleurs.fondTertiaire, borderColor: couleurs.separateur }]}>
          <Ionicons name="search" size={18} color={couleurs.texteTertiaire} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.inputRecherche, { color: couleurs.inputTexte }]}
            placeholder="Rechercher un joueur..."
            placeholderTextColor={couleurs.textePlaceholder}
            value={rechercheJoueur}
            onChangeText={setRechercheJoueur}
          />
          {rechercheJoueur.length > 0 && (
            <TouchableOpacity onPress={() => setRechercheJoueur('')}>
              <Ionicons name="close-circle" size={18} color={couleurs.texteTertiaire} />
            </TouchableOpacity>
          )}
        </View>

        {/* Compteur */}
        <Text style={styles.compteurFavoris}>
          {favorisJoueurIds.length} joueur(s) en favoris
        </Text>

        <FlatList
          key={'flatlist-joueurs'}
          data={joueursFiltres}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isFavori = favorisJoueurIds.includes(item.id);
            const club = getClubById(item.clubId);
            return (
              <TouchableOpacity
                style={[styles.carteJoueur, { backgroundColor: couleurs.carte }, isFavori && { borderWidth: 1, borderColor: couleurs.accent }]}
                onPress={() => toggleFavoriJoueur(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.cercleAvatar, { backgroundColor: isFavori ? couleurs.cercleBleu : couleurs.fondTertiaire }]}>
                  <Text style={styles.texteAvatarJoueur}>{item.nom.charAt(0)}</Text>
                </View>
                <View style={styles.infosJoueur}>
                  <Text style={[styles.nomJoueurListe, { color: couleurs.texte }]}>{item.nom}</Text>
                  <Text style={[styles.texteClubJoueur, { color: couleurs.texteTertiaire }]}>{club.nom} • {item.poste}</Text>
                  <Text style={[styles.texteNumero, { color: couleurs.texteQuaternaire }]}>N° {item.numero}</Text>
                </View>
                <Ionicons
                  name={isFavori ? 'star' : 'star-outline'}
                  size={24}
                  color={isFavori ? couleurs.accent : couleurs.texteQuaternaire}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // ============================================
  // ONGLET : MATCHS FAVORIS
  // ============================================
  const renderMatchsFavoris = () => {
    const matchsFav = matchs.filter(m => favorisMatchIds.includes(m.id));

    if (matchsFav.length === 0) {
      return (
        <View style={styles.vide}>
          <Ionicons name="star-outline" size={50} color={couleurs.texteQuaternaire} />
          <Text style={[styles.texteVide, { color: couleurs.texteTertiaire }]}>Aucun match en favoris</Text>
          <Text style={[styles.sousTitreVide, { color: couleurs.texteQuaternaire }]}>
            Appuie sur l'étoile ⭐ d'un match pour l'ajouter ici
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        key={'flatlist-matchs'}
        data={matchsFav}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const clubDom = getClubById(item.clubDomId);
          const clubExt = getClubById(item.clubExtId);
          const isLive = item.statut === 'En cours';
          return (
            <View style={[styles.carteMatchFavori, { backgroundColor: couleurs.carte }]}>
              <View style={styles.enTeteMatchFav}>
                <Text style={[styles.texteJourneeFav, { color: couleurs.texteTertiaire }]}>{item.ligue} • {item.journee}</Text>
                <TouchableOpacity onPress={() => toggleFavoriMatch(item.id)}>
                  <Ionicons name="star" size={20} color={couleurs.accent} />
                </TouchableOpacity>
              </View>
              <View style={styles.corpsMatchFav}>
                <View style={styles.equipeFav}>
                  {clubDom.logo ? (
                    <Image source={clubDom.logo} style={styles.cercleClubFav} />
                  ) : (
                    <View style={[styles.cercleClubFav, { backgroundColor: '#1565C0' }]}>
                      <Text style={styles.texteCercleFav}>{clubDom.nom.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={[styles.nomEquipeFav, { color: couleurs.texte }]} numberOfLines={1}>{clubDom.nom}</Text>
                </View>
                <View style={styles.scoreFav}>
                  {item.scoreDom !== null ? (
                    <Text style={[styles.texteScoreFav, { color: couleurs.texte }, isLive && { color: couleurs.rouge }]}>
                      {item.scoreDom} - {item.scoreExt}
                    </Text>
                  ) : (
                    <Text style={[styles.texteHeureFav, { color: couleurs.texteTertiaire }]}>{item.heure}</Text>
                  )}
                  <Text style={[styles.statutFav, { color: couleurs.texteTertiaire }, isLive && { color: couleurs.rouge }]}>
                    {item.statut}
                  </Text>
                </View>
                <View style={[styles.equipeFav, { alignItems: 'flex-end' }]}>
                  {clubExt.logo ? (
                    <Image source={clubExt.logo} style={styles.cercleClubFav} />
                  ) : (
                    <View style={[styles.cercleClubFav, { backgroundColor: '#C62828' }]}>
                      <Text style={styles.texteCercleFav}>{clubExt.nom.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={[styles.nomEquipeFav, { color: couleurs.texte }]} numberOfLines={1}>{clubExt.nom}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    );
  };

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  const renderContenu = () => {
    switch (ongletActif) {
      case 'Équipes': return renderEquipes();
      case 'Ligues': return renderLigues();
      case 'Joueurs': return renderJoueurs();
      case 'Matchs': return renderMatchsFavoris();
      default: return null;
    }
  };

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* ONGLETS */}
      <View style={[styles.conteneurOnglets, { backgroundColor: couleurs.fondSecondaire }]}>
        {['Matchs', 'Équipes', 'Ligues', 'Joueurs'].map((onglet) => (
          <TouchableOpacity
            key={onglet}
            style={[styles.onglet, ongletActif === onglet && [styles.ongletActif, { borderBottomColor: couleurs.accent }]]}
            onPress={() => setOngletActif(onglet)}
          >
            <Text style={[styles.texteOnglet, { color: couleurs.texteTertiaire }, ongletActif === onglet && { color: couleurs.texte }]}>
              {onglet.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.corps}>
        {renderContenu()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // Onglets
  conteneurOnglets: { flexDirection: 'row', backgroundColor: '#1A1A1A', paddingTop: 5 },
  onglet: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  ongletActif: { borderBottomWidth: 3, borderBottomColor: '#FFF' },
  texteOnglet: { color: '#888', fontSize: 12, fontWeight: '600' },
  texteOngletActif: { color: '#FFF' },

  // Corps
  corps: { flex: 1, padding: 10 },

  // Recherche
  rechercheConteneur: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E',
    borderRadius: 10, paddingHorizontal: 15, marginBottom: 5, borderWidth: 1, borderColor: '#333',
  },
  inputRecherche: { flex: 1, height: 42, color: '#FFF', fontSize: 14 },

  // Compteur
  compteurFavoris: { color: '#1E90FF', fontSize: 12, fontWeight: '600', paddingVertical: 8, paddingHorizontal: 5 },

  // Grille
  listeGrille: { paddingBottom: 20 },
  ligneGrille: { justifyContent: 'space-between' },

  // Carte Équipe
  carteEquipe: { flex: 1, backgroundColor: '#1E1E1E', margin: 5, borderRadius: 12, padding: 15, maxWidth: '47%' },
  carteEquipeFavori: { borderWidth: 1, borderColor: '#1E90FF' },
  enteteCarte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cercleClub: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  texteInitialeCarte: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  nomEquipeCarte: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8, minHeight: 35 },
  infoLigue: { flexDirection: 'row', alignItems: 'center' },
  texteLigue: { color: '#888', fontSize: 11, marginLeft: 4 },
  texteVille: { color: '#555', fontSize: 11, marginTop: 4 },

  // Carte Joueur
  carteJoueur: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E',
    borderRadius: 12, padding: 15, marginBottom: 8,
  },
  carteJoueurFavori: { borderWidth: 1, borderColor: '#1E90FF' },
  cercleAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  texteAvatarJoueur: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  infosJoueur: { flex: 1 },
  nomJoueurListe: { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  texteClubJoueur: { color: '#888', fontSize: 12 },
  texteNumero: { color: '#555', fontSize: 11, marginTop: 2 },

  // Match Favori
  carteMatchFavori: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 15, marginBottom: 10 },
  enTeteMatchFav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  texteJourneeFav: { color: '#888', fontSize: 12 },
  corpsMatchFav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  equipeFav: { flex: 1, alignItems: 'center' },
  cercleClubFav: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  texteCercleFav: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  nomEquipeFav: { color: '#FFF', fontSize: 12, textAlign: 'center', fontWeight: '500' },
  scoreFav: { alignItems: 'center', paddingHorizontal: 10 },
  texteScoreFav: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  texteHeureFav: { color: '#888', fontSize: 14, fontWeight: '600' },
  statutFav: { color: '#888', fontSize: 11, marginTop: 4 },

  // Vide
  vide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  texteVide: { color: '#888', fontSize: 16, marginTop: 15 },
  sousTitreVide: { color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
