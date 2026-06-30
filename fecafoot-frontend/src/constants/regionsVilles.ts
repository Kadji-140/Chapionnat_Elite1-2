// src/constants/regionsVilles.ts

export const REGIONS_ET_VILLES = [
    {
        region: 'Centre',
        villes: ['Yaoundé', 'Mbalmayo', 'Obala', 'Mfou', 'Nanga Eboko', 'Monatélé', 'Essé', 'Ngoumou']
    },
    {
        region: 'Littoral',
        villes: ['Douala', 'Edéa', 'Loum', 'Nkongsamba', 'Manjo', 'Yabassi', 'Dibombari', 'Mbanga']
    },
    {
        region: 'Ouest',
        villes: ['Bafoussam', 'Dschang', 'Foumban', 'Mbouda', 'Bangangté', 'Bafang', 'Kékem', 'Tonga']
    },
    {
        region: 'Sud-Ouest',
        villes: ['Buea', 'Limbé', 'Kumba', 'Mamfe', 'Tiko', 'Muyuka', 'Fontem']
    },
    {
        region: 'Nord-Ouest',
        villes: ['Bamenda', 'Kumbo', 'Ndop', 'Wum', 'Nkambe', 'Bali', 'Mbengwi']
    },
    {
        region: 'Adamaoua',
        villes: ['Ngaoundéré', 'Tibati', 'Bélel', 'Mbé', 'Meiganga', 'Ngaoui']
    },
    {
        region: 'Nord',
        villes: ['Garoua', 'Maroua', 'Mokolo', 'Guider', 'Kousséri', 'Figuil', 'Lagdo', 'Poli']
    },
    {
        region: 'Extrême-Nord',
        villes: ['Maroua', 'Mokolo', 'Kousséri', 'Yagoua', 'Mora', 'Tokombéré', 'Koza', 'Bogo']
    },
    {
        region: 'Est',
        villes: ['Bertoua', 'Batouri', 'Yokadouma', 'Abong-Mbang', 'Doumé', 'Ndelele', 'Kenzou']
    },
    {
        region: 'Sud',
        villes: ['Ebolowa', 'Kribi', 'Ambam', 'Mvangan', 'Sangmélima', 'Meyomessala', 'Olamze']
    },
];

// Toutes les villes aplaties pour le select simple
export const TOUTES_VILLES = REGIONS_ET_VILLES.flatMap(r => r.villes);