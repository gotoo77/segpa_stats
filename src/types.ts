export interface DnbData {
  inscrits: number;
  presents?: number;
  admis: number;
  refuses: number;
  mentions: {
    ab: number; // Assez Bien
    b: number;  // Bien
    tb: number; // Très Bien
  };
}

export interface CfgData {
  inscrits: number;
  presents?: number;
  admis: number;
  refuses: number;
}

export interface RegionConfig {
  id: string;
  name: string;
  color: string;
}

export interface Establishment {
  id: string;
  name: string;
  city?: string;
  bassin?: string; // ex: "Douaisis", "Cambrésis", ou toute région créée
  color?: string; // Couleur personnalisée pour le collège
  effectifClasse: number; // Effectif total de la classe de 3e SEGPA
  dnb: DnbData;
  cfg: CfgData;
  /** false = résultats non renseignés. Absent = renseignés, pour compatibilité avec les données existantes. */
  dnbComplete?: boolean;
  cfgComplete?: boolean;
}

export type SubmissionStatus = 'pending' | 'approved' | 'modified';

export interface ColleagueSubmission {
  id: string;
  establishmentName: string;
  city?: string;
  bassin?: string;
  color?: string;
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
  teacherComment?: string;
  directorNotes?: string;
  effectifClasse: number;
  dnb: DnbData;
  cfg: CfgData;
}

export interface SessionData {
  id: string;
  year: string;
  bassinName: string;
  regions?: RegionConfig[];
  establishments: Establishment[];
  dataOrigin?: 'demo' | 'user';
  submissions?: ColleagueSubmission[];
  notes?: string;
  lastUpdated: string;
}

export interface ComputedDnb {
  presents: number;
  absents: number;
  totalMentions: number;
  sansMention: number;
  tauxPresentation: number; // % inscrits / effectifClasse
  tauxInscrits: number;     // % admis / inscrits
  tauxPresents: number;     // % admis / presents
  tauxClasse: number;       // % admis / effectifClasse
  tauxMentions: number;     // % totalMentions / admis
  errors: string[];
}

export interface ComputedCfg {
  presents: number;
  absents: number;
  tauxInscrits: number; // % admis / inscrits
  tauxPresents: number; // % admis / presents
  tauxClasse: number;   // % admis / effectifClasse
  errors: string[];
}

export interface BassinStats {
  totalEtablissements: number;
  dnbRenseignes: number;
  cfgRenseignes: number;
  totalEffectifClasse: number;
  tauxMoyenPresentationDnb: number;
  dnb: {
    inscrits: number;
    presents: number;
    admis: number;
    refuses: number;
    absents: number;
    mentionsAB: number;
    mentionsB: number;
    mentionsTB: number;
    totalMentions: number;
    sansMention: number;
    tauxMoyenInscrits: number;
    tauxMoyenPresents: number;
    tauxMoyenMentions: number;
    tauxMoyenClasse: number;
  };
  cfg: {
    inscrits: number;
    presents: number;
    admis: number;
    refuses: number;
    absents: number;
    tauxMoyenInscrits: number;
    tauxMoyenPresents: number;
    tauxMoyenClasse: number;
  };
}

// Régions par défaut
export const DEFAULT_REGIONS: RegionConfig[] = [
  { id: 'reg-douaisis', name: 'Douaisis', color: '#2563eb' },
  { id: 'reg-cambresis', name: 'Cambrésis', color: '#0d9488' },
];

// Palette de 16 couleurs distinctes, harmonieuses et contrastées pour chaque collège (conforme WCAG)
export const COLLEGE_PALETTE = [
  '#2563eb', // Bleu Roi (Dutilleul)
  '#0d9488', // Teal / Sarcelle (Cremaillel)
  '#d97706', // Ambre doré (Richtbeurg)
  '#7c3aed', // Violet
  '#db2777', // Rose fuchsia
  '#059669', // Émeraude
  '#4f46e5', // Indigo
  '#ea580c', // Orange vif
  '#0891b2', // Cyan profond
  '#9333ea', // Pourpre
  '#65a30d', // Vert lime
  '#0284c7', // Bleu ciel
  '#b91c1c', // Rouge carmin
  '#0f766e', // Vert canard
  '#c026d3', // Magenta
  '#ca8a04', // Moutarde
];

export interface PresentationSettings {
  title: string;
  badge: string;
  subtitle: string;
  presenter: string;
  closingMessage: string;
  enabledSlides: {
    intro: boolean;
    kpis: boolean;
    dnb: boolean;
    cfg: boolean;
    mentions: boolean;
    comparison: boolean;
  };
  theme: 'dark' | 'light';
}

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  title: 'Bilan des Résultats aux Examens : DNB Professionnel & CFG',
  badge: '', // Vide = bassin affiché dans la session active
  subtitle: 'Direction & Coordination du Réseau',
  presenter: 'Direction SEGPA',
  closingMessage: "Félicitations à l'ensemble des élèves et aux équipes pédagogiques du bassin pour leur investissement !",
  enabledSlides: {
    intro: true,
    kpis: true,
    dnb: true,
    cfg: true,
    mentions: true,
    comparison: true,
  },
  theme: 'dark',
};
