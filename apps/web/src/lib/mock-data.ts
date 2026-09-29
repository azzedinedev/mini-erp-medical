export type NavItem = { label: string; href: string; icon: string; badge?: string };

export const navGroups: Array<{ label: string; items: NavItem[] }> = [
  { label: 'Pilotage', items: [
    { label: "Vue d'ensemble", href: '/', icon: 'LayoutDashboard' },
    { label: 'Dossiers patients', href: '/patients', icon: 'FolderHeart', badge: '1,284' },
    { label: 'Missions terrain', href: '/missions', icon: 'MapPinned' },
    { label: 'Livraisons', href: '/deliveries', icon: 'Truck' },
  ] },
  { label: 'Opérations', items: [
    { label: 'Ordonnances', href: '/prescriptions', icon: 'Syringe', badge: '12' },
    { label: 'Inventaire', href: '/inventory', icon: 'Package' },
    { label: 'Gestion documentaire', href: '/documents', icon: 'Files' },
    { label: 'Équipe médicale', href: '/team', icon: 'Stethoscope' },
    { label: 'Partenaires & clients', href: '/partners', icon: 'Handshake' },
  ] },
  { label: 'Administration', items: [
    { label: 'Utilisateurs & rôles', href: '/users', icon: 'UsersRound' },
    { label: 'Référentiels', href: '/references', icon: 'ListChecks' },
    { label: 'Finance', href: '/finance', icon: 'ReceiptText' },
    { label: 'Paramètres', href: '/settings', icon: 'Settings2' },
  ] },
];

export const statCards = [
  { label: 'Patients actifs', value: '1 284', trend: '+12,5 %', hint: 'vs. mois dernier', icon: 'FolderHeart', tone: 'teal', trendTone: 'up' },
  { label: 'Missions aujourd’hui', value: '28', trend: '+4', hint: 'vs. hier', icon: 'MapPinned', tone: 'blue', trendTone: 'up' },
  { label: 'Ordonnances à valider', value: '12', trend: 'À traiter', hint: 'dans votre file', icon: 'Syringe', tone: 'gold', trendTone: 'neutral' },
  { label: 'Stock critique', value: '07', trend: '+2', hint: 'articles à réapprovisionner', icon: 'Package', tone: 'coral', trendTone: 'down' },
] as const;

export const schedule = [
  { time: '09:00', name: 'Camille Bernard', kind: 'Consultation cardiologie', initials: 'CB', next: true, tone: 'teal' },
  { time: '10:30', name: 'Youssef Haddad', kind: 'Soins à domicile · Mission MIS-000248', initials: 'YH', next: false, tone: 'blue' },
  { time: '11:15', name: 'Élodie Petit', kind: 'Renouvellement ordonnance', initials: 'EP', next: false, tone: 'gold' },
  { time: '14:00', name: 'Marc Dubois', kind: 'Bilan biologique', initials: 'MD', next: false, tone: 'teal' },
];

export const recentPatients = [
  { firstName: 'Camille', lastName: 'Bernard', code: 'PAT-000847', age: '42 ans', action: 'Consultation cardiologie', date: 'Aujourd’hui, 08:42', status: 'Actif', initials: 'CB' },
  { firstName: 'Youssef', lastName: 'Haddad', code: 'PAT-000846', age: '65 ans', action: 'Soins infirmiers', date: 'Aujourd’hui, 08:17', status: 'Actif', initials: 'YH' },
  { firstName: 'Élodie', lastName: 'Petit', code: 'PAT-000845', age: '33 ans', action: 'Ordonnance créée', date: 'Hier, 17:36', status: 'Suivi', initials: 'EP' },
  { firstName: 'Marc', lastName: 'Dubois', code: 'PAT-000844', age: '57 ans', action: 'Résultat ajouté au dossier', date: 'Hier, 15:22', status: 'Actif', initials: 'MD' },
];

