// screens/MatchDetailScreen.js - Détail d'un match
// Affiche le score, la chronologie des événements, les commentaires, le vote
// et la section "Qui va gagner ?" avec les probabilités
// Les données viennent du DonneesContexte via le matchId passé en paramètre

import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContexteAuth } from '../App';
import { DonneesContexte } from '../contexte/DonneesContexte';
import { useTheme } from '../contexte/ThemeContexte';
import { planifierNotificationTest } from '../services/NotificationService';

// --- COMMENTAIRES FICTIFS (simulant la table "commentaires" de Patrick) ---
// TODO: Remplacer par GET /api/commentaires?match_id=xxx
const fauxCommentaires = [
  { id: 'c1', auteur: 'SupporterYDE', texte: 'Quel match incroyable ! 🔥', heure: '15:45' },
  { id: 'c2', auteur: 'FanDuCoton', texte: "L'arbitre est aveugle...", heure: '16:02' },
  { id: 'c3', auteur: 'FootCMR237', texte: 'Allez les gars, on pousse !! 💪', heure: '16:15' },
];

export default function EcranDetailMatch({ route, navigation }) {
  // --- RÉCUPÉRATION DU MATCH DEPUIS LE CONTEXTE ---
  const { 
    matchs, 
    getClubById, 
    getJoueurById, 
    getInitialeClub, 
    favorisMatchIds, 
    toggleFavoriMatch,
    matchNotificationsIds,
    toggleNotificationMatch
  } = useContext(DonneesContexte);
  const { identifiantUUID, prenomSupporteur } = useContext(ContexteAuth);
  const { couleurs } = useTheme();

  const matchId = route.params.matchId;
  const match = matchs.find(m => m.id === matchId);

  // Si le match n'existe pas (ne devrait jamais arriver)
  if (!match) {
    return (
      <View style={[styles.conteneur, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF' }}>Match introuvable</Text>
      </View>
    );
  }

  const clubDom = getClubById(match.clubDomId);
  const clubExt = getClubById(match.clubExtId);
  const isFavori = favorisMatchIds.includes(match.id);
  const isNotifActif = matchNotificationsIds.includes(match.id);

  // --- ÉTATS LOCAUX ---
  const [ongletActif, setOngletActif] = useState('Aperçu');
  const [listeCommentaires, setListeCommentaires] = useState(fauxCommentaires);
  const [texteCommentaire, setTexteCommentaire] = useState('');
  const [modalVoteVisible, setModalVoteVisible] = useState(false);
  const [joueurChoisi, setJoueurChoisi] = useState(null);
  const [aDejaVote, setADejaVote] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({ titre: '', message: '' });
  const [modalOptionsVisible, setModalOptionsVisible] = useState(false);
  const refDefilement = useRef(null);

  // --- JOUEURS POUR VOTE ---
  const joueursVote = (match.joueursVoteIds || []).map(id => {
    const joueur = getJoueurById(id);
    const club = getClubById(joueur.clubId);
    return { ...joueur, nomClub: club.nom };
  });

  // --- OPTIONS MENU ---
  const ouvrirMenuOptions = () => {
    setModalOptionsVisible(true);
  };

  const testerNotification = () => {
    setModalOptionsVisible(false);
    planifierNotificationTest('⚽ Alerte But !', `But marqué dans le match ${clubDom.nom} vs ${clubExt.nom} !`, 3);
    setToastMessage({ titre: '🔔', message: 'Notif prévue dans 3s...' });
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 3000);
  };

  // --- FAVORIS PROB ---
  const maxProb = Math.max(match.prediction.victoireDom, match.prediction.nul, match.prediction.victoireExt);
  const isDomFav = match.prediction.victoireDom === maxProb;
  const isExtFav = match.prediction.victoireExt === maxProb;

  // --- ENVOYER UN COMMENTAIRE ---
  const envoyerCommentaire = () => {
    if (texteCommentaire.trim() === '') return;
    const nouveauCommentaire = {
      id: `c${Date.now()}`,
      auteur: prenomSupporteur || 'Anonyme',
      texte: texteCommentaire.trim(),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setListeCommentaires((prev) => [...prev, nouveauCommentaire]);
    setTexteCommentaire('');
    // TODO: POST /api/commentaires { match_id: matchId, uuid: identifiantUUID, texte }
  };

  // --- VOTER HOMME DU MATCH ---
  const voterPourJoueur = (joueur) => {
    setJoueurChoisi(joueur);
    setADejaVote(true);
    setModalVoteVisible(false);
    setToastMessage({ titre: '✅', message: 'Vote effectué' });
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); }, 2500);
    // TODO: POST /api/votes { match_id: matchId, joueur_id: joueur.id, uuid: identifiantUUID }
  };

  // --- COULEURS ---
  const getCouleurProb = (prob) => {
    if (prob >= 50) return '#4CAF50';
    if (prob >= 30) return '#FFB300';
    return '#E53935';
  };

  const getCouleurBoxProb = (prob) => {
    if (prob >= 50) return 'rgba(76, 175, 80, 0.15)';
    if (prob >= 30) return 'rgba(255, 179, 0, 0.15)';
    return 'rgba(229, 57, 53, 0.15)';
  };

  const obtenirCouleurEvenement = (type) => {
    switch (type) {
      case 'but': return '#4CAF50';
      case 'carton_jaune': return '#FDD835';
      case 'carton_rouge': return '#E53935';
      case 'remplacement': return '#1E90FF';
      default: return '#757575';
    }
  };

  const obtenirIconeEvenement = (type) => {
    switch (type) {
      case 'but': return 'football';
      case 'carton_jaune': return 'warning';
      case 'carton_rouge': return 'close-circle';
      case 'remplacement': return 'swap-horizontal';
      default: return 'ellipse';
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.conteneur, { backgroundColor: couleurs.fond }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: couleurs.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnRetour}>
          <Ionicons name="arrow-back" size={24} color={couleurs.texte} />
        </TouchableOpacity>
        <Text style={[styles.titreHeader, { color: couleurs.texte }]}>{match.ligue}</Text>
        <View style={styles.iconesHeader}>
          <TouchableOpacity onPress={() => toggleFavoriMatch(match.id)} style={{ marginRight: 15 }}>
            <Ionicons name={isFavori ? 'star' : 'star-outline'} size={22} color={isFavori ? couleurs.accent : couleurs.texte} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleNotificationMatch(match.id)} style={{ marginRight: 15 }}>
            <Ionicons name={isNotifActif ? 'notifications' : 'notifications-outline'} size={22} color={isNotifActif ? couleurs.or : couleurs.texte} />
          </TouchableOpacity>
          <TouchableOpacity onPress={ouvrirMenuOptions}>
            <Ionicons name="ellipsis-vertical" size={22} color={couleurs.texte} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.zoneScroll} ref={refDefilement}>
        {/* ============================================ */}
        {/* SECTION SCORE                                 */}
        {/* ============================================ */}
        <ImageBackground source={require('../assets/stade_bg.png')} style={styles.sectionTop} imageStyle={{ opacity: 0.3 }} resizeMode="cover">
          <TouchableOpacity style={styles.colonneEquipe} onPress={() => navigation.navigate('ClubDetail', { clubId: match.clubDomId })}>
            {isDomFav && (
              <Ionicons name="star" size={18} color="#FDD835" style={{ marginBottom: 5 }} />
            )}
            {clubDom.logo ? (
              <Image source={clubDom.logo} style={styles.cercleLogo} />
            ) : (
              <View style={[styles.cercleLogo, { backgroundColor: '#1565C0' }]}>
                <Text style={styles.texteLogoCercle}>{getInitialeClub(match.clubDomId)}</Text>
              </View>
            )}
            <Text style={styles.nomEquipeTop} numberOfLines={2}>{clubDom.nom}</Text>
          </TouchableOpacity>

          <View style={styles.colonneScore}>
            {match.statut === 'En cours' && match.minuteActuelle && (
              <Text style={styles.texteMinuteRouge}>{match.minuteActuelle}'</Text>
            )}
            <Text style={styles.scoreGeant}>
              {match.scoreDom !== null ? `${match.scoreDom} - ${match.scoreExt}` : 'VS'}
            </Text>
            <Text style={styles.texteStatut}>
              {match.statut === 'Terminé' ? 'Terminé' : match.statut === 'En cours' ? `HT ${match.scoreDom || 0}-${match.scoreExt || 0}` : match.heure}
            </Text>
          </View>

          <TouchableOpacity style={styles.colonneEquipe} onPress={() => navigation.navigate('ClubDetail', { clubId: match.clubExtId })}>
            {isExtFav && (
              <Ionicons name="star" size={18} color="#FDD835" style={{ marginBottom: 5 }} />
            )}
            {clubExt.logo ? (
              <Image source={clubExt.logo} style={styles.cercleLogo} />
            ) : (
              <View style={[styles.cercleLogo, { backgroundColor: '#C62828' }]}>
                <Text style={styles.texteLogoCercle}>{getInitialeClub(match.clubExtId)}</Text>
              </View>
            )}
            <Text style={styles.nomEquipeTop} numberOfLines={2}>{clubExt.nom}</Text>
          </TouchableOpacity>
        </ImageBackground>

        {/* ONGLETS */}
        <View style={[styles.ongletsBar, { borderBottomColor: couleurs.separateur }]}>
          {['Aperçu', 'Chat', 'H2H'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setOngletActif(tab)} style={styles.ongletUnique}>
              <Text style={[styles.texteOnglet, { color: couleurs.texteTertiaire }, ongletActif === tab && { color: couleurs.accent }]}>
                {tab}
                {tab === 'Chat' && ` (${listeCommentaires.length})`}
              </Text>
              {ongletActif === tab && <View style={[styles.ligneActiveOnglet, { backgroundColor: couleurs.accent }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ============================================ */}
        {/* CONTENU DE L'ONGLET ACTIF                     */}
        {/* ============================================ */}

        {ongletActif === 'Aperçu' && (
          <View>
            {/* Noms des équipes */}
            <View style={styles.barsEquipesNom}>
              <View style={[styles.barNomCol, { borderLeftWidth: 3, borderLeftColor: '#1565C0', paddingLeft: 10 }]}>
                <Text style={[styles.textePetitNom, { color: couleurs.texte }]}>{clubDom.nom}</Text>
              </View>
              <View style={[styles.barNomCol, { alignItems: 'flex-end', borderRightWidth: 3, borderRightColor: '#C62828', paddingRight: 10 }]}>
                <Text style={[styles.textePetitNom, { color: couleurs.texte }]}>{clubExt.nom}</Text>
              </View>
            </View>

            {/* Événements */}
            <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
              <View style={styles.enTeteBloc}>
                <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Événements</Text>
              </View>

              {match.evenements.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 30 }}>
                  <Ionicons name="hourglass-outline" size={40} color={couleurs.texteQuaternaire} />
                  <Text style={{ color: couleurs.texteTertiaire, marginTop: 10 }}>Le match n'a pas encore commencé</Text>
                </View>
              ) : (
                match.evenements.map((evt, index) => {
                  const joueur = getJoueurById(evt.joueurId);
                  return (
                    <View key={index} style={styles.ligneTimeline}>
                      <View style={styles.colonneMinute}>
                        <Text style={styles.texteMinuteEvt}>{evt.minute}'</Text>
                      </View>
                      <View style={styles.colonnePoint}>
                        <View style={[styles.pointTimeline, { backgroundColor: obtenirCouleurEvenement(evt.type) }]}>
                          <Ionicons name={obtenirIconeEvenement(evt.type)} size={10} color="#FFF" />
                        </View>
                        {index < match.evenements.length - 1 && <View style={styles.ligneVerticale} />}
                      </View>
                      <View style={styles.colonneDetail}>
                        <Text style={[styles.texteJoueurEvt, { color: couleurs.texte }]}>{joueur.nom}</Text>
                        <Text style={[styles.texteDetailEvt, { color: couleurs.texteTertiaire }]}>{evt.detail}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Qui va gagner ? */}
            <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
              <View style={styles.enTeteBloc}>
                <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Qui va gagner ?</Text>
              </View>
              <View style={styles.ligneProba}>
                <View style={[styles.boiteProb, { backgroundColor: getCouleurBoxProb(match.prediction.victoireDom) }]}>
                  <View style={[styles.miniCercle, { backgroundColor: '#1565C0' }]}>
                    <Text style={styles.miniInitiale}>{getInitialeClub(match.clubDomId)}</Text>
                  </View>
                  <Text style={[styles.texteProbGrand, { color: getCouleurProb(match.prediction.victoireDom) }]}>
                    {match.prediction.victoireDom}%
                  </Text>
                </View>
                <View style={[styles.boiteProb, { backgroundColor: 'rgba(136,136,136,0.1)', marginHorizontal: 8 }]}>
                  <Ionicons name="remove" size={20} color="#888" />
                  <Text style={[styles.texteProbGrand, { color: '#888' }]}>{match.prediction.nul}%</Text>
                </View>
                <View style={[styles.boiteProb, { backgroundColor: getCouleurBoxProb(match.prediction.victoireExt) }]}>
                  <View style={[styles.miniCercle, { backgroundColor: '#C62828' }]}>
                    <Text style={styles.miniInitiale}>{getInitialeClub(match.clubExtId)}</Text>
                  </View>
                  <Text style={[styles.texteProbGrand, { color: getCouleurProb(match.prediction.victoireExt) }]}>
                    {match.prediction.victoireExt}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Vote Homme du Match */}
            <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
              <View style={styles.enTeteBloc}>
                <Text style={[styles.titreBloc, { color: couleurs.texte }]}>
                  <Ionicons name="trophy" size={16} color={couleurs.or} /> Homme du Match
                </Text>
              </View>
              {match.statut === 'Terminé' ? (
                <View style={[styles.boutonVote, { backgroundColor: couleurs.boutonDesactive }]}>
                  <Ionicons name="lock-closed" size={18} color={couleurs.texteTertiaire} style={{ marginRight: 8 }} />
                  <Text style={[styles.texteBoutonVote, { color: couleurs.texteTertiaire }]}>Élection clôturée</Text>
                </View>
              ) : aDejaVote ? (
                <TouchableOpacity style={[styles.confirmationVote, { backgroundColor: couleurs.vertDoux }]} onPress={() => setModalVoteVisible(true)}>
                  <Ionicons name="checkmark-circle" size={20} color={couleurs.vert} />
                  <Text style={[styles.texteConfirmationVote, { color: couleurs.vert }]}>Tu as voté pour {joueurChoisi?.nom} ! <Text style={{ color: couleurs.accent, textDecorationLine: 'underline' }}>(Modifier)</Text></Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.boutonVote} onPress={() => setModalVoteVisible(true)}>
                  <Ionicons name="star" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.texteBoutonVote}>Élire l'Homme du Match</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {ongletActif === 'Chat' && (
          <View style={[styles.blocGris, { backgroundColor: couleurs.carte }]}>
            <View style={styles.enTeteBloc}>
              <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Commentaires en direct ({listeCommentaires.length})</Text>
            </View>
            {listeCommentaires.map((commentaire) => (
              <View key={commentaire.id} style={[styles.bulleCommentaire, { backgroundColor: couleurs.fondTertiaire }]}>
                <View style={styles.enTeteCommentaire}>
                  <View style={[styles.cercleAuteur, { backgroundColor: couleurs.accent }]}>
                    <Text style={styles.initialeAuteur}>{commentaire.auteur.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.nomAuteur, { color: couleurs.texte }]}>{commentaire.auteur}</Text>
                  <Text style={[styles.heureCommentaire, { color: couleurs.texteQuaternaire }]}>{commentaire.heure}</Text>
                </View>
                <Text style={[styles.texteCommentaireBulle, { color: couleurs.texteSecondaire }]}>{commentaire.texte}</Text>
              </View>
            ))}
          </View>
        )}

        {ongletActif === 'H2H' && (
          <View style={[styles.blocGris, { backgroundColor: couleurs.carte, padding: 0, overflow: 'hidden' }]}>
            <View style={styles.enTeteBloc}>
              <Text style={[styles.titreBloc, { color: couleurs.texte }]}>Face à Face (H2H)</Text>
            </View>
            {match.h2h && match.h2h.length > 0 ? (
              match.h2h.map((rencontre, index) => {
                const dom = getClubById(rencontre.clubDomId);
                const ext = getClubById(rencontre.clubExtId);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.h2hLigne, { borderBottomColor: couleurs.separateur }]}
                    onPress={() => navigation.push('DetailMatch', { matchId: 'm1' })} // Fallback à m1 pour simuler un historique
                  >
                    <Text style={[styles.h2hDate, { color: couleurs.texteTertiaire }]}>{rencontre.date}</Text>
                    <View style={styles.h2hEquipes}>
                      <Text style={[styles.h2hClub, { color: couleurs.texte, textAlign: 'right' }]} numberOfLines={1}>{dom ? dom.nom : ''}</Text>
                      <View style={[styles.h2hScoreBox, { backgroundColor: couleurs.accentFond }]}>
                        <Text style={[styles.h2hScoreTxt, { color: couleurs.accent }]}>{rencontre.scoreDom} - {rencontre.scoreExt}</Text>
                      </View>
                      <Text style={[styles.h2hClub, { color: couleurs.texte }]} numberOfLines={1}>{ext ? ext.nom : ''}</Text>
                    </View>
                    <Text style={[styles.h2hLigue, { color: couleurs.texteQuaternaire }]}>{rencontre.ligue}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <Ionicons name="git-compare-outline" size={40} color={couleurs.texteQuaternaire} />
                <Text style={{ color: couleurs.texteTertiaire, marginTop: 10 }}>Historique non disponible</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BARRE DE SAISIE COMMENTAIRE (visible uniquement dans Chat) */}
      {ongletActif === 'Chat' && (
        <View style={[styles.barreSaisie, { backgroundColor: couleurs.fondSecondaire, borderTopColor: couleurs.separateur }]}>
          <TextInput
            style={[styles.champTexte, { backgroundColor: couleurs.fondTertiaire, color: couleurs.inputTexte }]}
            placeholder="Écris un commentaire..."
            placeholderTextColor={couleurs.textePlaceholder}
            value={texteCommentaire}
            onChangeText={setTexteCommentaire}
          />
          <TouchableOpacity
            style={[styles.boutonEnvoyer, { backgroundColor: couleurs.boutonPrimaire }, texteCommentaire.trim() === '' && { backgroundColor: couleurs.boutonDesactive }]}
            onPress={envoyerCommentaire}
            disabled={texteCommentaire.trim() === ''}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL VOTE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVoteVisible}
        onRequestClose={() => setModalVoteVisible(false)}
      >
        <View style={[styles.fondModal, { backgroundColor: couleurs.modalFond }]}>
          <View style={[styles.contenuModal, { backgroundColor: couleurs.modalContenu, borderColor: couleurs.separateur }]}>
            <View style={styles.enTeteModal}>
              <Text style={[styles.titreModal, { color: couleurs.texte }]}>
                <Ionicons name="trophy" size={18} color={couleurs.or} /> Élire l'Homme du Match
              </Text>
              <TouchableOpacity onPress={() => setModalVoteVisible(false)}>
                <Ionicons name="close-circle" size={28} color={couleurs.rouge} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sousTitreModal, { color: couleurs.texteTertiaire }]}>Choisis le joueur qui a le plus brillé :</Text>
            <FlatList
              data={joueursVote}
              keyExtractor={(item) => item.id}
              renderItem={({ item: joueur }) => (
                <TouchableOpacity style={[styles.carteJoueurVote, { backgroundColor: couleurs.fondTertiaire }]} onPress={() => voterPourJoueur(joueur)}>
                  <View style={[styles.cercleJoueur, { backgroundColor: couleurs.accent }]}>
                    <Text style={styles.initialeJoueur}>{joueur.nom.charAt(0)}</Text>
                  </View>
                  <View style={styles.infoJoueur}>
                    <Text style={[styles.nomJoueurVote, { color: couleurs.texte }]}>{joueur.nom}</Text>
                    <Text style={[styles.posteJoueur, { color: couleurs.texteTertiaire }]}>{joueur.poste} • {joueur.nomClub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={couleurs.accent} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL : OPTIONS DU MATCH (3 POINTS) */}
      <Modal visible={modalOptionsVisible} transparent animationType="slide" onRequestClose={() => setModalOptionsVisible(false)}>
        <View style={styles.fondModal}>
          <View style={[styles.contenuModal, { backgroundColor: couleurs.header }]}>
            <View style={styles.enTeteModal}>
              <Text style={[styles.titreModal, { color: couleurs.texte }]}>Options du Match</Text>
              <TouchableOpacity onPress={() => setModalOptionsVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.optionItem} onPress={testerNotification}>
              <Ionicons name="notifications" size={22} color={couleurs.accent} style={{ marginRight: 15 }} />
              <Text style={[styles.texteOption, { color: couleurs.texte }]}>Tester une notification Push</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => { setModalOptionsVisible(false); Alert.alert('Partage', 'Lien copié !'); }}>
              <Ionicons name="share-social" size={22} color={couleurs.texte} style={{ marginRight: 15 }} />
              <Text style={[styles.texteOption, { color: couleurs.texte }]}>Partager le match</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionItem, { borderBottomWidth: 0 }]} onPress={() => setModalOptionsVisible(false)}>
              <Ionicons name="close" size={22} color="#E53935" style={{ marginRight: 15 }} />
              <Text style={[styles.texteOption, { color: '#E53935' }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TOAST CUSTOM */}
      {toastVisible && (
        <View style={[styles.toastContainer, { backgroundColor: couleurs.header }]}>
          <Text style={[styles.toastTexte, { color: couleurs.texte }]}>{toastMessage.titre} {toastMessage.message}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: '#121212' }, // overridden inline via couleurs

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
    paddingTop: 50, paddingBottom: 15, justifyContent: 'space-between', backgroundColor: '#121212',
  },
  btnRetour: { padding: 5 },
  titreHeader: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  iconesHeader: { flexDirection: 'row', alignItems: 'center' },

  zoneScroll: { flex: 1 },

  // Section Score
  sectionTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 25, alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  colonneEquipe: { alignItems: 'center', width: '30%' },
  cercleLogo: {
    width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center',
    alignItems: 'center', marginBottom: 8, marginTop: 8,
  },
  texteLogoCercle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  nomEquipeTop: { color: '#FFF', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  colonneScore: { alignItems: 'center', flex: 1 },
  texteMinuteRouge: { color: '#E53935', fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  scoreGeant: { color: '#FFF', fontSize: 40, fontWeight: 'bold', letterSpacing: 2 },
  texteStatut: { color: '#888', fontSize: 13, marginTop: 5 },

  // Onglets
  ongletsBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 10,
  },
  ongletUnique: { alignItems: 'center', paddingVertical: 10, width: '33%' },
  texteOnglet: { color: '#888', fontSize: 15, fontWeight: '600' },
  texteOngletActif: { color: '#1E90FF' },
  ligneActiveOnglet: {
    position: 'absolute', bottom: -1, width: '60%', height: 3,
    backgroundColor: '#1E90FF', borderRadius: 2,
  },

  // Noms équipes
  barsEquipesNom: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12 },
  barNomCol: { flex: 1 },
  textePetitNom: { color: '#FFF', fontSize: 13 },

  // Blocs gris
  blocGris: { backgroundColor: '#1A1A1A', marginHorizontal: 15, borderRadius: 12, padding: 15, marginBottom: 12 },
  enTeteBloc: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titreBloc: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Timeline
  ligneTimeline: { flexDirection: 'row', marginBottom: 4 },
  colonneMinute: { width: 35, alignItems: 'flex-end', paddingRight: 8, paddingTop: 2 },
  texteMinuteEvt: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  colonnePoint: { alignItems: 'center', width: 25 },
  pointTimeline: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ligneVerticale: { width: 2, flex: 1, backgroundColor: '#333', minHeight: 25 },
  colonneDetail: { flex: 1, paddingLeft: 8, paddingBottom: 14 },
  texteJoueurEvt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  texteDetailEvt: { fontSize: 12, color: '#888', marginTop: 2 },

  // H2H
  h2hLigne: { padding: 15, borderBottomWidth: 1 },
  h2hDate: { fontSize: 12, textAlign: 'center', marginBottom: 6 },
  h2hEquipes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  h2hClub: { flex: 1, fontSize: 13, fontWeight: '600' },
  h2hScoreBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginHorizontal: 10 },
  h2hScoreTxt: { fontSize: 14, fontWeight: 'bold' },
  h2hLigue: { fontSize: 11, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },

  // Probabilités
  ligneProba: { flexDirection: 'row', justifyContent: 'space-between' },
  boiteProb: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8 },
  miniCercle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniInitiale: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  texteProbGrand: { fontSize: 16, fontWeight: 'bold' },

  // Vote
  boutonVote: { flexDirection: 'row', backgroundColor: '#F9A825', padding: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  texteBoutonVote: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  confirmationVote: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: 14, borderRadius: 10 },
  texteConfirmationVote: { marginLeft: 10, fontSize: 14, color: '#4CAF50', fontWeight: '600' },

  // Commentaires
  bulleCommentaire: { backgroundColor: '#222', padding: 12, borderRadius: 10, marginBottom: 8 },
  enTeteCommentaire: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cercleAuteur: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1E90FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  initialeAuteur: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  nomAuteur: { fontSize: 13, fontWeight: '700', color: '#FFF', flex: 1 },
  heureCommentaire: { fontSize: 11, color: '#555' },
  texteCommentaireBulle: { fontSize: 14, color: '#CCC', lineHeight: 20, paddingLeft: 34 },

  // Barre saisie
  barreSaisie: { flexDirection: 'row', padding: 10, backgroundColor: '#1A1A1A', borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center' },
  champTexte: { flex: 1, backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#FFF', marginRight: 10 },
  boutonEnvoyer: { backgroundColor: '#1E90FF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  boutonEnvoyerDesactive: { backgroundColor: '#333' },

  // Modal
  fondModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  contenuModal: { backgroundColor: '#141414', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '70%', borderWidth: 1, borderColor: '#333', borderBottomWidth: 0 },
  enTeteModal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titreModal: { fontSize: 17, fontWeight: 'bold', color: '#FFF' },
  sousTitreModal: { fontSize: 13, color: '#888', marginBottom: 15 },
  carteJoueurVote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 14, borderRadius: 12, marginBottom: 8 },
  cercleJoueur: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E90FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  initialeJoueur: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  infoJoueur: { flex: 1 },
  nomJoueurVote: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  posteJoueur: { fontSize: 12, color: '#888', marginTop: 2 },

  // Options Menu Modal
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  texteOption: { fontSize: 16, fontWeight: '500' },

  // Toast
  toastContainer: {
    position: 'absolute', bottom: 100, right: 20,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    zIndex: 1000,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },
  toastTexte: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
