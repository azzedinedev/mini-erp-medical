export type NavItem = { label: string; href: string; icon: string };

export const navGroups: Array<{ label: string; items: NavItem[] }> = [
  { label: 'Pilotage', items: [
    { label: "Vue d'ensemble", href: '/', icon: 'LayoutDashboard' },
    { label: 'Dossiers patients', href: '/patients', icon: 'FolderHeart' },
    { label: 'Missions terrain', href: '/missions', icon: 'MapPinned' },
    { label: 'Livraisons', href: '/deliveries', icon: 'Truck' },
  ] },
  { label: 'Opérations', items: [
    { label: 'Ordonnances', href: '/prescriptions', icon: 'Syringe' },
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


export const moduleConfigs = {
  patients: { eyebrow: 'Dossiers & parcours', title: 'Dossiers patients', description: 'Retrouvez les informations cliniques, interventions et documents en un seul endroit.', icon: 'FolderHeart', primary: 'Nouveau dossier', tabs: ['Tous les dossiers', 'Actifs', 'À compléter', 'Archivés'], columns: ['Patient', 'Dernière activité', 'Lieu de soins', 'Statut', 'Dernière mise à jour'] },
  prescriptions: { eyebrow: 'Sécuriser le parcours médicamenteux', title: 'Ordonnances', description: 'Créez, signez et suivez les prescriptions électroniques avec traçabilité.', icon: 'Syringe', primary: 'Nouvelle ordonnance', tabs: ['Toutes', 'Brouillons', 'À signer', 'Délivrées'], columns: ['Ordonnance', 'Patient', 'Prescripteur', 'Date', 'Statut'] },
  inventory: { eyebrow: 'Flux & approvisionnement', title: 'Inventaire', description: 'Suivez les niveaux de stock, mouvements et alertes de réapprovisionnement.', icon: 'Package', primary: 'Ajouter un article', tabs: ['Tous les articles', 'Stock critique', 'Mouvements récents'], columns: ['Article', 'Catégorie', 'Stock disponible', 'Emplacement', 'Statut'] },
  missions: { eyebrow: 'Coordination terrain', title: 'Missions', description: 'Planifiez les interventions, affectez vos équipes et suivez chaque étape.', icon: 'MapPinned', primary: 'Planifier une mission', tabs: ['Toutes', 'À venir', 'En cours', 'Terminées'], columns: ['Mission', 'Patient / client', 'Intervenant', 'Horaire', 'Statut'] },
  deliveries: { eyebrow: 'Logistique clinique', title: 'Livraisons', description: 'Pilotez les bordereaux, les statuts et la traçabilité de chaque livraison.', icon: 'Truck', primary: 'Créer une livraison', tabs: ['Toutes', 'En attente', 'En cours', 'Livrées'], columns: ['Bordereau', 'Destinataire', 'Mission liée', 'Date prévue', 'Statut'] },
  documents: { eyebrow: 'Centraliser & retrouver', title: 'Gestion documentaire', description: 'Organisez les pièces, versions et résultats liés à chaque dossier.', icon: 'Files', primary: 'Importer un document', tabs: ['Tous les documents', 'Récents', 'À classer', 'Mes imports'], columns: ['Document', 'Catégorie', 'Entité liée', 'Version', 'Ajouté le'] },
  team: { eyebrow: 'Ressources & habilitations', title: 'Équipe médicale', description: 'Gérez les profils, spécialités, disponibilités et affectations.', icon: 'Stethoscope', primary: 'Ajouter un membre', tabs: ['Tous', 'Médecins', 'Infirmiers', 'Techniciens'], columns: ['Membre', 'Fonction', 'Spécialité', 'Disponibilité', 'Statut'] },
  partners: { eyebrow: 'Écosystème de soins', title: 'Partenaires & clients', description: 'Suivez vos établissements partenaires, contacts et interactions.', icon: 'Handshake', primary: 'Ajouter un partenaire', tabs: ['Tous', 'Établissements', 'Clients', 'Prospects'], columns: ['Organisation', 'Type', 'Contact principal', 'Dernière interaction', 'Statut'] },
  users: { eyebrow: 'Accès & sécurité', title: 'Utilisateurs & rôles', description: 'Administrez les comptes, rôles dynamiques et permissions granulaires.', icon: 'UsersRound', primary: 'Inviter un utilisateur', tabs: ['Tous les utilisateurs', 'Actifs', 'Invitations', 'Suspendus'], columns: ['Utilisateur', 'Rôles', 'Dernière connexion', '2FA', 'Statut'] },
  references: { eyebrow: 'Configuration métier', title: 'Référentiels', description: 'Administrez les types d’actes, médicaments et libellés multilingues.', icon: 'ListChecks', primary: 'Ajouter une entrée', tabs: ['Types d’actes', 'Soins infirmiers', 'Médicaments'], columns: ['Libellé', 'Type', 'Code', 'Dernière modification', 'Statut'] },
  finance: { eyebrow: 'Pilotage financier', title: 'Finance', description: 'Suivez les pièces, tarifs, dépenses et montants avec une structure TVA complète.', icon: 'ReceiptText', primary: 'Créer une pièce', tabs: ['Toutes les pièces', 'Brouillons', 'Émises', 'Payées'], columns: ['Pièce', 'Client / partenaire', 'Émise le', 'Montant TTC', 'Statut'] },
  settings: { eyebrow: 'Administration', title: 'Paramètres', description: 'Configurez l’identité, les modules, la sécurité et les préférences de MediFlow.', icon: 'Settings2', primary: 'Enregistrer', tabs: ['Général', 'Sécurité', 'Modules', 'Apparence'], columns: [] },
} as const;
