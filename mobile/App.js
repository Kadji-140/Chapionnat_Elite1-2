// App.js - Point d'entrée de l'application mobile FootballApp
// Ce fichier configure la navigation globale, le contexte d'auth (UUID),
// le contexte de données (clubs, matchs, joueurs, favoris)
// et le contexte de thème (sombre, clair, système)

import React, { createContext, useState, useEffect, useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator, StatusBar, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';

// Imports des Services
import { configurerNotifications, registerForPushNotificationsAsync } from './services/NotificationService';

// Imports des Contextes
import { ThemeProvider, useTheme } from './contexte/ThemeContexte';
import { DonneesProvider, DonneesContexte } from './contexte/DonneesContexte';

// Importation des écrans
import EcranMatchs from './screens/MatchsScreen';
import EcranDetailMatch from './screens/MatchDetailScreen';
import EcranClassement from './screens/ClassementScreen';
import EcranClubDetail from './screens/ClubDetailScreen';
import EcranProfil from './screens/ProfilScreen';
import EcranFavoris from './screens/FavorisScreen';
import EcranActualites from './screens/ActualitesScreen';
import EcranActualiteDetail from './screens/ActualiteDetailScreen';
import EcranJoueurDetail from './screens/JoueurDetailScreen';

// --- CONTEXTE D'AUTHENTIFICATION ---
// On partage l'UUID et le prénom du supporter à travers toute l'application
export const ContexteAuth = createContext();

const OngletNav = createBottomTabNavigator();
const PileNav = createNativeStackNavigator();

function PileActualites() {
  return (
    <PileNav.Navigator>
      <PileNav.Screen
        name="ListeActualites"
        component={EcranActualites}
        options={{ headerShown: false }}
      />
      <PileNav.Screen
        name="ActualiteDetail"
        component={EcranActualiteDetail}
        options={{ headerShown: false }}
      />
    </PileNav.Navigator>
  );
}

// --- PILE DE NAVIGATION POUR L'ONGLET "MATCHS" ---
// Permet de naviguer de la liste des matchs vers le détail d'un match
function PileMatchs() {
  return (
    <PileNav.Navigator>
      <PileNav.Screen
        name="ListeMatchs"
        component={EcranMatchs}
        options={{ headerShown: false }}
      />
      <PileNav.Screen
        name="DetailMatch"
        component={EcranDetailMatch}
        options={{ headerShown: false }}
      />
      <PileNav.Screen
        name="ClubDetail"
        component={EcranClubDetail}
        options={{ headerShown: false }}
      />
      <PileNav.Screen
        name="JoueurDetail"
        component={EcranJoueurDetail}
        options={{ headerShown: false }}
      />
    </PileNav.Navigator>
  );
}

// --- PILE DE NAVIGATION POUR L'ONGLET "CLASSEMENT" ---
function PileClassement() {
  const { couleurs } = useTheme();
  return (
    <PileNav.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: couleurs.header },
      headerTintColor: couleurs.texte,
      headerTitleAlign: 'center',
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <PileNav.Screen
        name="TableauClassement"
        component={EcranClassement}
        options={{ title: 'Elite 1 & 2' }}
      />
      <PileNav.Screen
        name="ClubDetail"
        component={EcranClubDetail}
        options={{ headerShown: false }}
      />
      <PileNav.Screen
        name="JoueurDetail"
        component={EcranJoueurDetail}
        options={{ headerShown: false }}
      />
    </PileNav.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef();

// --- CONTENU PRINCIPAL AVEC NAVIGATION (utilise le thème) ---
function ContenuPrincipal() {
  const { couleurs, estSombre } = useTheme();
  const { isLoading } = useContext(DonneesContexte);

  useEffect(() => {
    // Écouter les clics sur les notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.matchId) {
        if (navigationRef.isReady()) {
          // Naviguer vers l'onglet Matchs, puis l'écran DetailMatch
          navigationRef.navigate('Matchs', {
            screen: 'DetailMatch',
            params: { matchId: data.matchId },
          });
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Thème de navigation personnalisé
  const themeNavigation = estSombre ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: couleurs.fond,
      card: couleurs.header,
      text: couleurs.texte,
      border: couleurs.separateur,
      primary: couleurs.accent,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: couleurs.fond,
      card: couleurs.header,
      text: couleurs.texte,
      border: couleurs.separateur,
      primary: couleurs.accent,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond }}>
        <ActivityIndicator size="large" color={couleurs.accent} />
        <Text style={{ marginTop: 15, color: couleurs.texteTertiaire }}>Connexion à l'API...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={estSombre ? 'light-content' : 'dark-content'}
        backgroundColor={couleurs.header}
      />
      <NavigationContainer theme={themeNavigation} ref={navigationRef}>
        <OngletNav.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let nomIcone;
              if (route.name === 'Actualites') {
                nomIcone = focused ? 'newspaper' : 'newspaper-outline';
              } else if (route.name === 'Matchs') {
                nomIcone = focused ? 'football' : 'football-outline';
              } else if (route.name === 'Classement') {
                nomIcone = focused ? 'list' : 'list-outline';
              } else if (route.name === 'Favoris') {
                nomIcone = focused ? 'star' : 'star-outline';
              } else if (route.name === 'Profil') {
                nomIcone = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={nomIcone} size={size} color={color} />;
            },
            tabBarActiveTintColor: couleurs.accent,
            tabBarInactiveTintColor: couleurs.texteTertiaire,
            tabBarStyle: { backgroundColor: couleurs.tabBar, borderTopColor: couleurs.tabBarBordure },
            headerStyle: { backgroundColor: couleurs.header },
            headerTintColor: couleurs.texte,
            headerTitleAlign: 'center',
            headerTitleStyle: { fontWeight: 'bold' },
          })}
        >
          <OngletNav.Screen
            name="Actualites"
            component={PileActualites}
            options={{ title: 'Actus', headerShown: false }}
          />
          <OngletNav.Screen
            name="Matchs"
            component={PileMatchs}
            options={{ title: 'Direct & Résultats', headerShown: false }}
          />
          <OngletNav.Screen
            name="Classement"
            component={PileClassement}
            options={{ title: 'Classement', headerShown: false }}
          />
          <OngletNav.Screen
            name="Favoris"
            component={EcranFavoris}
            options={{ title: 'Favoris' }}
          />
          <OngletNav.Screen
            name="Profil"
            component={EcranProfil}
            options={{ title: 'Mon Espace' }}
          />
        </OngletNav.Navigator>
      </NavigationContainer>
    </>
  );
}

