import React, { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Download, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  UserCheck,
  Palette
} from 'lucide-react';
import { SessionData, COLLEGE_PALETTE } from '../types';
import { calculateBassinStats, computeDnb, computeCfg } from '../utils/calculations';
import { collectDataIssues } from '../utils/dataIntegrity';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface DashboardViewProps {
  session: SessionData;
  isDark?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ session, isDark = false }) => {
  const establishments = session.establishments;
  const stats = calculateBassinStats(establishments);
  const dataIssues = collectDataIssues(establishments);

  // Mode de coloration : par couleur de collège ou par seuil de réussite
  const [colorMode, setColorMode] = useState<'college' | 'threshold'>('college');

  const dnbChartRef = useRef<any>(null);
  const cfgChartRef = useRef<any>(null);
  const mentionsChartRef = useRef<any>(null);
  const presentationRef = useRef<any>(null);
  const comparisonChartRef = useRef<any>(null);
  const globalDonutRef = useRef<any>(null);

  const downloadChartImage = (chartRef: React.RefObject<any>, fileName: string) => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const url = chart.toBase64Image('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${fileName}_${session.year.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  const labels = establishments.map((e) => e.name.replace('Collège ', '').replace('SEGPA ', ''));

  // Couleurs attribuées pour chaque collège
  const getCollegeColors = (alpha: number = 0.85) => {
    return establishments.map((e, index) => {
      const hex = e.color || COLLEGE_PALETTE[index % COLLEGE_PALETTE.length];
      return hex;
    });
  };

  const collegeColors = getCollegeColors();

  // 1. Taux de Réussite DNB Pro
  const dnbData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: '% Réussite DNB Pro (Présents)',
        data: establishments.map((e) => e.dnbComplete === false ? null : computeDnb(e.dnb, e.effectifClasse).tauxPresents),
        backgroundColor: colorMode === 'college'
          ? collegeColors
          : establishments.map((e) => {
              if (e.dnbComplete === false) return 'rgba(148, 163, 184, 0.2)';
              const rate = computeDnb(e.dnb, e.effectifClasse).tauxPresents;
              if (rate >= 85) return 'rgba(16, 185, 129, 0.85)';
              if (rate >= 70) return 'rgba(37, 99, 235, 0.85)';
              return 'rgba(245, 158, 11, 0.85)';
            }),
        borderColor: colorMode === 'college' ? collegeColors : '#1d4ed8',
        borderWidth: 1.5,
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: `Moyenne Bassin (${stats.dnb.tauxMoyenPresents}%)`,
        data: establishments.map(() => stats.dnb.tauxMoyenPresents),
        borderColor: '#dc2626',
        borderWidth: 2.5,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
        order: 1,
      },
    ],
  };

  // 2. Taux de Réussite CFG
  const cfgData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: '% Réussite CFG (Présents)',
        data: establishments.map((e) => e.cfgComplete === false ? null : computeCfg(e.cfg, e.effectifClasse).tauxPresents),
        backgroundColor: colorMode === 'college'
          ? collegeColors
          : establishments.map((e) => {
              if (e.cfgComplete === false) return 'rgba(148, 163, 184, 0.2)';
              const rate = computeCfg(e.cfg, e.effectifClasse).tauxPresents;
              if (rate === 100) return 'rgba(13, 148, 136, 0.9)';
              if (rate >= 85) return 'rgba(16, 185, 129, 0.85)';
              return 'rgba(234, 179, 8, 0.85)';
            }),
        borderColor: colorMode === 'college' ? collegeColors : '#0f766e',
        borderWidth: 1.5,
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: `Moyenne Bassin (${stats.cfg.tauxMoyenPresents}%)`,
        data: establishments.map(() => stats.cfg.tauxMoyenPresents),
        borderColor: '#9333ea',
        borderWidth: 2.5,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
        order: 1,
      },
    ],
  };

  // 3. Taux de Présentation au DNB Pro
  const presentationData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: '% Classe inscrite au DNB Pro',
        data: establishments.map((e) => e.dnbComplete === false ? null : computeDnb(e.dnb, e.effectifClasse).tauxPresentation),
        backgroundColor: collegeColors,
        borderColor: collegeColors,
        borderWidth: 1.5,
        borderRadius: 6,
        order: 2,
      },
      {
        type: 'line' as const,
        label: `Moyenne Présentation Bassin (${stats.tauxMoyenPresentationDnb}%)`,
        data: establishments.map(() => stats.tauxMoyenPresentationDnb),
        borderColor: '#f59e0b',
        borderWidth: 2.5,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
        order: 1,
      },
    ],
  };

  // 4. Mentions DNB Pro par Collège
  const mentionsStackedData = {
    labels,
    datasets: [
      {
        label: 'Mention Assez Bien (AB)',
        data: establishments.map((e) => e.dnbComplete === false ? 0 : (e.dnb.mentions?.ab || 0)),
        backgroundColor: '#10b981',
        borderRadius: 2,
      },
      {
        label: 'Mention Bien (B)',
        data: establishments.map((e) => e.dnbComplete === false ? 0 : (e.dnb.mentions?.b || 0)),
        backgroundColor: '#3b82f6',
        borderRadius: 2,
      },
      {
        label: 'Mention Très Bien (TB)',
        data: establishments.map((e) => e.dnbComplete === false ? 0 : (e.dnb.mentions?.tb || 0)),
        backgroundColor: '#f59e0b',
        borderRadius: 2,
      },
      {
        label: 'Admis Sans Mention',
        data: establishments.map((e) => e.dnbComplete === false ? 0 : computeDnb(e.dnb, e.effectifClasse).sansMention),
        backgroundColor: isDark ? '#64748b' : '#94a3b8',
        borderRadius: 2,
      },
    ],
  };

  // 5. Comparatif Croisé DNB Pro vs CFG
  const comparisonData = {
    labels,
    datasets: [
      {
        label: 'DNB Pro (% Réussite)',
        data: establishments.map((e) => e.dnbComplete === false ? null : computeDnb(e.dnb, e.effectifClasse).tauxPresents),
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 4,
      },
      {
        label: 'CFG (% Réussite)',
        data: establishments.map((e) => e.cfgComplete === false ? null : computeCfg(e.cfg, e.effectifClasse).tauxPresents),
        backgroundColor: 'rgba(20, 184, 166, 0.85)',
        borderColor: '#0d9488',
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  // 6. Donut Global Mentions Bassin
  const donutMentionsData = {
    labels: ['Assez Bien', 'Bien', 'Très Bien', 'Sans Mention'],
    datasets: [
      {
        data: [
          stats.dnb.mentionsAB,
          stats.dnb.mentionsB,
          stats.dnb.mentionsTB,
          stats.dnb.sansMention,
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', isDark ? '#64748b' : '#94a3b8'],
        borderColor: isDark ? '#0f172a' : '#ffffff',
        borderWidth: 3,
      },
    ],
  };

  // Options Chart.js adaptées au Dark Mode et à l'accessibilité
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.6)';

  const percentageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          boxWidth: 14,
          font: { size: 11, weight: 'bold' as const },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y} %`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: textColor, callback: (val: any) => `${val}%` },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor, autoSkip: false, maxRotation: 45, minRotation: 25, font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  const stackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: textColor, boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y} élève(s)`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: textColor, autoSkip: false, maxRotation: 45, minRotation: 25, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        stacked: true,
        ticks: { color: textColor, stepSize: 2 },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="space-y-8 pb-16 transition-colors">
      {dataIssues.length > 0 && (
        <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 p-4">
          <strong>Statistiques non validées : chiffres incohérents.</strong>
          <ul className="list-disc ml-5 text-xs">{dataIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
        </div>
      )}
      {/* Barre supérieure : Commutateur de mode couleur */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Affichage des graphiques :</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {colorMode === 'college' ? "Chaque collège a sa couleur attitrée" : "Couleurs selon le niveau de réussite"}
          </span>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setColorMode('college')}
            className={`px-3 py-1 rounded-lg transition ${
              colorMode === 'college'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🎨 Couleurs par collège
          </button>
          <button
            onClick={() => setColorMode('threshold')}
            className={`px-3 py-1 rounded-lg transition ${
              colorMode === 'threshold'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📊 Dégradé de réussite
          </button>
        </div>
      </div>

      <p role="note" className="text-xs text-slate-700 dark:text-slate-300">Couverture : {stats.dnbRenseignes}/{stats.totalEtablissements} établissements DNB renseignés, {stats.cfgRenseignes}/{stats.totalEtablissements} CFG renseignés. Les données manquantes sont exclues des taux consolidés.</p>
      {/* ========================================================================= */}
      {/* BANDEAU INDICATEURS CLÉS (KPIS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Présentation DNB Pro */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">PRÉSENTATION DNB</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">{stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}</span>
            <span className="text-xs font-medium text-slate-400">de la classe</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span><strong>{stats.dnb.inscrits}</strong> inscrits / {stats.dnbEffectifClasse}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{stats.totalEffectifClasse} élèves en 3e au total</span>
          </div>
        </div>

        {/* KPI 2 : Réussite DNB Pro */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">RÉUSSITE DNB PRO</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">{stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}</span>
            <span className="text-xs font-medium text-slate-400">sur candidats</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span><strong>{stats.dnb.admis}</strong> admis / {stats.dnb.presents}</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats.dnb.tauxMoyenClasse}% classe globale</span>
          </div>
        </div>

        {/* KPI 3 : Réussite CFG */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">RÉUSSITE CFG (100% classe)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">{stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}</span>
            <span className="text-xs font-medium text-slate-400">des élèves</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span><strong>{stats.cfg.admis}</strong> lauréats / {stats.cfg.presents}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{stats.totalEtablissements} SEGPA</span>
          </div>
        </div>

        {/* KPI 4 : Mentions DNB */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">MENTIONS DÉCERNÉES</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.dnbRenseignes ? stats.dnb.tauxMoyenMentions + '%' : 'N.R.'}</span>
            <span className="text-xs font-medium text-slate-400">des admis</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span><strong>{stats.dnb.totalMentions}</strong> mentions</span>
            <span className="text-amber-700 dark:text-amber-400 font-medium">{stats.dnb.mentionsAB} AB • {stats.dnb.mentionsB} B • {stats.dnb.mentionsTB} TB</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRILLE DES GRAPHIQUES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPHIQUE 1 : Taux de Présentation au DNB Pro */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Taux d'inscription au DNB Pro (% effectif de la classe)</h3>
                <span className="text-[11px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                  Moyenne: {stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Couleur individualisée pour chaque établissement du réseau
              </p>
            </div>
            <button
              onClick={() => downloadChartImage(presentationRef, 'Graphique_Taux_Presentation_DNB')}
              aria-label="Télécharger l'image PNG du graphique de présentation DNB"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Télécharger l'image PNG pour PowerPoint"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PNG HD</span>
            </button>
          </div>
          <div className="h-72 w-full">
            <Bar ref={presentationRef} data={presentationData as any} options={percentageOptions} />
          </div>
        </div>

        {/* GRAPHIQUE 2 : DNB Pro par Collège */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Taux de réussite DNB Pro (sur candidats)</h3>
                <span className="text-[11px] bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                  Moyenne: {stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comparatif par collège avec ligne repère moyenne de bassin</p>
            </div>
            <button
              onClick={() => downloadChartImage(dnbChartRef, 'Graphique_DNB_Pro_Comparatif')}
              aria-label="Télécharger l'image PNG du comparatif DNB Pro"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Télécharger l'image PNG"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PNG HD</span>
            </button>
          </div>
          <div className="h-72 w-full">
            <Bar ref={dnbChartRef} data={dnbData as any} options={percentageOptions} />
          </div>
        </div>

        {/* GRAPHIQUE 3 : CFG par Collège */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Taux de réussite CFG (Certificat de Formation Générale)</h3>
                <span className="text-[11px] bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-semibold px-2 py-0.5 rounded-full">
                  Moyenne: {stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Examen passé par 100% des élèves de 3e SEGPA</p>
            </div>
            <button
              onClick={() => downloadChartImage(cfgChartRef, 'Graphique_CFG_Comparatif')}
              aria-label="Télécharger l'image PNG du comparatif CFG"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Télécharger l'image PNG"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PNG HD</span>
            </button>
          </div>
          <div className="h-72 w-full">
            <Bar ref={cfgChartRef} data={cfgData as any} options={percentageOptions} />
          </div>
        </div>

        {/* GRAPHIQUE 4 : Répartition détaillée des Mentions DNB Pro */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Détail des mentions DNB Pro (AB, B, TB)</h3>
                <span className="text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                  {stats.dnb.totalMentions} mentions au total
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Barres empilées par établissement</p>
            </div>
            <button
              onClick={() => downloadChartImage(mentionsChartRef, 'Graphique_Mentions_DNB_Pro')}
              aria-label="Télécharger l'image PNG des mentions"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Télécharger l'image PNG"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PNG HD</span>
            </button>
          </div>
          <div className="h-72 w-full">
            <Bar ref={mentionsChartRef} data={mentionsStackedData} options={stackedOptions} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEUXIÈME LIGNE : CAMEMBERT GLOBAL & COMPARAISON CROISÉE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camembert Global Mentions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Profil global des mentions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ensemble des lauréats DNB du bassin</p>
            </div>
            <button
              onClick={() => downloadChartImage(globalDonutRef, 'Donut_Mentions_Bassin')}
              aria-label="Télécharger PNG du donut des mentions"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Télécharger PNG"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="w-56 h-56 relative my-auto">
            <Doughnut
              ref={globalDonutRef}
              data={donutMentionsData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: textColor, boxWidth: 10, font: { size: 10 } },
                  },
                },
                cutout: '62%',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.dnb.admis}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Lauréats DNB</span>
            </div>
          </div>
        </div>

        {/* Graphique Comparaison croisée DNB Pro vs CFG */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white">Comparaison croisée DNB Pro vs CFG par collège</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mise en regard des taux de réussite aux deux diplômes</p>
            </div>
            <button
              onClick={() => downloadChartImage(comparisonChartRef, 'Graphique_DNB_vs_CFG')}
              aria-label="Télécharger l'image PNG de comparaison croisée"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition border border-slate-200 dark:border-slate-700"
              title="Télécharger PNG"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PNG HD</span>
            </button>
          </div>
          <div className="h-64 w-full">
            <Bar ref={comparisonChartRef} data={comparisonData} options={percentageOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
