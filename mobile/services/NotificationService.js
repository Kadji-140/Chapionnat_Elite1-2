import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ============================================
// CONFIGURATION DES NOTIFICATIONS
// ============================================

// Configurer le comportement quand l'application est OUVERTE (au premier plan)
export const configurerNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// ============================================
// PERMISSIONS & PUSH TOKEN
// ============================================

export async function registerForPushNotificationsAsync() {
  let token;

  // Créer un canal Android avec importance MAX (son, vibration, badge)
  if (Platform.OS === 'android') {
    // Canal pour les buts
    await Notifications.setNotificationChannelAsync('buts', {
      name: 'Buts & Événements',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
    });
    // Canal pour les rappels de match
    await Notifications.setNotificationChannelAsync('rappels', {
      name: 'Rappels de match',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#1E90FF',
      sound: 'default',
    });
    // Canal par défaut (tests)
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Général',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Permission refusée pour les notifications push !');
      return null;
    }
    
    // Token Expo supprimé pour éviter l'avertissement 'Android Push notifications removed from Expo Go',
    // puisque l'application utilise uniquement des notifications locales pour le moment.
    token = 'local_token';
  } else {
    console.log('Les notifications Push nécessitent un vrai téléphone.');
  }

  return token;
}

// ============================================
// NOTIFICATION DE TEST
// ============================================

export async function planifierNotificationTest(titre, message, secondes = 3) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titre,
        body: message,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondes,
      },
    });
    console.log(`✅ Notification test planifiée dans ${secondes}s`);
  } catch (error) {
    console.error("❌ Erreur notification test :", error);
  }
}

// ============================================
// NOTIFICATIONS DE BUT (en temps réel)
// ============================================

// Envoyée immédiatement quand un but est détecté par le polling
export async function envoyerNotificationBut(matchId, nomClubButeur, nomJoueur, scoreActuel, nomClubDom, nomClubExt) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚽ BUT ! ${nomClubButeur} marque !`,
        body: `${nomClubDom} ${scoreActuel} ${nomClubExt}`,
        subtitle: nomJoueur ? `⚡ Buteur : ${nomJoueur}` : undefined,
        sound: 'default',
        data: { matchId, type: 'but' },
        ...(Platform.OS === 'android' && { channelId: 'buts' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
    console.log(`✅ Notification but envoyée : ${nomClubButeur} (${nomJoueur || 'joueur inconnu'})`);
  } catch (error) {
    console.error("❌ Erreur notification but :", error);
  }
}

// ============================================
// NOTIFICATIONS DE CARTON ROUGE
// ============================================

export async function envoyerNotificationCartonRouge(matchId, nomJoueur, nomClub, nomClubDom, nomClubExt) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🟥 Carton Rouge !`,
        body: `${nomJoueur} (${nomClub}) est expulsé !`,
        subtitle: `${nomClubDom} vs ${nomClubExt}`,
        sound: 'default',
        data: { matchId, type: 'carton_rouge' },
        ...(Platform.OS === 'android' && { channelId: 'buts' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  } catch (error) {
    console.error("❌ Erreur notification carton :", error);
  }
}

// ============================================
// NOTIFICATIONS DE DÉBUT/FIN DE MATCH
// ============================================

export async function envoyerNotificationStatutMatch(matchId, nomClubDom, nomClubExt, nouveauStatut, scoreActuel) {
  try {
    let titre = '';
    let corps = '';

    if (nouveauStatut === 'En cours') {
      titre = '🏟️ Coup d\'envoi !';
      corps = `${nomClubDom} vs ${nomClubExt} vient de commencer !`;
    } else if (nouveauStatut === 'Terminé') {
      titre = '🏁 Match terminé !';
      corps = `${nomClubDom} ${scoreActuel} ${nomClubExt}`;
    }

    if (titre) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titre,
          body: corps,
          sound: 'default',
          data: { matchId, type: 'statut' },
          ...(Platform.OS === 'android' && { channelId: 'buts' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    }
  } catch (error) {
    console.error("❌ Erreur notification statut :", error);
  }
}

// ============================================
// RAPPELS DE MATCH (1h, 30min, 15min avant)
// ============================================

export async function programmerRappelsMatch(matchId, nomClubDom, nomClubExt, dateMatch, heure) {
  try {
    // Construire la date du match (attention au fuseau horaire, on s'assure d'utiliser l'heure locale)
    const [annee, mois, jour] = dateMatch.split('-');
    const [heureMatch, minuteMatch] = heure.split(':');
    const dateObj = new Date(annee, mois - 1, jour, heureMatch, minuteMatch, 0, 0);

    const maintenant = new Date();
    const diffMs = dateObj.getTime() - maintenant.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    console.log(`⏱️ Préparation rappels: Match à ${dateObj.toLocaleString()} (dans ${Math.floor(diffSeconds/60)} minutes)`);

    const rappels = [
      { label: '1 heure',   secondesAvant: 3600 },
      { label: '30 minutes', secondesAvant: 1800 },
      { label: '15 minutes', secondesAvant: 900 },
      { label: '5 minutes',  secondesAvant: 300 }, // Pour tester plus facilement
      { label: '1 minute',   secondesAvant: 60 },  // Pour tester TRÈS rapidement
    ];

    let rappelsProgrammes = 0;

    for (const rappel of rappels) {
      const secondesRestantes = diffSeconds - rappel.secondesAvant;
      
      if (secondesRestantes > 0) {
        await Notifications.scheduleNotificationAsync({
          identifier: `rappel_${matchId}_${rappel.secondesAvant}`,
          content: {
            title: `⏰ Match dans ${rappel.label} !`,
            body: `${nomClubDom} vs ${nomClubExt} commence bientôt !`,
            subtitle: `🏟️ Prépare-toi !`,
            sound: 'default',
            data: { matchId, type: 'rappel' },
            ...(Platform.OS === 'android' && { channelId: 'rappels' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondesRestantes,
          },
        });
        rappelsProgrammes++;
        console.log(`✅ Rappel "${rappel.label}" programmé pour s'afficher dans ${secondesRestantes} secondes.`);
      } else {
        console.log(`ℹ️ Rappel "${rappel.label}" ignoré (le délai est déjà dépassé).`);
      }
    }

    return rappelsProgrammes;
  } catch (error) {
    console.error("❌ Erreur programmation rappels :", error);
    return 0;
  }
}

// ============================================
// ANNULER LES RAPPELS D'UN MATCH
// ============================================

export async function annulerRappelsMatch(matchId) {
  try {
    const identifiants = [
      `rappel_${matchId}_3600`,
      `rappel_${matchId}_1800`,
      `rappel_${matchId}_900`,
      `rappel_${matchId}_300`,
      `rappel_${matchId}_60`,
    ];
    for (const id of identifiants) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        // Ignorer silencieusement si cette notification n'existait pas
      }
    }
    console.log(`✅ Rappels annulés pour le match ${matchId}`);
  } catch (error) {
    console.error("❌ Erreur annulation rappels :", error);
  }
}

// ============================================
// UTILITAIRE : Lister les notifications planifiées (debug)
// ============================================
export async function listerNotificationsPlanifiees() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`📋 ${scheduled.length} notification(s) planifiée(s) :`);
  scheduled.forEach(n => {
    console.log(`  - [${n.identifier}] ${n.content.title}`);
  });
  return scheduled;
}
