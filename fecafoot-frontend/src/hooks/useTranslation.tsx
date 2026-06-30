// src/hooks/useTranslation.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

type Language = 'fr' | 'en';

interface TranslationContextType {
  lang: Language;
  t: (key: string) => string;
  changeLanguage: (lang: Language) => Promise<void>;
  translateNotification: (notif: { titre: string; message: string; type: string }) => { titre: string; message: string };
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  fr: {
    // Header & User Menu
    'header.my_profile': 'Mon profil',
    'header.logout': 'Se déconnecter',
    'header.notifications': 'Notifications',
    'header.new': 'nouvelles',
    'header.mark_all_read': 'Tout lire',
    'header.no_notifications': 'Aucune notification',
    'header.view_all': 'Voir toutes les notifications',
    'header.logout_success': 'Déconnexion réussie',
    'header.title': 'Fédération Camerounaise de Football',

    // Sidebar
    'sidebar.home': 'Accueil',
    'sidebar.clubs_divisions': 'Clubs & Divisions',
    'sidebar.seasons_phases': 'Saisons & Phases',
    'sidebar.schedule_matches': 'Calendrier & Matchs',
    'sidebar.match_management': 'Gestion des Matchs',
    'sidebar.license_validation': 'Validation Licences',
    'sidebar.contestations': 'Contestations',
    'sidebar.penalties': 'Pénalités',
    'sidebar.news_media': 'Actualités / Média',
    'sidebar.audit_log': "Journal d'audit",
    'sidebar.my_club_roster': 'Mon Club / Effectif',
    'sidebar.my_matches': 'Mes Matchs',
    'sidebar.my_formations': 'Mes Compositions',
    'sidebar.disputes_complaints': 'Contestations & Plaintes',
    'sidebar.my_account': 'Mon Profil',
    'sidebar.matches_to_supervise': 'Matchs à superviser',
    'sidebar.my_articles': 'Mes Articles',
    'sidebar.dashboard': 'Tableau de bord',
    'sidebar.classement': 'Classement',

    // Common Buttons & Labels
    'common.back': 'Retour',
    'common.save': 'Enregistrer',
    'common.confirm': 'Confirmer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.actions': 'Actions',
    'common.loading': 'Chargement...',
    'common.status': 'Statut',
    'common.date': 'Date',
    'common.venue': 'Stade / Lieu',
    'common.referee': 'Arbitre',
    'common.score': 'Score',
    'common.no_data': 'Aucune donnée disponible',
    
    // Notifications Page
    'notif.title': 'Centre de Notifications',
    'notif.subtitle': 'Gérez vos alertes système et notifications de match',
    'notif.select_all': 'Tout sélectionner',
    'notif.delete_selected': 'Supprimer la sélection',
    'notif.mark_all_read': 'Tout marquer comme lu',
    'notif.empty': 'Vous n\'avez aucune notification dans votre historique.',
    'notif.deleted_success': 'Notifications supprimées avec succès.',
    'notif.marked_read_success': 'Notifications marquées comme lues.',
  },
  en: {
    // Header & User Menu
    'header.my_profile': 'My Profile',
    'header.logout': 'Log Out',
    'header.notifications': 'Notifications',
    'header.new': 'new',
    'header.mark_all_read': 'Mark all as read',
    'header.no_notifications': 'No notifications',
    'header.view_all': 'View all notifications',
    'header.logout_success': 'Logged out successfully',
    'header.title': 'Cameroon Football Federation',

    // Sidebar
    'sidebar.home': 'Home',
    'sidebar.clubs_divisions': 'Clubs & Divisions',
    'sidebar.seasons_phases': 'Seasons & Phases',
    'sidebar.schedule_matches': 'Schedule & Matches',
    'sidebar.match_management': 'Match Management',
    'sidebar.license_validation': 'License Validation',
    'sidebar.contestations': 'Contestations',
    'sidebar.penalties': 'Penalties',
    'sidebar.news_media': 'News & Media',
    'sidebar.audit_log': 'Audit Log',
    'sidebar.my_club_roster': 'My Club / Roster',
    'sidebar.my_matches': 'My Matches',
    'sidebar.my_formations': 'My Formations',
    'sidebar.disputes_complaints': 'Disputes & Complaints',
    'sidebar.my_account': 'My Profile',
    'sidebar.matches_to_supervise': 'Matches to Supervise',
    'sidebar.my_articles': 'My Articles',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.classement': 'Standings',

    // Common Buttons & Labels
    'common.back': 'Back',
    'common.save': 'Save',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.actions': 'Actions',
    'common.loading': 'Loading...',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.venue': 'Stadium / Venue',
    'common.referee': 'Referee',
    'common.score': 'Score',
    'common.no_data': 'No data available',

    // Notifications Page
    'notif.title': 'Notification Center',
    'notif.subtitle': 'Manage your system alerts and match notifications',
    'notif.select_all': 'Select All',
    'notif.delete_selected': 'Delete Selected',
    'notif.mark_all_read': 'Mark All as Read',
    'notif.empty': 'You have no notifications in your history.',
    'notif.deleted_success': 'Notifications deleted successfully.',
    'notif.marked_read_success': 'Notifications marked as read.',
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useAuthStore();
  const [lang, setLang] = useState<Language>(() => {
    const local = localStorage.getItem('fecafoot_lang') as Language;
    return local === 'en' || local === 'fr' ? local : 'fr';
  });

  // Sync with user language preference on login
  useEffect(() => {
    if (user?.lang && (user.lang === 'fr' || user.lang === 'en')) {
      setLang(user.lang as Language);
      localStorage.setItem('fecafoot_lang', user.lang);
    }
  }, [user]);

  const changeLanguage = async (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('fecafoot_lang', newLang);

    // If user is authenticated, save preference in DB
    if (user) {
      try {
        await api.put('/auth/lang', { lang: newLang });
        setUser({ ...user, lang: newLang });
      } catch (err) {
        console.error('Failed to update language on server', err);
      }
    }
  };

  const t = (key: string): string => {
    return DICTIONARY[lang][key] || DICTIONARY['fr'][key] || key;
  };

  // Translate notification text dynamically on client side
  const translateNotification = (notif: { titre: string; message: string; type: string }) => {
    if (lang === 'fr') {
      return { titre: notif.titre, message: notif.message };
    }

    let title = notif.titre;
    let message = notif.message;

    switch (notif.type) {
      case 'effectif_soumis':
        title = title.replace(/Effectif soumis — (.*)/, 'Squad submitted — $1');
        message = message.replace(/(.*) a soumis son effectif de (\d+) joueur\(s\) à validation\./, '$1 has submitted their squad of $2 player(s) for validation.');
        break;

      case 'joueur_valide':
        title = '✅ Player Approved';
        message = message.replace(/La licence de (.*) a été approuvée par l'administration FECAFOOT\./, "The license of $1 has been approved by the FECAFOOT administration.");
        break;

      case 'joueur_rejete':
        title = title.replace(/Licence rejetée — (.*)/, '❌ License Rejected — $1');
        message = message.replace(/La licence de (.*) a été rejetée\. Motif : (.*)/, 'The license of $1 has been rejected. Reason: $2');
        break;

      case 'compte_cree':
        title = '🎉 Welcome to FECAFOOT Platform';
        message = 'Your account has been created. Please log in and change your password.';
        break;

      case 'contestation_soumise':
        title = title.replace(/Contestation déposée — (.*) vs (.*)/, '⚖️ Contestation Filed — $1 vs $2');
        message = message.replace(/Le coach de (.*) conteste l'événement '(.*)' à la minute (\d+)\./, "The coach of $1 contests the event '$2' at minute $3.");
        break;

      case 'contestation_traitee':
        title = title.replace(/Contestation (acceptée|rejetée)/, (match, p1) => `⚖️ Contestation ${p1 === 'acceptée' ? 'Accepted' : 'Rejected'}`);
        message = message.replace(/Votre contestation pour le match (.*) a été (acceptée|rejetée)\. Décision : (.*)/, (match, p1, p2, p3) => {
          const status = p2 === 'acceptée' ? 'accepted' : 'rejected';
          return `Your contestation for the match ${p1} was ${status}. Decision: ${p3}`;
        });
        break;

      case 'match_homologue':
        title = '🏆 Match Homologated';
        message = message.replace(/Le match (.*) (a été homologué|est homologué) avec le score (.*)\./, 'The match $1 has been homologated with the score $3.');
        break;

      case 'penalite_appliquee':
        title = '🚨 Penalty Applied';
        message = message.replace(/Une pénalité de (\d+) points a été appliquée au club (.*)\. Motif : (.*)/, 'A penalty of $1 points has been applied to the club $2. Reason: $3');
        break;

      case 'match_demarre':
        title = '⚽ Match Started';
        message = message.replace(/Le coup d'envoi du match (.*) a été donné\./, 'The kick-off of the match $1 has been given.');
        break;

      case 'match_cloture':
        title = '🏁 Match Closed';
        message = message.replace(/Le match (.*) a été clôturé par le commissaire\./, 'The match $1 has been closed by the commissioner.');
        break;

      case 'rapport_match_soumis':
        title = '📰 Match Report Submitted';
        message = message.replace(/Le rapport du match (.*) a été soumis par le commissaire\./, 'The report of the match $1 has been submitted by the commissioner.');
        break;

      case 'match_programme':
        title = '📅 Match Scheduled';
        message = message.replace(/Vous êtes désigné comme (.*) pour le match (.*) du (.*)\./, 'You are designated as $1 for the match $2 on $3.');
        break;

      case 'match_deprogramme':
        title = '⚠️ Match Cancelled or Postponed';
        message = message.replace(/Le match (.*) prévu le (.*) a été (annulé|reporté)\. Motif : (.*)/, (match, p1, p2, p3, p4) => {
          const action = p3 === 'annulé' ? 'cancelled' : 'postponed';
          return `The match ${p1} scheduled on ${p2} was ${action}. Reason: ${p4}`;
        });
        break;
    }

    return { titre: title, message };
  };

  return (
    <TranslationContext.Provider value={{ lang, t, changeLanguage, translateNotification }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