export const activities = [
  { actor: 'Dr. Sofia Martin', action: 'a signé l’ordonnance', target: 'ORD-001932', time: 'Il y a 12 min', icon: 'FileCheck2', tone: 'teal' },
  { actor: 'Nina Rossi', action: 'a terminé la mission', target: 'MIS-000248', time: 'Il y a 38 min', icon: 'CircleCheck', tone: 'coral' },
  { actor: 'Thomas Nguyen', action: 'a ajouté un résultat au dossier', target: 'PAT-000844', time: 'Il y a 1 h', icon: 'FilePlus2', tone: 'gold' },
  { actor: 'Stock', action: 'seuil critique détecté sur', target: '2 articles', time: 'Il y a 2 h', icon: 'TriangleAlert', tone: 'coral' },
];

export const moduleConfigs = {
  patients: { eyebrow: 'Dossiers & parcours', title: 'Dossiers patients', description: 'Retrouvez les informations cliniques, interventions et documents en un seul endroit.', icon: 'FolderHeart', primary: 'Nouveau dossier', stats: [['Patients actifs', '1 284', '+12,5 % ce mois'], ['Interventions ce mois', '426', '+8,2 %'], ['Dossiers à compléter', '18', 'À vérifier']], tabs: ['Tous les dossiers', 'Actifs', 'À compléter', 'Archivés'], columns: ['Patient', 'Dernière activité', 'Lieu de soins', 'Statut', 'Dernière mise à jour'] },
  prescriptions: { eyebrow: 'Sécuriser le parcours médicamenteux', title: 'Ordonnances', description: 'Créez, signez et suivez les prescriptions électroniques avec traçabilité.', icon: 'Syringe', primary: 'Nouvelle ordonnance', stats: [['Total ce mois', '186', '+14,7 %'], ['En attente de signature', '12', 'À traiter'], ['Délivrées', '143', '76,9 % du total']], tabs: ['Toutes', 'Brouillons', 'À signer', 'Délivrées'], columns: ['Ordonnance', 'Patient', 'Prescripteur', 'Date', 'Statut'] },
  inventory: { eyebrow: 'Flux & approvisionnement', title: 'Inventaire', description: 'Suivez les niveaux de stock, mouvements et alertes de réapprovisionnement.', icon: 'Package', primary: 'Ajouter un article', stats: [['Valeur du stock', '48 290 €', '+3,1 %'], ['Articles référencés', '342', '12 catégories'], ['Alertes seuil bas', '07', 'À réapprovisionner']], tabs: ['Tous les articles', 'Stock critique', 'Mouvements récents'], columns: ['Article', 'Catégorie', 'Stock disponible', 'Emplacement', 'Statut'] },
  missions: { eyebrow: 'Coordination terrain', title: 'Missions', description: 'Planifiez les interventions, affectez vos équipes et suivez chaque étape.', icon: 'MapPinned', primary: 'Planifier une mission', stats: [['Missions aujourd’hui', '28', '4 en cours'], ['Taux de réalisation', '94 %', '+2,4 %'], ['Temps moyen', '42 min', '-6 min']], tabs: ['Toutes', 'À venir', 'En cours', 'Terminées'], columns: ['Mission', 'Patient / client', 'Intervenant', 'Horaire', 'Statut'] },
  deliveries: { eyebrow: 'Logistique clinique', title: 'Livraisons', description: 'Pilotez les bordereaux, les statuts et la traçabilité de chaque livraison.', icon: 'Truck', primary: 'Créer une livraison', stats: [['Livraisons ce mois', '94', '+9,4 %'], ['En transit', '08', 'Suivi en temps réel'], ['Livrées à temps', '97 %', '+1,8 %']], tabs: ['Toutes', 'En attente', 'En cours', 'Livrées'], columns: ['Bordereau', 'Destinataire', 'Mission liée', 'Date prévue', 'Statut'] },
  documents: { eyebrow: 'Centraliser & retrouver', title: 'Gestion documentaire', description: 'Organisez les pièces, versions et résultats liés à chaque dossier.', icon: 'Files', primary: 'Importer un document', stats: [['Documents stockés', '3 842', '+18 ce mois'], ['À classer', '16', 'Action requise'], ['Espace utilisé', '38,4 Go', 'sur 100 Go']], tabs: ['Tous les documents', 'Récents', 'À classer', 'Mes imports'], columns: ['Document', 'Catégorie', 'Entité liée', 'Version', 'Ajouté le'] },
  team: { eyebrow: 'Ressources & habilitations', title: 'Équipe médicale', description: 'Gérez les profils, spécialités, disponibilités et affectations.', icon: 'Stethoscope', primary: 'Ajouter un membre', stats: [['Membres actifs', '36', '4 spécialités'], ['Disponibles aujourd’hui', '24', '66,7 % de l’équipe'], ['Missions assignées', '28', 'Aujourd’hui']], tabs: ['Tous', 'Médecins', 'Infirmiers', 'Techniciens'], columns: ['Membre', 'Fonction', 'Spécialité', 'Disponibilité', 'Statut'] },
  partners: { eyebrow: 'Écosystème de soins', title: 'Partenaires & clients', description: 'Suivez vos établissements partenaires, contacts et interactions.', icon: 'Handshake', primary: 'Ajouter un partenaire', stats: [['Partenaires actifs', '48', '+3 ce trimestre'], ['Commandes en cours', '16', 'À suivre'], ['Chiffre d’affaires', '82 460 €', 'ce trimestre']], tabs: ['Tous', 'Établissements', 'Clients', 'Prospects'], columns: ['Organisation', 'Type', 'Contact principal', 'Dernière interaction', 'Statut'] },
  users: { eyebrow: 'Accès & sécurité', title: 'Utilisateurs & rôles', description: 'Administrez les comptes, rôles dynamiques et permissions granulaires.', icon: 'UsersRound', primary: 'Inviter un utilisateur', stats: [['Utilisateurs actifs', '24', '2 invitations en attente'], ['2FA activée', '83 %', 'Recommandé : 100 %'], ['Rôles configurés', '07', 'Permissions à jour']], tabs: ['Tous les utilisateurs', 'Actifs', 'Invitations', 'Suspendus'], columns: ['Utilisateur', 'Rôles', 'Dernière connexion', '2FA', 'Statut'] },
  references: { eyebrow: 'Configuration métier', title: 'Référentiels', description: 'Administrez les types d’actes, médicaments et libellés multilingues.', icon: 'ListChecks', primary: 'Ajouter une entrée', stats: [['Types d’intervention', '18', '4 langues'], ['Médicaments actifs', '264', '12 ajoutés ce mois'], ['Éléments archivés', '09', 'À réviser']], tabs: ['Types d’actes', 'Soins infirmiers', 'Médicaments'], columns: ['Libellé', 'Type', 'Code', 'Dernière modification', 'Statut'] },
  finance: { eyebrow: 'Pilotage financier', title: 'Finance', description: 'Suivez les pièces, tarifs, dépenses et montants avec une structure TVA complète.', icon: 'ReceiptText', primary: 'Créer une pièce', stats: [['Chiffre d’affaires', '128 640 €', '+11,2 % ce mois'], ['En attente de paiement', '18 420 €', '12 pièces'], ['Dépenses du mois', '34 280 €', '-4,6 %']], tabs: ['Toutes les pièces', 'Brouillons', 'Émises', 'Payées'], columns: ['Pièce', 'Client / partenaire', 'Émise le', 'Montant TTC', 'Statut'] },
  settings: { eyebrow: 'Administration', title: 'Paramètres', description: 'Configurez l’identité, les modules, la sécurité et les préférences de MediFlow.', icon: 'Settings2', primary: 'Enregistrer', stats: [], tabs: ['Général', 'Sécurité', 'Modules', 'Apparence'], columns: [] },
} as const;
