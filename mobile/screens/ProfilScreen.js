// screens/ProfilScreen.js - Espace personnel anonyme du supporter
// Affiche l'UUID, permet de saisir un prénom pour le chat, montre l'historique
// Intègre le sélecteur de thème (Sombre / Clair / Système)
// TODO: Synchroniser les votes/commentaires via GET /api/profil?uuid=xxx

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContexteAuth } from '../App';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';

// --- HISTORIQUE FICTIF (simulant les tables "votes" et "commentaires" de Patrick) ---
// TODO: Remplacer par GET /api/votes?uuid=xxx et GET /api/commentaires?uuid=xxx
const fauxHistoriqueVotes = [
  { id: 'v1', match: 'Bamboutos FC vs Union de Douala', joueur: 'Jean-Marie Nkoudou', date: '12 Avril 2026' },
  { id: 'v2', match: 'Coton Sport vs Canon de Yaoundé', joueur: 'Amadou Chedjou', date: '05 Avril 2026' },
];

const fauxHistoriqueCommentaires = [
  { id: 'h1', match: 'Bamboutos FC vs Union de Douala', texte: 'Quel but magnifique !', date: '12 Avril 2026' },
  { id: 'h2', match: 'Coton Sport vs Canon de Yaoundé', texte: 'Allez Coton !!', date: '05 Avril 2026' },
  { id: 'h3', match: 'Panthère vs Astres FC', texte: "On attend le coup d'envoi 🔥", date: '10 Avril 2026' },
];

