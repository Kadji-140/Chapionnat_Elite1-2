// screens/ActualitesScreen.js - Écran des actualités du football camerounais
// Affiche les dernières nouvelles, transferts, et événements des championnats Elite 1 & 2
// TODO: Remplacer les Mock Data par GET /api/actualites

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexte/ThemeContexte';

// Icônes par catégorie
const ICONE_CATEGORIE = {
  'Fecafoot': { name: 'document-text-outline', color: '#4CAF50' },
  'Elite 1': { name: 'football', color: '#1E90FF' },
  'Elite 2': { name: 'football-outline', color: '#FFB300' },
  'Transferts': { name: 'swap-horizontal-outline', color: '#9C27B0' },
  'Officiel': { name: 'shield-checkmark-outline', color: '#FFD700' },
};

import { DonneesContexte } from '../contexte/DonneesContexte';

export default function EcranActualites({ navigation }) {
  const { couleurs } = useTheme();
  const { actualites } = React.useContext(DonneesContexte);
  const [filtreCategorie, setFiltreCategorie] = useState('Tout');

  const categories = ['Tout', 'Fecafoot', 'Elite 1', 'Elite 2', 'Transferts', 'Officiel'];

  const lesActus = actualites && actualites.length > 0 ? actualites : [];

  const actualitesFiltrees = filtreCategorie === 'Tout'
    ? lesActus
    : lesActus.filter(a => a.categorie === filtreCategorie);

  const iconeInfo = (categorie) => ICONE_CATEGORIE[categorie] || { name: 'newspaper-outline', color: '#888' };

  const ouvrirDetailActualite = (actu) => {
    navigation.navigate('ActualiteDetail', { actu });
  };

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* TOP BAR */}
      <View style={[styles.topBar, { backgroundColor: couleurs.header }]}>
        <Text style={[styles.titreTopBar, { color: couleurs.texte }]}>ACTUALITÉS</Text>
        <Ionicons name="notifications-outline" size={22} color={couleurs.texte} />
      </View>
      {/* BANDE CAMEROUN */}
      <View style={{ flexDirection: 'row', height: 3, width: '100%' }}>
        <View style={{ flex: 1, backgroundColor: couleurs.camerounVert || '#007A5E' }} />
        <View style={{ flex: 1, backgroundColor: couleurs.camerounRouge || '#CE1126' }} />
        <View style={{ flex: 1, backgroundColor: couleurs.camerounJaune || '#FCD116' }} />
      </View>

      {/* FILTRES CATÉGORIES */}
      <View style={{ height: 50 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresScroll} contentContainerStyle={styles.filtresContainer}>
          {categories.map((cat) => {
            const actif = filtreCategorie === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.btnFiltre,
                  { backgroundColor: actif ? couleurs.accent : couleurs.fondSecondaire },
                ]}
                onPress={() => setFiltreCategorie(cat)}
              >
                <Text style={[styles.txtFiltre, { color: actif ? '#FFF' : couleurs.texteTertiaire }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LISTE DES ACTUALITÉS */}
      <ScrollView style={styles.listeScroll} showsVerticalScrollIndicator={false}>
        {/* ACTUALITÉ À LA UNE */}
        {filtreCategorie === 'Tout' && lesActus.length > 0 && (
          <TouchableOpacity 
            style={[styles.carteUne, { backgroundColor: couleurs.accent }]}
            onPress={() => ouvrirDetailActualite(lesActus[0])}
            activeOpacity={0.9}
          >
            <Image 
              source={lesActus[0].image} 
              style={styles.imageUne} 
            />
            <View style={styles.overlayUne}>
                <View style={styles.badgeUne}>
                <Ionicons name="flame" size={12} color="#FFF" />
                <Text style={styles.badgeUneTexte}>À la une</Text>
                </View>
                <Text style={styles.titreUne}>{lesActus[0].titre}</Text>
                <View style={styles.metaUne}>
                <Text style={styles.sourceUne}>{lesActus[0].categorie}</Text>
                <Text style={styles.dateUne}>{lesActus[0].date}</Text>
                </View>
            </View>
          </TouchableOpacity>
        )}

        {/* LISTE STANDARD */}
        {actualitesFiltrees.map((actu) => {
          const icone = iconeInfo(actu.categorie);
          return (
            <TouchableOpacity 
                key={actu.id} 
                style={[styles.carteActu, { backgroundColor: couleurs.carte }]} 
                activeOpacity={0.7}
                onPress={() => ouvrirDetailActualite(actu)}
            >
              <Image source={actu.image} style={styles.imageActuMini} />
              <View style={styles.contenuActu}>
                <View style={styles.enteteActu}>
                  <View style={[styles.badgeCategorie, { backgroundColor: `${icone.color}20` }]}>
                    <Text style={[styles.texteBadgeCategorie, { color: icone.color }]}>{actu.categorie}</Text>
                  </View>
                  <Text style={[styles.badgeLigue, { color: couleurs.texteTertiaire }]}>{actu.ligue}</Text>
                </View>
                <Text style={[styles.titreActu, { color: couleurs.texte }]} numberOfLines={2}>{actu.titre}</Text>
                <View style={styles.metaActu}>
                  <Text style={[styles.sourceActu, { color: couleurs.accent }]}>{actu.source}</Text>
                  <Text style={[styles.dateActu, { color: couleurs.texteQuaternaire }]}>{actu.datePublication}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {actualitesFiltrees.length === 0 && (
          <View style={styles.conteneurVide}>
            <Ionicons name="newspaper-outline" size={50} color={couleurs.texteQuaternaire} />
            <Text style={[styles.texteVide, { color: couleurs.texteTertiaire }]}>Aucune actualité dans cette catégorie</Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingTop: 50, paddingBottom: 15,
  },
  titreTopBar: { fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

  // Filtres
  filtresScroll: { maxHeight: 50 },
  filtresContainer: { paddingHorizontal: 15, paddingBottom: 10, gap: 8 },
  btnFiltre: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  txtFiltre: { fontSize: 13, fontWeight: '600' },

  // Carte à la une
  carteUne: {
    marginHorizontal: 15, marginBottom: 15, borderRadius: 16, 
    height: 220, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  imageUne: {
    width: '100%', height: '100%', position: 'absolute',
  },
  overlayUne: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'flex-end',
  },
  badgeUne: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E53935',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12,
  },
  badgeUneTexte: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  titreUne: { color: '#FFF', fontSize: 20, fontWeight: 'bold', lineHeight: 26, marginBottom: 8 },
  metaUne: { flexDirection: 'row', justifyContent: 'space-between' },
  sourceUne: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  dateUne: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // Carte standard
  carteActu: {
    flexDirection: 'row', marginHorizontal: 15, marginBottom: 12,
    borderRadius: 14, padding: 12, alignItems: 'center'
  },
  imageActuMini: {
    width: 90, height: 90, borderRadius: 10, marginRight: 12,
  },
  contenuActu: { flex: 1, height: 90, justifyContent: 'space-between' },
  enteteActu: { flexDirection: 'row', alignItems: 'center' },
  badgeCategorie: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  texteBadgeCategorie: { fontSize: 10, fontWeight: 'bold' },
  badgeLigue: { fontSize: 11, fontWeight: '500' },
  titreActu: { fontSize: 15, fontWeight: 'bold', lineHeight: 20 },
  metaActu: { flexDirection: 'row', justifyContent: 'space-between' },
  sourceActu: { fontSize: 11, fontWeight: '600' },
  dateActu: { fontSize: 11 },

  // Vide
  conteneurVide: { alignItems: 'center', paddingTop: 60 },
  texteVide: { fontSize: 15, marginTop: 10 },

  listeScroll: { flex: 1 },
});
