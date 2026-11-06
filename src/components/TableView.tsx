import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  Info,
  Edit2
} from 'lucide-react';
import { Establishment, SessionData, COLLEGE_PALETTE } from '../types';
import { computeDnb, computeCfg, calculateBassinStats } from '../utils/calculations';

interface TableViewProps {
  session: SessionData;
  setSession: React.Dispatch<React.SetStateAction<SessionData>>;
  onEditEstablishment?: (est: Establishment) => void;
  currentBassin: string;
}

export const TableView: React.FC<TableViewProps> = ({ session, setSession, onEditEstablishment, currentBassin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'both' | 'dnb' | 'cfg'>('both');
  const [quickSearch, setQuickSearch] = useState('');

  const establishments = session.establishments;
  const bassinStats = calculateBassinStats(establishments);

  const handleUpdate = (id: string, path: string[], value: any) => {
    if ((path[0] === 'dnbComplete' || path[0] === 'cfgComplete') && value === true) {
      const est = session.establishments.find(e => e.id === id);
      if (est) {
        const errors = path[0] === 'dnbComplete' ? computeDnb(est.dnb, est.effectifClasse).errors : computeCfg(est.cfg, est.effectifClasse).errors;
        if (errors.length) { alert('Corriger les chiffres avant validation :\n' + errors.join('\n')); return; }
      }
    }
    setSession((prev) => {
      const updated = prev.establishments.map((est) => {
        if (est.id !== id) return est;
        const copy = JSON.parse(JSON.stringify(est));
        let curr = copy;
        for (let i = 0; i < path.length - 1; i++) {
          curr = curr[path[i]];
        }
        curr[path[path.length - 1]] = value;

        if (path[0] === 'effectifClasse') {
          const newEff = Number(value) || 0;
          if (copy.cfg.inscrits === 0 || copy.cfg.inscrits === est.effectifClasse) {
            copy.cfg.inscrits = newEff;
          }
        }

        return copy;
      });
      return { ...prev, establishments: updated, lastUpdated: new Date().toISOString() };
    });
  };

  const handleAddEstablishment = () => {
    const nextNumber = establishments.length + 1;
    const color = COLLEGE_PALETTE[(nextNumber - 1) % COLLEGE_PALETTE.length];
    const newEst: Establishment = {
      id: `segpa-${Date.now()}`,
      name: `Collège ${String.fromCharCode(64 + (nextNumber % 26 || 1))}`,
      city: '',
      bassin: currentBassin === 'all' ? session.regions?.[0]?.name || 'Douaisis' : currentBassin,
      color,
      effectifClasse: 14,
      dnbComplete: false,
      cfgComplete: false,
      dnb: { inscrits: 0, admis: 0, refuses: 0, mentions: { ab: 0, b: 0, tb: 0 } },
      cfg: { inscrits: 14, admis: 0, refuses: 0 },
    };
    setSession((prev) => ({
      ...prev,
      establishments: [...prev.establishments, newEst],
      lastUpdated: new Date().toISOString(),
    }));
  };

  const handleDeleteEstablishment = (id: string) => {
    if (!confirm('Supprimer cet établissement et ses résultats ?')) return;
    setSession((prev) => ({
      ...prev,
      establishments: prev.establishments.filter((e) => e.id !== id),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const filteredEstablishments = establishments.filter((e) =>
    e.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
    (e.city && e.city.toLowerCase().includes(quickSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12 transition-colors">
      <p className="text-xs text-slate-600 dark:text-slate-300">Couverture : DNB {bassinStats.dnbRenseignes}/{bassinStats.totalEtablissements} établissements, CFG {bassinStats.cfgRenseignes}/{bassinStats.totalEtablissements}. « N.R. » = résultats non renseignés (différent de 0 %).</p>
      {/* Barre d'outils du tableau */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('both')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'both' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vue Complète (DNB & CFG)
            </button>
            <button
              onClick={() => setActiveSubTab('dnb')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'dnb' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              DNB Pro
            </button>
            <button
              onClick={() => setActiveSubTab('cfg')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'cfg' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CFG
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              aria-label="Rechercher un établissement dans la liste"
              placeholder="Rechercher un collège..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg px-3 py-1.5 w-48 focus:outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {establishments.length} établissement{establishments.length > 1 ? 's' : ''} • {bassinStats.totalEffectifClasse} élèves
          </span>
          <button
            onClick={handleAddEstablishment}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Ajouter un établissement
          </button>
        </div>
      </div>

      {/* Guide visuel SEGPA */}
      <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 px-4 py-3 rounded-xl">
        <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <span className="font-semibold text-amber-900 dark:text-amber-200">Gestion des couleurs & effectifs :</span>
          <span className="ml-1 text-amber-800 dark:text-amber-300">
            Chaque collège dispose d'une <strong>pastille de couleur dédiée</strong> répercutée dans tous les graphiques. 
            Cliquez sur le crayon <strong>✏️</strong> pour modifier la couleur ou les paramètres d'un collège.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABLEAU DNB PRO */}
      {/* ========================================================================= */}
      {(activeSubTab === 'both' || activeSubTab === 'dnb') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-wide">DNB PRO — SESSION {session.year.replace(/\D/g, '') || '2026'}</h2>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">Diplôme National du Brevet série Pro</span>
            </div>
            <div className="text-xs text-blue-100 font-medium">
              Présentation bassin : <span className="font-bold text-white text-sm">{bassinStats.dnbRenseignes ? bassinStats.tauxMoyenPresentationDnb + '%' : 'N.R.'}</span> • Réussite : <span className="font-bold text-white text-sm">{bassinStats.dnbRenseignes ? bassinStats.dnb.tauxMoyenPresents + '%' : 'N.R.'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" aria-label="Tableau des résultats du DNB Professionnel">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4 w-52">ÉTABLISSEMENT</th>
                  <th scope="col" className="py-3 px-3 text-center w-24 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-x border-slate-200 dark:border-slate-700">
                    EFFECTIF<br />CLASSE
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-24">
                    CANDIDATS<br />INSCRITS
                    <span className="block text-[9px] font-normal lowercase text-slate-400">(présentation)</span>
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-24">CANDIDATS<br />ADMIS</th>
                  <th scope="col" className="py-3 px-3 text-center w-24">CANDIDATS<br />REFUSÉS</th>
                  <th scope="col" className="py-3 px-4 text-center min-w-[200px]">
                    MENTIONS
                    <span className="block text-[9px] font-normal lowercase text-slate-500 dark:text-slate-400">(AB • B • TB)</span>
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-28 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-x border-slate-200 dark:border-slate-700">
                    POURCENTAGE<br />ÉLÈVES INSCRITS
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-28 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200">
                    POURCENTAGE<br />ÉLÈVES PRÉSENTS
                  </th>
                  <th scope="col" className="py-3 px-2 text-center w-14 no-print">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEstablishments.map((est) => {
                  const computed = computeDnb(est.dnb, est.effectifClasse);
                  const hasError = computed.errors.length > 0;
                  const color = est.color || '#2563eb';

                  return (
                    <tr key={est.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition group">
                      {/* Nom Établissement avec pastille de couleur */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-black/10 dark:border-white/20"
                            style={{ backgroundColor: color }}
                            title={`Couleur identifiée : ${color}`}
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            aria-label={`Nom de l'établissement ${est.name}`}
                            value={est.name}
                            onChange={(e) => handleUpdate(est.id, ['name'], e.target.value)}
                            className="w-full font-semibold text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-2 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-hidden"
                          />
                          <label className="inline-flex items-center gap-1 text-[10px] whitespace-nowrap" title="Cochez quand les résultats DNB sont connus, même si le nombre d'admis est zéro">
                            <input type="checkbox" aria-label={'DNB renseigné pour ' + est.name} checked={est.dnbComplete !== false} onChange={e => handleUpdate(est.id, ['dnbComplete'], e.target.checked)} /> Renseigné
                          </label>
                          {hasError && (
                            <span title={computed.errors.join(' | ')} className="text-amber-500 cursor-help" aria-label="Erreur détectée dans les chiffres">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Effectif Classe */}
                      <td className="py-2.5 px-3 text-center bg-amber-50/30 dark:bg-amber-950/20 border-x border-slate-200 dark:border-slate-700">
                        <input
                          type="number"
                          min="1"
                          aria-label={`Effectif classe 3e pour ${est.name}`}
                          value={est.effectifClasse || 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['effectifClasse'], val);
                          }}
                          className="w-16 text-center font-bold text-amber-900 dark:text-amber-300 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded px-1.5 py-1 focus:border-amber-600 focus:outline-hidden"
                        />
                      </td>

                      {/* Inscrits DNB */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Candidats inscrits DNB pour ${est.name}`}
                          value={est.dnb.inscrits}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['dnb', 'inscrits'], val);
                          }}
                          className="w-16 text-center font-medium bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden"
                        />
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {computed.tauxPresentation}% classe
                        </div>
                      </td>

                      {/* Admis DNB */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Candidats admis DNB pour ${est.name}`}
                          value={est.dnb.admis}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['dnb', 'admis'], val);
                          }}
                          className="w-16 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Refusés DNB */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Candidats refusés DNB pour ${est.name}`}
                          value={est.dnb.refuses}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['dnb', 'refuses'], val);
                          }}
                          className="w-16 text-center font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Mentions (AB, B, TB) */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1" title="Mention Assez Bien">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 rounded">AB</span>
                            <input
                              type="number"
                              min="0"
                              aria-label={`Mentions Assez Bien pour ${est.name}`}
                              value={est.dnb.mentions?.ab || 0}
                              onChange={(e) => handleUpdate(est.id, ['dnb', 'mentions', 'ab'], parseInt(e.target.value) || 0)}
                              className="w-9 text-center text-xs font-semibold bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded py-0.5"
                            />
                          </div>
                          <div className="flex items-center gap-1" title="Mention Bien">
                            <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1 rounded">B</span>
                            <input
                              type="number"
                              min="0"
                              aria-label={`Mentions Bien pour ${est.name}`}
                              value={est.dnb.mentions?.b || 0}
                              onChange={(e) => handleUpdate(est.id, ['dnb', 'mentions', 'b'], parseInt(e.target.value) || 0)}
                              className="w-9 text-center text-xs font-semibold bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded py-0.5"
                            />
                          </div>
                          <div className="flex items-center gap-1" title="Mention Très Bien">
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1 rounded">TB</span>
                            <input
                              type="number"
                              min="0"
                              aria-label={`Mentions Très Bien pour ${est.name}`}
                              value={est.dnb.mentions?.tb || 0}
                              onChange={(e) => handleUpdate(est.id, ['dnb', 'mentions', 'tb'], parseInt(e.target.value) || 0)}
                              className="w-9 text-center text-xs font-semibold bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded py-0.5"
                            />
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Total: <strong className="text-slate-700 dark:text-slate-200">{computed.totalMentions}</strong> / {est.dnb.admis} admis
                        </div>
                      </td>

                      {/* % Inscrits (Auto calculé) */}
                      <td className="py-2.5 px-3 text-center bg-blue-50/40 dark:bg-blue-950/20 border-x border-slate-200 dark:border-slate-700 font-bold text-blue-800 dark:text-blue-300">
                        <span className={`inline-block px-2 py-0.5 rounded ${computed.tauxInscrits >= 80 ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {est.dnbComplete === false ? 'N.R.' : computed.tauxInscrits + ' %'}
                        </span>
                      </td>

                      {/* % Présents (Auto calculé) */}
                      <td className="py-2.5 px-3 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-900 dark:text-indigo-200">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          computed.tauxPresents === 100 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : computed.tauxPresents >= 80 
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                        }`}>
                          {est.dnbComplete === false ? 'N.R.' : computed.tauxPresents + ' %'}
                        </span>
                      </td>

                      {/* Actions : Modifier dans fiche + Supprimer */}
                      <td className="py-2.5 px-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          {onEditEstablishment && (
                            <button
                              onClick={() => onEditEstablishment(est)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition"
                              title={`Modifier la fiche et la couleur de ${est.name}`}
                              aria-label={`Modifier la fiche de ${est.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEstablishment(est.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Supprimer cette ligne"
                            aria-label={`Supprimer ${est.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Ligne Totaux & Moyennes Bassin */}
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                  <td className="py-3 px-4 uppercase text-xs tracking-wider">TOTAL / MOYENNE BASSIN</td>
                  <td className="py-3 px-3 text-center bg-amber-950 text-amber-200 border-x border-slate-700">
                    {bassinStats.dnbEffectifClasse}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-200">
                    {bassinStats.dnb.inscrits}
                    <span className="block text-[9px] text-slate-400 font-normal">({bassinStats.dnbRenseignes ? bassinStats.tauxMoyenPresentationDnb + '%' : 'N.R.'} classe)</span>
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-300 font-extrabold">{bassinStats.dnb.admis}</td>
                  <td className="py-3 px-3 text-center text-slate-300">{bassinStats.dnb.refuses}</td>
                  <td className="py-3 px-3 text-center text-xs">
                    <span className="text-emerald-300">{bassinStats.dnb.mentionsAB} AB</span> •{' '}
                    <span className="text-blue-300">{bassinStats.dnb.mentionsB} B</span> •{' '}
                    <span className="text-amber-300">{bassinStats.dnb.mentionsTB} TB</span>
                    <span className="block text-[10px] text-slate-300">({bassinStats.dnb.totalMentions} mentions au total)</span>
                  </td>
                  <td className="py-3 px-3 text-center bg-blue-900 text-blue-100 text-sm font-extrabold border-x border-slate-700">
                    {bassinStats.dnb.tauxMoyenInscrits} %
                  </td>
                  <td className="py-3 px-3 text-center bg-indigo-900 text-indigo-100 text-sm font-extrabold">
                    {bassinStats.dnbRenseignes ? bassinStats.dnb.tauxMoyenPresents + ' %' : 'N.R.'}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TABLEAU CFG */}
      {/* ========================================================================= */}
      {(activeSubTab === 'both' || activeSubTab === 'cfg') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-wide">CFG — SESSION {session.year.replace(/\D/g, '') || '2026'}</h2>
              <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">Certificat de Formation Générale (Tous les élèves inscrits)</span>
            </div>
            <div className="text-xs text-emerald-100 font-medium">
              Moyenne bassin : <span className="font-bold text-white text-sm">{bassinStats.cfgRenseignes ? bassinStats.cfg.tauxMoyenPresents + '%' : 'N.R.'}</span> de réussite
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" aria-label="Tableau des résultats du CFG">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-4 w-52">ÉTABLISSEMENT</th>
                  <th scope="col" className="py-3 px-3 text-center w-24 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-x border-slate-200 dark:border-slate-700">
                    EFFECTIF<br />CLASSE
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-28">
                    CANDIDATS<br />INSCRITS
                    <span className="block text-[9px] font-normal lowercase text-slate-400">(= effectif)</span>
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-28">CANDIDATS<br />ADMIS</th>
                  <th scope="col" className="py-3 px-3 text-center w-28">CANDIDATS<br />REFUSÉS</th>
                  <th scope="col" className="py-3 px-3 text-center w-36 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-x border-slate-200 dark:border-slate-700">
                    POURCENTAGE<br />ÉLÈVES INSCRITS
                  </th>
                  <th scope="col" className="py-3 px-3 text-center w-36 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200">
                    POURCENTAGE<br />ÉLÈVES PRÉSENTS
                  </th>
                  <th scope="col" className="py-3 px-2 text-center w-14 no-print">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEstablishments.map((est) => {
                  const computed = computeCfg(est.cfg, est.effectifClasse);
                  const hasError = computed.errors.length > 0;
                  const color = est.color || '#0d9488';

                  return (
                    <tr key={est.id} className="hover:bg-emerald-50/30 dark:hover:bg-slate-800/50 transition group">
                      {/* Nom Établissement avec pastille couleur */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-black/10 dark:border-white/20"
                            style={{ backgroundColor: color }}
                            title={`Couleur : ${color}`}
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            aria-label={`Nom de l'établissement CFG ${est.name}`}
                            value={est.name}
                            onChange={(e) => handleUpdate(est.id, ['name'], e.target.value)}
                            className="w-full font-semibold text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-2 py-1 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-hidden"
                          />
                          <label className="inline-flex items-center gap-1 text-[10px] whitespace-nowrap" title="Cochez quand les résultats CFG sont connus">
                            <input type="checkbox" aria-label={'CFG renseigné pour ' + est.name} checked={est.cfgComplete !== false} onChange={e => handleUpdate(est.id, ['cfgComplete'], e.target.checked)} /> Renseigné
                          </label>
                          {hasError && (
                            <span title={computed.errors.join(' | ')} className="text-amber-500 cursor-help" aria-label="Erreur détectée">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Effectif Classe */}
                      <td className="py-2.5 px-3 text-center bg-amber-50/30 dark:bg-amber-950/20 border-x border-slate-200 dark:border-slate-700 font-bold text-amber-900 dark:text-amber-300">
                        {est.effectifClasse}
                      </td>

                      {/* Inscrits CFG */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Inscrits CFG pour ${est.name}`}
                          value={est.cfg.inscrits}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['cfg', 'inscrits'], val);
                          }}
                          className="w-20 text-center font-medium bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Admis CFG */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Admis CFG pour ${est.name}`}
                          value={est.cfg.admis}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['cfg', 'admis'], val);
                          }}
                          className="w-20 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>

                      {/* Refusés CFG */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Refusés CFG pour ${est.name}`}
                          value={est.cfg.refuses}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            handleUpdate(est.id, ['cfg', 'refuses'], val);
                          }}
                          className="w-20 text-center font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </td>

                      {/* % Inscrits (Auto calculé) */}
                      <td className="py-2.5 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border-x border-slate-200 dark:border-slate-700 font-bold text-emerald-800 dark:text-emerald-300">
                        <span className={`inline-block px-2 py-0.5 rounded ${computed.tauxInscrits >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                          {est.cfgComplete === false ? 'N.R.' : computed.tauxInscrits + ' %'}
                        </span>
                      </td>

                      {/* % Présents (Auto calculé) */}
                      <td className="py-2.5 px-3 text-center bg-teal-50/40 dark:bg-teal-950/20 font-bold text-teal-900 dark:text-teal-200">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          computed.tauxPresents === 100 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : computed.tauxPresents >= 90 
                            ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                        }`}>
                          {est.cfgComplete === false ? 'N.R.' : computed.tauxPresents + ' %'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          {onEditEstablishment && (
                            <button
                              onClick={() => onEditEstablishment(est)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition"
                              title={`Modifier la fiche et la couleur de ${est.name}`}
                              aria-label={`Modifier la fiche de ${est.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEstablishment(est.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Supprimer cette ligne"
                            aria-label={`Supprimer ${est.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Ligne Totaux & Moyennes Bassin CFG */}
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                  <td className="py-3 px-4 uppercase text-xs tracking-wider">TOTAL / MOYENNE BASSIN</td>
                  <td className="py-3 px-3 text-center bg-amber-950 text-amber-200 border-x border-slate-700">
                    {bassinStats.cfgEffectifClasse}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-200">{bassinStats.cfg.inscrits}</td>
                  <td className="py-3 px-3 text-center text-emerald-300 font-extrabold">{bassinStats.cfg.admis}</td>
                  <td className="py-3 px-3 text-center text-slate-300">{bassinStats.cfg.refuses}</td>
                  <td className="py-3 px-3 text-center bg-emerald-900 text-emerald-100 text-sm font-extrabold border-x border-slate-700">
                    {bassinStats.cfg.tauxMoyenInscrits} %
                  </td>
                  <td className="py-3 px-3 text-center bg-teal-900 text-teal-100 text-sm font-extrabold">
                    {bassinStats.cfgRenseignes ? bassinStats.cfg.tauxMoyenPresents + ' %' : 'N.R.'}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