export default function EcranProfil() {
  const { identifiantUUID, prenomSupporteur, setPrenomSupporteur } = useContext(ContexteAuth);
  const { favorisClubIds, favorisJoueurIds, favorisMatchIds } = useContext(DonneesContexte);
  const { couleurs, estSombre, modeTheme, changerTheme } = useTheme();

  const [champPrenom, setChampPrenom] = useState(prenomSupporteur || '');
  const [prenomSauvegarde, setPrenomSauvegarde] = useState(!!prenomSupporteur);

  useEffect(() => {
    setChampPrenom(prenomSupporteur || '');
    setPrenomSauvegarde(!!prenomSupporteur);
  }, [prenomSupporteur]);

  // --- SAUVEGARDER LE PRÉNOM ---
  const sauvegarderPrenom = async () => {
    if (champPrenom.trim() === '') {
      Alert.alert('⚠️ Attention', 'Veuillez entrer un prénom avant de sauvegarder.');
      return;
    }
    try {
      await AsyncStorage.setItem('@prenom_supporteur', champPrenom.trim());
      setPrenomSupporteur(champPrenom.trim());
      setPrenomSauvegarde(true);
      Alert.alert(
        '✅ Sauvegardé !',
        `Ton prénom "${champPrenom.trim()}" sera utilisé dans les commentaires en direct.`
      );
      // TODO: PUT /api/mobile-users/update { uuid: identifiantUUID, prenom: champPrenom }
    } catch (erreur) {
      console.error('❌ Erreur de sauvegarde :', erreur);
      Alert.alert('Erreur', 'Impossible de sauvegarder ton prénom.');
    }
  };

  // --- OPTIONS DU THÈME ---
  const optionsTheme = [
    { cle: 'systeme', label: 'Système', icone: 'phone-portrait-outline' },
    { cle: 'clair',   label: 'Clair',   icone: 'sunny-outline' },
    { cle: 'sombre',  label: 'Sombre',  icone: 'moon-outline' },
  ];

  return (
    <ScrollView style={[styles.conteneur, { backgroundColor: couleurs.fond }]}>
      {/* ============================================ */}
      {/* EN-TÊTE DU PROFIL                             */}
      {/* ============================================ */}
      <View style={[styles.enTete, { backgroundColor: couleurs.fondSecondaire }]}>
        <View style={[styles.cercleAvatar, { backgroundColor: couleurs.accent }]}>
          <Text style={styles.texteAvatar}>
            {prenomSupporteur ? prenomSupporteur.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={[styles.titre, { color: couleurs.texte }]}>
          {prenomSupporteur ? `Salut, ${prenomSupporteur} !` : 'Mon Espace Supporter'}
        </Text>
        <View style={[styles.badgeSecurise, { backgroundColor: couleurs.vertDoux }]}>
          <Ionicons name="shield-checkmark" size={14} color={couleurs.vert} />
          <Text style={[styles.texteBadge, { color: couleurs.vert }]}>Connecté de manière sécurisée et anonyme</Text>
        </View>
      </View>

      {/* ============================================ */}
      {/* STATISTIQUES RAPIDES                          */}
      {/* ============================================ */}
      <View style={styles.conteneurStats}>
        <View style={[styles.blocStat, { backgroundColor: couleurs.carte }]}>
          <Ionicons name="football" size={20} color={couleurs.accent} />
          <Text style={[styles.chiffreStat, { color: couleurs.texte }]}>{favorisMatchIds.length}</Text>
          <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Matchs favoris</Text>
        </View>
        <View style={[styles.blocStat, { backgroundColor: couleurs.carte }]}>
          <Ionicons name="people" size={20} color={couleurs.vert} />
          <Text style={[styles.chiffreStat, { color: couleurs.texte }]}>{favorisClubIds.length}</Text>
          <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Équipes</Text>
        </View>
        <View style={[styles.blocStat, { backgroundColor: couleurs.carte }]}>
          <Ionicons name="person" size={20} color={couleurs.or} />
          <Text style={[styles.chiffreStat, { color: couleurs.texte }]}>{favorisJoueurIds.length}</Text>
          <Text style={[styles.labelStat, { color: couleurs.texteTertiaire }]}>Joueurs</Text>
        </View>
      </View>

      {/* ============================================ */}
      {/* CARTE THÈME                                   */}
      {/* ============================================ */}
      <View style={[styles.carte, { backgroundColor: couleurs.carte }]}>
        <View style={styles.enTeteCarte}>
          <Ionicons name="color-palette-outline" size={18} color={couleurs.accent} />
          <Text style={[styles.titreCarte, { color: couleurs.texte }]}>Apparence</Text>
        </View>
        <Text style={[styles.texteExplication, { color: couleurs.texteTertiaire }]}>
          Choisis le thème de l'application. Par défaut, il suit les réglages de ton téléphone.
        </Text>
        <View style={styles.conteneurOptionsTheme}>
          {optionsTheme.map((option) => {
            const estActif = modeTheme === option.cle;
            return (
              <TouchableOpacity
                key={option.cle}
                style={[
                  styles.boutonTheme,
                  { backgroundColor: estActif ? couleurs.accentFond : couleurs.fondTertiaire,
                    borderColor: estActif ? couleurs.accent : 'transparent',
                    borderWidth: estActif ? 1.5 : 0 },
                ]}
                onPress={() => changerTheme(option.cle)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icone}
                  size={22}
                  color={estActif ? couleurs.accent : couleurs.texteTertiaire}
                />
                <Text style={[
                  styles.texteTheme,
                  { color: estActif ? couleurs.accent : couleurs.texteTertiaire,
                    fontWeight: estActif ? 'bold' : '500' },
                ]}>
                  {option.label}
                </Text>
                {estActif && (
                  <View style={[styles.badgeActif, { backgroundColor: couleurs.accent }]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ============================================ */}
      {/* CARTE UUID                                    */}
      {/* ============================================ */}
      <View style={[styles.carte, { backgroundColor: couleurs.carte }]}>
        <View style={styles.enTeteCarte}>
          <Ionicons name="key-outline" size={18} color={couleurs.accent} />
          <Text style={[styles.titreCarte, { color: couleurs.texte }]}>Mon Identifiant Unique (UUID)</Text>
        </View>
        <Text style={[styles.texteUUID, { color: couleurs.texteSecondaire, backgroundColor: couleurs.fondTertiaire }]}>{identifiantUUID}</Text>
        <Text style={[styles.texteExplication, { color: couleurs.texteQuaternaire }]}>
          Cet identifiant est généré automatiquement au premier lancement.
          Aucun mot de passe n'est nécessaire ! Il te permet de voter et commenter en restant anonyme.
        </Text>
      </View>

      {/* ============================================ */}
      {/* CARTE PRÉNOM                                  */}
      {/* ============================================ */}
      <View style={[styles.carte, { backgroundColor: couleurs.carte }]}>
        <View style={styles.enTeteCarte}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={couleurs.accent} />
          <Text style={[styles.titreCarte, { color: couleurs.texte }]}>Mon Prénom (pour le chat)</Text>
        </View>
        <Text style={[styles.texteExplicationPrenom, { color: couleurs.texteQuaternaire }]}>
          Ce prénom apparaîtra à côté de tes commentaires en direct. Tu peux le changer à tout moment.
        </Text>
        <View style={styles.lignePrenom}>
          <TextInput
            style={[styles.champSaisiePrenom, { backgroundColor: couleurs.inputFond, color: couleurs.inputTexte }]}
            placeholder="Ex: Philip, Marie, Hervé..."
            placeholderTextColor={couleurs.textePlaceholder}
            value={champPrenom}
            onChangeText={setChampPrenom}
            maxLength={20}
          />
          <TouchableOpacity style={[styles.boutonSauvegarder, { backgroundColor: couleurs.boutonPrimaire }]} onPress={sauvegarderPrenom} activeOpacity={0.8}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        {prenomSauvegarde && (
          <View style={styles.confirmationPrenom}>
            <Ionicons name="checkmark-circle" size={14} color={couleurs.vert} />
            <Text style={[styles.texteConfirmation, { color: couleurs.vert }]}>Prénom sauvegardé : {prenomSupporteur}</Text>
          </View>
        )}
      </View>

      {/* ============================================ */}
      {/* CARTE HISTORIQUE DES VOTES                    */}
      {/* ============================================ */}
      <View style={[styles.carte, { backgroundColor: couleurs.carte }]}>
        <View style={styles.enTeteCarte}>
          <Ionicons name="trophy-outline" size={18} color={couleurs.or} />
          <Text style={[styles.titreCarte, { color: couleurs.texte }]}>Mes Votes ({fauxHistoriqueVotes.length})</Text>
        </View>
        <Text style={[styles.texteResume, { color: couleurs.texteTertiaire }]}>
          Tu as voté {fauxHistoriqueVotes.length} fois cette saison pour l'Homme du Match
        </Text>
        {fauxHistoriqueVotes.map((vote) => (
          <View key={vote.id} style={[styles.ligneHistorique, { borderBottomColor: couleurs.separateurLeger }]}>
            <View style={[styles.iconeHistorique, { backgroundColor: couleurs.jauneDoux }]}>
              <Ionicons name="star" size={14} color={couleurs.or} />
            </View>
            <View style={styles.detailHistorique}>
              <Text style={[styles.texteMatchHistorique, { color: couleurs.texteSecondaire }]}>{vote.match}</Text>
              <Text style={[styles.texteJoueurHistorique, { color: couleurs.texteTertiaire }]}>
                <Ionicons name="person-outline" size={12} color={couleurs.texteTertiaire} /> {vote.joueur}
              </Text>
              <Text style={[styles.texteDateHistorique, { color: couleurs.texteQuaternaire }]}>{vote.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ============================================ */}
      {/* CARTE HISTORIQUE DES COMMENTAIRES              */}
      {/* ============================================ */}
      <View style={[styles.carte, { backgroundColor: couleurs.carte }]}>
        <View style={styles.enTeteCarte}>
          <Ionicons name="chatbubbles-outline" size={18} color={couleurs.accent} />
          <Text style={[styles.titreCarte, { color: couleurs.texte }]}>Mes Commentaires ({fauxHistoriqueCommentaires.length})</Text>
        </View>
        {fauxHistoriqueCommentaires.map((commentaire) => (
          <View key={commentaire.id} style={[styles.ligneHistorique, { borderBottomColor: couleurs.separateurLeger }]}>
            <View style={[styles.iconeHistorique, { backgroundColor: couleurs.accentDoux }]}>
              <Ionicons name="chatbubble" size={12} color={couleurs.accent} />
            </View>
            <View style={styles.detailHistorique}>
              <Text style={[styles.texteMatchHistorique, { color: couleurs.texteSecondaire }]}>{commentaire.match}</Text>
              <Text style={[styles.texteCommentaireHistorique, { color: couleurs.texteTertiaire }]}>"{commentaire.texte}"</Text>
              <Text style={[styles.texteDateHistorique, { color: couleurs.texteQuaternaire }]}>{commentaire.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ============================================ */}
      {/* BOUTON PARAMÈTRES                              */}
      {/* ============================================ */}
      <TouchableOpacity style={[styles.boutonParametres, { backgroundColor: couleurs.accentFond }]} activeOpacity={0.8}>
        <Ionicons name="settings-outline" size={20} color={couleurs.accent} style={{ marginRight: 8 }} />
        <Text style={[styles.texteBoutonParametres, { color: couleurs.accent }]}>Paramètres de l'application</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },

  // En-tête
  enTete: {
    alignItems: 'center', paddingVertical: 25,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 15,
  },
  cercleAvatar: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  texteAvatar: { color: '#FFF', fontSize: 30, fontWeight: 'bold' },
  titre: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  badgeSecurise: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  texteBadge: { fontSize: 12, marginLeft: 4, fontWeight: '500' },

  // Stats rapides
  conteneurStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 15, marginBottom: 15,
  },
  blocStat: {
    flex: 1, alignItems: 'center',
    padding: 15, borderRadius: 12, marginHorizontal: 4,
  },
  chiffreStat: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  labelStat: { fontSize: 11, marginTop: 4 },

  // Cartes
  carte: {
    marginHorizontal: 15, marginBottom: 12,
    padding: 18, borderRadius: 14,
  },
  enTeteCarte: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  titreCarte: { fontSize: 15, fontWeight: 'bold', marginLeft: 8 },

  // UUID
  texteUUID: {
    fontSize: 12, padding: 12,
    borderRadius: 8, fontFamily: 'monospace', textAlign: 'center',
    marginBottom: 10, letterSpacing: 0.5,
  },
  texteExplication: { fontSize: 12, lineHeight: 18 },

  // Thème
  conteneurOptionsTheme: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12,
  },
  boutonTheme: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, marginHorizontal: 4,
  },
  texteTheme: { fontSize: 12, marginTop: 6 },
  badgeActif: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },

  // Prénom
  texteExplicationPrenom: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  lignePrenom: { flexDirection: 'row', alignItems: 'center' },
  champSaisiePrenom: {
    flex: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    marginRight: 10,
  },
  boutonSauvegarder: {
    width: 46, height: 46,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  confirmationPrenom: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  texteConfirmation: { fontSize: 12, marginLeft: 5, fontWeight: '500' },

  // Historique
  texteResume: { fontSize: 13, marginBottom: 12, fontStyle: 'italic' },
  ligneHistorique: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12,
    paddingBottom: 12, borderBottomWidth: 1,
  },
  iconeHistorique: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  detailHistorique: { flex: 1 },
  texteMatchHistorique: { fontSize: 13, fontWeight: '700' },
  texteJoueurHistorique: { fontSize: 12, marginTop: 2 },
  texteCommentaireHistorique: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  texteDateHistorique: { fontSize: 11, marginTop: 3 },

  // Bouton paramètres
  boutonParametres: {
    flexDirection: 'row', marginHorizontal: 15,
    padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 5,
  },
  texteBoutonParametres: { fontSize: 15, fontWeight: 'bold' },
});
