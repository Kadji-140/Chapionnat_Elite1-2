// services/apiService.js
// Ce service est la couche d'accès aux données.
// Actuellement, il lit depuis les fichiers JSON locaux dans assets/mocks.
// Plus tard, il suffira de remplacer ces appels locaux par des appels axios ou fetch vers l'API Laravel.

// --- MODE SIMULATION LORSQUE L'API N'EST PAS PRÊTE ---
const isMockMode = true; // Activer le mode "Mock distant sur Laragon"

// On utilise l'IP locale (192.168.43.231) pour que le téléphone puisse y accéder
const API_BASE_URL = 'http://192.168.43.231/FootballApp2/mocks';

// Images locales pour pallier l'absence d'URLs en base de données mockée
const LOCAL_IMAGES = {
    'cotonsport': require('../assets/logos/Cotonsport_FC_de_Garoua.svg.png'),
    'canon': require('../assets/logos/Cannon_Sportifs_de_Yaounde.png'),
    'union': require('../assets/logos/Union_douala.jpg'),
    'tonnerre': require('../assets/logos/Tonnerre KalaraClub.png'),
    'racing': require('../assets/logos/Bafoussam_RC_logo.png'),
    'oryx': require('../assets/logos/Oryx_Douala_.png'),
    'dragon': require('../assets/logos/Dragon_Club_Yaoundé.png'),
    'newstars': require('../assets/logos/New_Stars_FC_Douala.png'),
    'yaounde2': require('../assets/logos/Yaoundé_II_FC.png'),
};

// Helper pour faire un fetch sécurisé avec timeout et vérification
const fetchSecurise = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // Timeout de 8 secondes

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} pour ${url}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        // Ne pas polluer le terminal avec les erreurs réseau pendant le polling
        if (error.name === 'AbortError') {
            console.log('⏳ Requête API trop lente, nouvelle tentative au prochain cycle...');
        }
        // Renvoyer null pour signaler un échec au lieu de crasher
        return null;
    }
};

export const fetchClubs = async () => {
    if (isMockMode) {
        const data = await fetchSecurise(`${API_BASE_URL}/clubs.json?t=${new Date().getTime()}`);
        
        if (!data) return null; // Signaler l'échec au DonneesContexte

        // On mappe les chaînes de caractères vers les modules require() locaux pour les images
        return data.map(club => ({
            ...club,
            logo: LOCAL_IMAGES[club.logo] || null,
            forme: ['V', 'N', 'D', 'V', 'V'], // Mock statique en attendant l'API
            palmares: [
                { titre: 'Championnat', annee: '2023' },
                { titre: 'Coupe', annee: '2020' },
            ]
        }));
    } else {
        const data = await fetchSecurise(`${API_BASE_URL}/clubs`);
        return data;
    }
};

export const fetchJoueurs = async () => {
    if (isMockMode) {
        const data = await fetchSecurise(`${API_BASE_URL}/joueurs.json?t=${new Date().getTime()}`);
        return data;
    } else {
        const data = await fetchSecurise(`${API_BASE_URL}/joueurs`);
        return data;
    }
};

export const fetchMatchs = async () => {
    if (isMockMode) {
        const data = await fetchSecurise(`${API_BASE_URL}/matchs.json?t=${new Date().getTime()}`);
        return data;
    } else {
        const data = await fetchSecurise(`${API_BASE_URL}/matchs`);
        return data;
    }
};

export const fetchClassement = async () => {
    if (isMockMode) {
        const data = await fetchSecurise(`${API_BASE_URL}/classement.json?t=${new Date().getTime()}`);
        return data;
    } else {
        const data = await fetchSecurise(`${API_BASE_URL}/classement`);
        return data;
    }
};

const LOCAL_IMAGES_ACTU = {
    'actu_fecafoot': require('../assets/actualites/actu_officiel.png'),
    'actu_match': require('../assets/actualites/actu_match.png'),
    'actu_transfert': require('../assets/actualites/actu_transfert.png'),
    'actu_canon': require('../assets/actualites/actu_match.png'),
};

export const fetchActualites = async () => {
    if (isMockMode) {
        const data = await fetchSecurise(`${API_BASE_URL}/actualites.json?t=${new Date().getTime()}`);
        if (!data) return [];
        return data.map(actu => ({
            ...actu,
            image: LOCAL_IMAGES_ACTU[actu.image] || require('../assets/actualites/actu_officiel.png')
        }));
    } else {
        const data = await fetchSecurise(`${API_BASE_URL}/actualites`);
        return data;
    }
};