// Configurer le gestionnaire de notifications pour afficher l'alerte même app ouverte
configurerNotifications();

export default function App() {
  const [identifiantUUID, setIdentifiantUUID] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [prenomSupporteur, setPrenomSupporteur] = useState('');
  const [applicationPrete, setApplicationPrete] = useState(false);

  // --- INITIALISATION AU PREMIER LANCEMENT ---
  useEffect(() => {
    const initialiserUtilisateurAnonyme = async () => {
      try {
        let uuidStocke = await AsyncStorage.getItem('@mobile_user_uuid');
        if (!uuidStocke) {
          uuidStocke = Crypto.randomUUID();
          await AsyncStorage.setItem('@mobile_user_uuid', uuidStocke);
          // TODO: Envoyer à l'API de Patrick pour créer l'entrée dans mobile_users
          // axios.post(`${API_BASE_URL}/mobile/register`, { uuid: uuidStocke })
          console.log("✅ Nouvel utilisateur créé avec l'UUID :", uuidStocke);
        } else {
          console.log("✅ Utilisateur existant, UUID :", uuidStocke);
        }
        setIdentifiantUUID(uuidStocke);

        // Demander et récupérer le Push Token
        // Isolé dans un try/catch séparé car le token distant peut échouer sans connexion Expo
        // Les notifications LOCALES fonctionneront quand même !
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);
            // TODO: Envoyer aussi ce token à Patrick via l'API pour l'associer à l'UUID
            // axios.post(`${API_BASE_URL}/mobile/update-token`, { uuid: uuidStocke, token })
          }
        } catch (erreurToken) {
          console.log("⚠️ Token Push distant non disponible (normal en dev) :", erreurToken.message);
        }

        const prenomStocke = await AsyncStorage.getItem('@prenom_supporteur');
        if (prenomStocke) {
          setPrenomSupporteur(prenomStocke);
        }
      } catch (erreur) {
        console.error("❌ Erreur lors de l'initialisation :", erreur);
      } finally {
        setApplicationPrete(true);
      }
    };

    initialiserUtilisateurAnonyme();
  }, []);

  // --- ÉCRAN DE CHARGEMENT ---
  if (!applicationPrete) {
    return (
      <View style={styles.conteneurChargement}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <ContexteAuth.Provider value={{
      identifiantUUID,
      prenomSupporteur,
      setPrenomSupporteur,
    }}>
      <ThemeProvider>
        <DonneesProvider>
          <ContenuPrincipal />
        </DonneesProvider>
      </ThemeProvider>
    </ContexteAuth.Provider>
  );
}

const styles = StyleSheet.create({
  conteneurChargement: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
