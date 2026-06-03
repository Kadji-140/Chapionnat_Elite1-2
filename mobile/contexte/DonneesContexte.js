// contexte/DonneesContexte.js - Contexte global des données de l'application
// Ce fichier centralise TOUTES les données (matchs, équipes, joueurs, favoris)
// afin que chaque écran y accède facilement.
// TODO: Remplacer les Mock Data par des appels API vers le backend de Patrick
// Endpoints prévus :
//   GET /api/matchs          → liste des matchs
//   GET /api/clubs            → liste des clubs Elite 1 & 2
//   GET /api/joueurs          → liste des joueurs
//   POST /api/favoris         → ajouter un favori (match, équipe ou joueur)
//   DELETE /api/favoris/:id   → retirer un favori

import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchClubs, fetchJoueurs, fetchMatchs, fetchClassement, fetchActualites } from '../services/apiService';
import {
  envoyerNotificationBut,
  envoyerNotificationCartonRouge,
  envoyerNotificationStatutMatch,
  programmerRappelsMatch,
  annulerRappelsMatch,
} from '../services/NotificationService';

export const DonneesContexte = createContext();

// ============================================
// FOURNISSEUR DE DONNÉES GLOBAL
// ============================================
export function DonneesProvider({ children }) {
  // --- Listes principales ---
  const [clubs, setClubs] = useState([]);
  const [joueurs, setJoueurs] = useState([]); 
  const [matchs, setMatchs] = useState([]);
  const [classement, setClassement] = useState(null);
  const [actualites, setActualites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Référence aux anciens matchs pour détecter les changements ---
  const ancienMatchsRef = useRef([]);
  // --- Référence aux IDs de notifications pour y accéder dans le polling ---
  const notifIdsRef = useRef([]);
  const clubNotifIdsRef = useRef([]);

  // --- IDs des favoris (persistés localement) ---
  const [favorisMatchIds, setFavorisMatchIds] = useState([]);
  const [favorisClubIds, setFavorisClubIds] = useState([]);
  const [favorisJoueurIds, setFavorisJoueurIds] = useState([]);
  const [matchNotificationsIds, setMatchNotificationsIds] = useState([]);
  const [clubNotificationsIds, setClubNotificationsIds] = useState([]);

  // Garder la ref synchronisée avec l'état
  useEffect(() => {
    notifIdsRef.current = matchNotificationsIds;
    clubNotifIdsRef.current = clubNotificationsIds;
  }, [matchNotificationsIds, clubNotificationsIds]);

  // ============================================
  // DÉTECTION DES CHANGEMENTS EN TEMPS RÉEL
  // ============================================
  const detecterChangements = (nouveauxMatchs, anciensMatchs, clubsList, joueursList) => {
    if (anciensMatchs.length === 0) return; // Premier chargement, pas de comparaison

    const idsAbonnes = notifIdsRef.current;
    const clubsAbonnes = clubNotifIdsRef.current;

    for (const nouveauMatch of nouveauxMatchs) {
      const ancienMatch = anciensMatchs.find(m => m.id === nouveauMatch.id);
      if (!ancienMatch) continue;

      // Vérifier si l'utilisateur est abonné aux notifications de ce match
      // OU si l'utilisateur suit l'un des clubs impliqués
      const estAbonneMatch = idsAbonnes.includes(nouveauMatch.id);
      const estAbonneClub = clubsAbonnes.includes(nouveauMatch.clubDomId) || clubsAbonnes.includes(nouveauMatch.clubExtId);
      
      if (!estAbonneMatch && !estAbonneClub) continue;

      const clubDom = clubsList.find(c => c.id === nouveauMatch.clubDomId) || { nom: '?' };
      const clubExt = clubsList.find(c => c.id === nouveauMatch.clubExtId) || { nom: '?' };
      const scoreActuel = `${nouveauMatch.scoreDom ?? 0} - ${nouveauMatch.scoreExt ?? 0}`;

      // --- DÉTECTION DE CHANGEMENT DE SCORE (BUT) ---
      const ancienScoreDom = ancienMatch.scoreDom ?? 0;
      const ancienScoreExt = ancienMatch.scoreExt ?? 0;
      const nouveauScoreDom = nouveauMatch.scoreDom ?? 0;
      const nouveauScoreExt = nouveauMatch.scoreExt ?? 0;

      if (nouveauScoreDom > ancienScoreDom) {
        // But pour l'équipe domicile !
        const dernierBut = trouverDernierBut(nouveauMatch, ancienMatch, nouveauMatch.clubDomId, joueursList);
        envoyerNotificationBut(
          nouveauMatch.id, clubDom.nom, dernierBut, scoreActuel, clubDom.nom, clubExt.nom
        );
      }
      if (nouveauScoreExt > ancienScoreExt) {
        // But pour l'équipe extérieure !
        const dernierBut = trouverDernierBut(nouveauMatch, ancienMatch, nouveauMatch.clubExtId, joueursList);
        envoyerNotificationBut(
          nouveauMatch.id, clubExt.nom, dernierBut, scoreActuel, clubDom.nom, clubExt.nom
        );
      }

      // --- DÉTECTION DE CARTONS ROUGES ---
      const anciensEvts = ancienMatch.evenements || [];
      const nouveauxEvts = nouveauMatch.evenements || [];
      if (nouveauxEvts.length > anciensEvts.length) {
        const nouveauxCartons = nouveauxEvts.filter(
          evt => evt.type === 'carton_rouge' && !anciensEvts.some(
            ae => ae.minute === evt.minute && ae.joueurId === evt.joueurId && ae.type === 'carton_rouge'
          )
        );
        for (const carton of nouveauxCartons) {
          const joueur = joueursList.find(j => j.id === carton.joueurId);
          const clubCarton = clubsList.find(c => c.id === carton.clubId);
          envoyerNotificationCartonRouge(
            nouveauMatch.id,
            joueur ? joueur.nom : 'Joueur',
            clubCarton ? clubCarton.nom : 'Club',
            clubDom.nom, clubExt.nom
          );
        }
      }

      // --- DÉTECTION DE CHANGEMENT DE STATUT ---
      if (ancienMatch.statut !== nouveauMatch.statut) {
        envoyerNotificationStatutMatch(
          nouveauMatch.id, clubDom.nom, clubExt.nom, nouveauMatch.statut, scoreActuel
        );
      }
    }
  };

  // Trouver le nom du dernier buteur à partir des événements
  const trouverDernierBut = (nouveauMatch, ancienMatch, clubId, joueursList) => {
    const anciensEvts = ancienMatch.evenements || [];
    const nouveauxEvts = nouveauMatch.evenements || [];
    
    // Trouver les buts qui n'existaient pas avant pour ce club
    const nouveauxButs = nouveauxEvts.filter(
      evt => evt.type === 'but' && evt.clubId === clubId && !anciensEvts.some(
        ae => ae.minute === evt.minute && ae.joueurId === evt.joueurId && ae.type === 'but'
      )
    );

    if (nouveauxButs.length > 0) {
      const dernierButEvt = nouveauxButs[nouveauxButs.length - 1];
      const joueur = joueursList.find(j => j.id === dernierButEvt.joueurId);
      return joueur ? joueur.nom : null;
    }
    return null;
  };

  // --- Chargement initial des favoris depuis AsyncStorage ---
  useEffect(() => {
    const chargerFavoris = async () => {
      try {
        const mIds = await AsyncStorage.getItem('@favoris_matchs');
        const cIds = await AsyncStorage.getItem('@favoris_clubs');
        const jIds = await AsyncStorage.getItem('@favoris_joueurs');
        const nmIds = await AsyncStorage.getItem('@notifications_matchs');
        const ncIds = await AsyncStorage.getItem('@notifications_clubs');

        if (mIds) setFavorisMatchIds(JSON.parse(mIds));
        if (cIds) setFavorisClubIds(JSON.parse(cIds));
        if (jIds) setFavorisJoueurIds(JSON.parse(jIds));
        if (nmIds) setMatchNotificationsIds(JSON.parse(nmIds));
        if (ncIds) setClubNotificationsIds(JSON.parse(ncIds));
      } catch (e) {
        console.error('❌ Erreur chargement favoris:', e);
      }
    };
    
    const chargerDonneesAPI = async (premierChargement = false) => {
      if (premierChargement) setIsLoading(true);
      try {
        const [clubsData, joueursData, matchsData, classementData, actualitesData] = await Promise.all([
          fetchClubs(),
          fetchJoueurs(),
          fetchMatchs(),
          fetchClassement(),
          fetchActualites()
        ]);

        // Si un des appels a échoué (retourne null), on garde les anciennes données
        if (!clubsData || !joueursData || !matchsData || !classementData || !actualitesData) {
          if (premierChargement) {
            console.log('⚠️ Premier chargement échoué, nouvelle tentative dans 5s...');
          }
          return; // On ne met pas à jour l'état, les anciennes données restent
        }

        // Détecter les changements AVANT de mettre à jour l'état
        if (!premierChargement && ancienMatchsRef.current.length > 0) {
          detecterChangements(matchsData, ancienMatchsRef.current, clubsData, joueursData);
        }

        // Sauvegarder la version actuelle pour la prochaine comparaison
        ancienMatchsRef.current = JSON.parse(JSON.stringify(matchsData));

        setClubs(clubsData);
        setJoueurs(joueursData);
        setMatchs(matchsData);
        setClassement(classementData);
        setActualites(actualitesData);
      } catch (error) {
        // Silencieux pour ne pas spammer le terminal pendant le polling
        if (premierChargement) {
          console.error('❌ Erreur lors du chargement initial :', error.message);
        }
      } finally {
        if (premierChargement) setIsLoading(false);
      }
    };

    chargerFavoris();
    chargerDonneesAPI(true); // Premier chargement avec spinner

    // --- MISE À JOUR EN TEMPS RÉEL (POLLING) ---
    const intervalId = setInterval(() => {
        chargerDonneesAPI(false); // Chargement silencieux en arrière-plan
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // --- Sauvegarde automatique des favoris ---
  const sauvegarderFavoris = async (cle, valeur) => {
    try {
      await AsyncStorage.setItem(cle, JSON.stringify(valeur));
      // TODO: Synchroniser avec l'API de Patrick
      // axios.post(`${API_BASE_URL}/favoris`, { uuid, type, ids: valeur })
    } catch (e) {
      console.error('❌ Erreur sauvegarde favoris:', e);
    }
  };

  // ============================================
  // FONCTIONS DE TOGGLE FAVORIS
  // ============================================
  const toggleFavoriMatch = (matchId) => {
    setFavorisMatchIds((prev) => {
      const nouveau = prev.includes(matchId)
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId];
      sauvegarderFavoris('@favoris_matchs', nouveau);
      return nouveau;
    });
  };

  const toggleFavoriClub = (clubId) => {
    setFavorisClubIds((prev) => {
      const nouveau = prev.includes(clubId)
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId];
      sauvegarderFavoris('@favoris_clubs', nouveau);
      return nouveau;
    });
  };

  const toggleFavoriJoueur = (joueurId) => {
    setFavorisJoueurIds((prev) => {
      const nouveau = prev.includes(joueurId)
        ? prev.filter(id => id !== joueurId)
        : [...prev, joueurId];
      sauvegarderFavoris('@favoris_joueurs', nouveau);
      return nouveau;
    });
  };

  const toggleNotificationMatch = (matchId) => {
    const estDejaAbonne = matchNotificationsIds.includes(matchId);

    // Programmer ou annuler les rappels
    const matchConcerne = matchs.find(m => m.id === matchId);
    if (matchConcerne) {
      const clubDom = getClubById(matchConcerne.clubDomId);
      const clubExt = getClubById(matchConcerne.clubExtId);

      if (!estDejaAbonne && matchConcerne.statut === 'À venir') {
        // ACTIVER → programmer les rappels 1h, 30min, 15min avant
        programmerRappelsMatch(
          matchId, clubDom.nom, clubExt.nom,
          matchConcerne.dateMatch, matchConcerne.heure
        );
      } else {
        // DÉSACTIVER → annuler les rappels
        annulerRappelsMatch(matchId);
      }
    }

    setMatchNotificationsIds((prev) => {
      const nouveau = estDejaAbonne
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId];
      sauvegarderFavoris('@notifications_matchs', nouveau);
      return nouveau;
    });
  };

  const toggleNotificationClub = (clubId) => {
    const estDejaAbonne = clubNotificationsIds.includes(clubId);
    const club = getClubById(clubId);

    // Trouver TOUS les matchs à venir impliquant ce club
    const matchsDuClub = matchs.filter(
      m => (m.clubDomId === clubId || m.clubExtId === clubId) && m.statut === 'À venir'
    );

    if (!estDejaAbonne) {
      // ACTIVER → programmer les rappels pour chaque match à venir de ce club
      matchsDuClub.forEach(m => {
        const clubDom = getClubById(m.clubDomId);
        const clubExt = getClubById(m.clubExtId);
        programmerRappelsMatch(m.id, clubDom.nom, clubExt.nom, m.dateMatch, m.heure);
      });
      console.log(`🔔 Notifications activées pour ${club.nom} : ${matchsDuClub.length} match(s) à venir programmés.`);
    } else {
      // DÉSACTIVER → annuler les rappels de chaque match de ce club
      matchsDuClub.forEach(m => {
        annulerRappelsMatch(m.id);
      });
      console.log(`🔕 Notifications désactivées pour ${club.nom} : rappels annulés.`);
    }

    setClubNotificationsIds((prev) => {
      const nouveau = estDejaAbonne
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId];
      sauvegarderFavoris('@notifications_clubs', nouveau);
      return nouveau;
    });
  };

  // ============================================
  // HELPERS : Résoudre les IDs en objets
  // ============================================
  const getClubById = (id) => clubs.find(c => c.id === id) || { nom: 'Inconnu', ligue: '', ville: '' };
  const getJoueurById = (id) => joueurs.find(j => j.id === id) || { nom: 'Inconnu', poste: '', clubId: '' };

  // Initiale du club (pour afficher un cercle quand pas de logo)
  const getInitialeClub = (clubId) => {
    const club = getClubById(clubId);
    return club.nom.charAt(0).toUpperCase();
  };

  // TODO: Fonction pour récupérer les données depuis l'API de Patrick
  // const rafraichirDepuisAPI = async () => {
  //   try {
  //     const [resMatchs, resClubs, resJoueurs] = await Promise.all([
  //       axios.get(`${API_BASE_URL}/matchs`),
  //       axios.get(`${API_BASE_URL}/clubs`),
  //       axios.get(`${API_BASE_URL}/joueurs`),
  //     ]);
  //     setMatchs(resMatchs.data);
  //     setClubs(resClubs.data);
  //     setJoueurs(resJoueurs.data);
  //   } catch (e) {
  //     console.error('❌ Erreur API:', e);
  //   }
  // };

  return (
      <DonneesContexte.Provider value={{
      // Données principales
      clubs,
      joueurs,
      matchs,
      classement,
      actualites,
      isLoading,
      // Favoris
      favorisMatchIds,
      favorisClubIds,
      favorisJoueurIds,
      toggleFavoriMatch,
      toggleFavoriClub,
      toggleFavoriJoueur,
      // Notifications
      matchNotificationsIds,
      toggleNotificationMatch,
      clubNotificationsIds,
      toggleNotificationClub,
      // Helpers
      getClubById,
      getJoueurById,
      getInitialeClub,
    }}>
      {children}
    </DonneesContexte.Provider>
  );
}
