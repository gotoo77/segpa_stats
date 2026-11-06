import React, { useState } from 'react';
import { Printer, FileText, Sun, Moon, Eye } from 'lucide-react';
import { SessionData } from '../types';
import { calculateBassinStats, computeDnb, computeCfg } from '../utils/calculations';

interface PrintReportProps {
  session: SessionData;
}

export const PrintReport: React.FC<PrintReportProps> = ({ session }) => {
  const establishments = session.establishments;
  const stats = calculateBassinStats(establishments);
  const [reportTheme, setReportTheme] = useState<'paper' | 'dark'>('paper');

  const handlePrint = () => {
    window.print();
  };

  const isPaper = reportTheme === 'paper';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Barre d'outils du rapport */}
      <div className="no-print bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rapport Récapitulatif Imprimable</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mise en page officielle pour transmission inspection / réunion de secteur (Ctrl+P ou bouton Imprimer)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bascule Aperçu Feuille A4 / Mode Sombre */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReportTheme('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                isPaper
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Aperçu tel qu'il sera imprimé sur papier blanc A4"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Feuille Papier A4</span>
            </button>
            <button
              onClick={() => setReportTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                !isPaper
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Aperçu adapté pour le confort de lecture en mode sombre"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mode Sombre</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer ou Enregistrer en PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT OFFICIEL */}
      <div
        className={`p-8 rounded-3xl border shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black transition-colors ${
          isPaper
            ? 'report-paper bg-white text-slate-900 border-slate-200'
            : 'bg-slate-900 text-slate-100 border-slate-800'
        }`}
      >
        {/* En-tête officiel */}
        <div
          className={`pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b-2 ${
            isPaper ? 'border-slate-900' : 'border-slate-700'
          }`}
        >
          <div>
            <div
              className={`text-xs font-bold uppercase tracking-widest ${
                isPaper ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              ÉDUCATION NATIONALE • SEGPA
            </div>
            <h1
              className={`text-2xl font-black mt-1 ${
                isPaper ? 'text-slate-950' : 'text-white'
              }`}
            >
              Bilan Statistique des Examens : DNB Pro & CFG
            </h1>
            <div
              className={`text-sm font-bold mt-1 ${
                isPaper ? 'text-blue-800' : 'text-blue-400'
              }`}
            >
              {session.bassinName} — {session.year}
            </div>
          </div>
          <div
            className={`text-left sm:text-right text-xs space-y-0.5 font-medium ${
              isPaper ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            <div>Date du document : <span className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</span></div>
            <div>Effectif global : <strong className={isPaper ? 'text-amber-900' : 'text-amber-400'}>{stats.totalEffectifClasse}</strong> élèves de 3e</div>
            <div>Établissements : <strong className={isPaper ? 'text-slate-900' : 'text-white'}>{stats.totalEtablissements}</strong> collèges</div>
          </div>
        </div>

        <p role="note" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Couverture : DNB {stats.dnbRenseignes}/{stats.totalEtablissements}, CFG {stats.cfgRenseignes}/{stats.totalEtablissements} établissements renseignés. N.R. signifie « non renseigné ».</p>
        {session.dataOrigin === 'demo' && (
          <p role="note" className="border-2 border-amber-600 rounded-md p-2 text-xs font-bold text-amber-900 bg-amber-50">
            Données fictives de démonstration : ne pas utiliser comme résultats officiels.
          </p>
        )}
        {/* Synthèse globale en encadrés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div
            className={`p-3 rounded-2xl border ${
              isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
              Présentation DNB
            </span>
            <span className={`text-2xl font-black ${isPaper ? 'text-indigo-800' : 'text-indigo-400'}`}>
              {stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}
            </span>
            <span className={`block text-[11px] font-medium ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              {stats.dnb.inscrits} inscrits / {stats.totalEffectifClasse}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
              Taux Réussite DNB
            </span>
            <span className={`text-2xl font-black ${isPaper ? 'text-blue-800' : 'text-blue-400'}`}>
              {stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}
            </span>
            <span className={`block text-[11px] font-medium ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              {stats.dnb.admis} admis / {stats.dnb.presents}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
              Taux Réussite CFG
            </span>
            <span className={`text-2xl font-black ${isPaper ? 'text-emerald-800' : 'text-emerald-400'}`}>
              {stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}
            </span>
            <span className={`block text-[11px] font-medium ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              {stats.cfg.admis} admis / {stats.cfg.presents}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
            }`}
          >
            <span className={`block text-[11px] font-bold uppercase tracking-wider ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
              Total Mentions DNB
            </span>
            <span className={`text-2xl font-black ${isPaper ? 'text-amber-800' : 'text-amber-400'}`}>
              {stats.dnb.totalMentions}
            </span>
            <span className={`block text-[11px] font-medium ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              {stats.dnb.mentionsAB} AB • {stats.dnb.mentionsB} B • {stats.dnb.mentionsTB} TB
            </span>
          </div>
        </div>

        {/* 1. Tableau DNB PRO */}
        <div className="space-y-2">
          <h2
            className={`text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl ${
              isPaper ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-blue-950/60 text-blue-300 border border-blue-800'
            }`}
          >
            1. DNB SÉRIE PROFESSIONNELLE — DÉTAIL PAR ÉTABLISSEMENT
          </h2>

          <div className="overflow-x-auto">
            <table
              className={`w-full text-xs border text-left ${
                isPaper ? 'border-slate-300' : 'border-slate-700'
              }`}
            >
              <thead
                className={`font-bold border-b ${
                  isPaper
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-slate-800 text-slate-100 border-slate-700'
                }`}
              >
                <tr>
                  <th className="p-2 border-r border-inherit">Établissement</th>
                  <th className={`p-2 text-center border-r border-inherit ${isPaper ? 'bg-amber-100/70 text-amber-950' : 'bg-amber-950/50 text-amber-300'}`}>
                    Effectif
                  </th>
                  <th className="p-2 text-center border-r border-inherit">Inscrits</th>
                  <th className="p-2 text-center border-r border-inherit">% Présenté</th>
                  <th className="p-2 text-center border-r border-inherit">Admis</th>
                  <th className="p-2 text-center border-r border-inherit">Refusés</th>
                  <th className="p-2 text-center border-r border-inherit">AB</th>
                  <th className="p-2 text-center border-r border-inherit">B</th>
                  <th className="p-2 text-center border-r border-inherit">TB</th>
                  <th className="p-2 text-center border-r border-inherit">% / Inscrits</th>
                  <th className="p-2 text-center font-black">% / Présents</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isPaper ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {establishments.map((est) => {
                  const comp = computeDnb(est.dnb, est.effectifClasse);
                  const color = est.color || '#2563eb';
                  return (
                    <tr
                      key={est.id}
                      className={
                        isPaper ? 'hover:bg-slate-50 text-slate-900' : 'hover:bg-slate-800/50 text-slate-100'
                      }
                    >
                      <td className="p-2 font-bold border-r border-inherit flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-black/20"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span className={isPaper ? 'text-slate-950' : 'text-white'}>{est.name}</span>
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-black ${
                        isPaper ? 'text-amber-950 bg-amber-50/70' : 'text-amber-300 bg-amber-950/20'
                      }`}>
                        {est.effectifClasse}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {est.dnb.inscrits}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                        {est.dnbComplete === false ? 'N.R.' : comp.tauxPresentation + '%'}
                      </td>
                      <td className={`p-2 text-center font-black border-r border-inherit ${
                        isPaper ? 'text-emerald-800' : 'text-emerald-400'
                      }`}>
                        {est.dnb.admis}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${
                        est.dnb.refuses > 0 
                          ? (isPaper ? 'text-rose-800 font-bold' : 'text-rose-400 font-bold') 
                          : (isPaper ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        {est.dnb.refuses}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {est.dnb.mentions?.ab || 0}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {est.dnb.mentions?.b || 0}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {est.dnb.mentions?.tb || 0}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-bold ${isPaper ? 'text-blue-900' : 'text-blue-300'}`}>
                        {est.dnbComplete === false ? 'N.R.' : comp.tauxInscrits + '%'}
                      </td>
                      <td className={`p-2 text-center font-black ${
                        isPaper ? 'text-slate-950 bg-slate-100' : 'text-white bg-slate-800'
                      }`}>
                        {est.dnbComplete === false ? 'N.R.' : comp.tauxPresents + '%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot
                className={`font-black border-t-2 ${
                  isPaper
                    ? 'bg-slate-200 text-slate-950 border-slate-400'
                    : 'bg-slate-800 text-white border-slate-600'
                }`}
              >
                <tr>
                  <td className="p-2 border-r border-inherit uppercase">TOTAL / MOYENNE BASSIN</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'bg-amber-200 text-amber-950' : 'bg-amber-900/60 text-amber-200'}`}>
                    {stats.totalEffectifClasse}
                  </td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnb.inscrits}</td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    {stats.dnb.admis}
                  </td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnb.refuses}</td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnb.mentionsAB}</td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnb.mentionsB}</td>
                  <td className="p-2 text-center border-r border-inherit">{stats.dnb.mentionsTB}</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'text-blue-950' : 'text-blue-300'}`}>
                    {stats.dnbRenseignes ? stats.dnb.tauxMoyenInscrits + '%' : 'N.R.'}
                  </td>
                  <td className={`p-2 text-center font-black ${isPaper ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-white'}`}>
                    {stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 2. Tableau CFG */}
        <div className="space-y-2 pt-2">
          <h2
            className={`text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl ${
              isPaper ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
            }`}
          >
            2. CERTIFICAT DE FORMATION GÉNÉRALE (CFG) — DÉTAIL PAR ÉTABLISSEMENT
          </h2>

          <div className="overflow-x-auto">
            <table
              className={`w-full text-xs border text-left ${
                isPaper ? 'border-slate-300' : 'border-slate-700'
              }`}
            >
              <thead
                className={`font-bold border-b ${
                  isPaper
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-slate-800 text-slate-100 border-slate-700'
                }`}
              >
                <tr>
                  <th className="p-2 border-r border-inherit">Établissement</th>
                  <th className={`p-2 text-center border-r border-inherit ${isPaper ? 'bg-amber-100/70 text-amber-950' : 'bg-amber-950/50 text-amber-300'}`}>
                    Effectif
                  </th>
                  <th className="p-2 text-center border-r border-inherit">Inscrits</th>
                  <th className="p-2 text-center border-r border-inherit">Admis</th>
                  <th className="p-2 text-center border-r border-inherit">Refusés</th>
                  <th className="p-2 text-center border-r border-inherit">% / Inscrits</th>
                  <th className="p-2 text-center font-black">% / Présents</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isPaper ? 'divide-slate-200' : 'divide-slate-800'}`}>
                {establishments.map((est) => {
                  const comp = computeCfg(est.cfg, est.effectifClasse);
                  const color = est.color || '#2563eb';
                  return (
                    <tr
                      key={est.id}
                      className={
                        isPaper ? 'hover:bg-slate-50 text-slate-900' : 'hover:bg-slate-800/50 text-slate-100'
                      }
                    >
                      <td className="p-2 font-bold border-r border-inherit flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-black/20"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span className={isPaper ? 'text-slate-950' : 'text-white'}>{est.name}</span>
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-black ${
                        isPaper ? 'text-amber-950 bg-amber-50/70' : 'text-amber-300 bg-amber-950/20'
                      }`}>
                        {est.effectifClasse}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {est.cfg.inscrits}
                      </td>
                      <td className={`p-2 text-center font-black border-r border-inherit ${
                        isPaper ? 'text-emerald-800' : 'text-emerald-400'
                      }`}>
                        {est.cfg.admis}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-semibold ${
                        est.cfg.refuses > 0 
                          ? (isPaper ? 'text-rose-800 font-bold' : 'text-rose-400 font-bold') 
                          : (isPaper ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        {est.cfg.refuses}
                      </td>
                      <td className={`p-2 text-center border-r border-inherit font-bold ${isPaper ? 'text-teal-900' : 'text-teal-300'}`}>
                        {est.cfgComplete === false ? 'N.R.' : comp.tauxInscrits + '%'}
                      </td>
                      <td className={`p-2 text-center font-black ${
                        isPaper ? 'text-slate-950 bg-slate-100' : 'text-white bg-slate-800'
                      }`}>
                        {est.cfgComplete === false ? 'N.R.' : comp.tauxPresents + '%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot
                className={`font-black border-t-2 ${
                  isPaper
                    ? 'bg-slate-200 text-slate-950 border-slate-400'
                    : 'bg-slate-800 text-white border-slate-600'
                }`}
              >
                <tr>
                  <td className="p-2 border-r border-inherit uppercase">TOTAL / MOYENNE BASSIN</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'bg-amber-200 text-amber-950' : 'bg-amber-900/60 text-amber-200'}`}>
                    {stats.totalEffectifClasse}
                  </td>
                  <td className="p-2 text-center border-r border-inherit">{stats.cfg.inscrits}</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'text-emerald-900' : 'text-emerald-300'}`}>
                    {stats.cfg.admis}
                  </td>
                  <td className="p-2 text-center border-r border-inherit">{stats.cfg.refuses}</td>
                  <td className={`p-2 text-center border-r border-inherit ${isPaper ? 'text-teal-950' : 'text-teal-300'}`}>
                    {stats.cfgRenseignes ? stats.cfg.tauxMoyenInscrits + '%' : 'N.R.'}
                  </td>
                  <td className={`p-2 text-center font-black ${isPaper ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-white'}`}>
                    {stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
