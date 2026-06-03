// screens/ActualiteDetailScreen.js - Détail d'une actualité
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexte/ThemeContexte';

const { width } = Dimensions.get('window');

export default function EcranActualiteDetail({ route, navigation }) {
  const { actu } = route.params;
  const { couleurs } = useTheme();

  const partagerActualite = async () => {
    try {
      await Share.share({
        message: `${actu.titre}\n\n${actu.description}\n\nLu sur FootballApp Cameroun`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <View style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* HEADER FIXE */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.btnCercle, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity 
            onPress={partagerActualite} 
            style={[styles.btnCercle, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
        >
          <Ionicons name="share-social-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* IMAGE PRINCIPALE */}
        <Image source={actu.image} style={styles.imagePrincipale} />

        <View style={styles.corps}>
            {/* BADGES */}
            <View style={styles.ligneBadges}>
                <View style={[styles.badge, { backgroundColor: couleurs.accentFond }]}>
                    <Text style={[styles.texteBadge, { color: couleurs.accent }]}>{actu.categorie}</Text>
                </View>
                <Text style={[styles.date, { color: couleurs.texteTertiaire }]}>{actu.datePublication}</Text>
            </View>

            {/* TITRE */}
            <Text style={[styles.titre, { color: couleurs.texte }]}>{actu.titre}</Text>

            {/* SOURCE ET LIGUE */}
            <View style={styles.ligneSource}>
                <View style={styles.sourceBox}>
                    <Ionicons name="newspaper-outline" size={16} color={couleurs.accent} />
                    <Text style={[styles.source, { color: couleurs.accent }]}>{actu.source}</Text>
                </View>
                <Text style={[styles.ligue, { color: couleurs.texteQuaternaire }]}>{actu.ligue}</Text>
            </View>

            {/* SÉPARATEUR */}
            <View style={[styles.separateur, { backgroundColor: couleurs.separateur }]} />

            {/* CONTENU */}
            <Text style={[styles.description, { color: couleurs.texteSecondaire }]}>
                {actu.description}
            </Text>
            
            <Text style={[styles.contenu, { color: couleurs.texte }]}>
                {actu.contenu}
            </Text>

            <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  header: {
    position: 'absolute', top: 50, left: 0, right: 0,
    zIndex: 10, flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  btnCercle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  imagePrincipale: {
    width: width, height: 300,
  },
  corps: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#121212', // Will be dynamic if needed, but here fixed for dark theme
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ligneBadges: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 15,
  },
  badge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  texteBadge: { fontSize: 12, fontWeight: 'bold' },
  date: { fontSize: 13 },
  titre: {
    fontSize: 24, fontWeight: 'bold', lineHeight: 32, marginBottom: 15,
  },
  ligneSource: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  sourceBox: { flexDirection: 'row', alignItems: 'center' },
  source: { fontSize: 14, fontWeight: '700', marginLeft: 6 },
  ligue: { fontSize: 13, fontWeight: '600' },
  separateur: { height: 1, width: '100%', marginBottom: 20 },
  description: {
    fontSize: 16, fontWeight: '600', lineHeight: 24, fontStyle: 'italic',
    marginBottom: 20,
  },
  contenu: {
    fontSize: 16, lineHeight: 26,
  },
});
