import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SessionData } from '../types';
import { calculateBassinStats } from '../utils/calculations';

interface Props {
  sessions: Record<string, SessionData>;
  bassinFilter: string;
}

export const HistoryView: React.FC<Props> = ({ sessions, bassinFilter }) => {
  const rows = Object.entries(sessions).sort(([a], [b]) => Number(a) - Number(b)).map(([year, session]) => {
    const establishments = bassinFilter === 'all'
      ? session.establishments : session.establishments.filter(e => e.bassin === bassinFilter);
    const stats = calculateBassinStats(establishments);
    return {
      year, total: establishments.length, effectif: stats.totalEffectifClasse,
      dnbReady: stats.dnbRenseignes, cfgReady: stats.cfgRenseignes,
      presentation: stats.dnbRenseignes > 0 ? stats.tauxMoyenPresentationDnb : null,
      dnb: stats.dnbRenseignes > 0 ? stats.dnb.tauxMoyenPresents : null,
      cfg: stats.cfgRenseignes > 0 ? stats.cfg.tauxMoyenPresents : null,
      demo: session.dataOrigin === 'demo',
    };
  });
  const hasDemo = rows.some(r => r.demo);
  const display = (value: number | null) => value === null ? 'Non renseigné' : value.toFixed(1).replace('.0', '') + ' %';
  return (
    <section className="space-y-5 pb-10" aria-label="Comparaison historique">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-xl font-bold">Évolution des résultats par session</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Taux consolidés pondérés, pour {bassinFilter === 'all' ? 'tous les bassins' : 'le bassin ' + bassinFilter}.
          Une année sans données renseignées n'est pas représentée comme 0 %.
        </p>
        {hasDemo && <p role="note" className="mt-3 text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg">
          Attention : au moins une session utilise encore les données fictives fournies avec l'application.
          Ne pas interpréter ces courbes comme des statistiques officielles.
        </p>}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4" aria-label="Courbes historiques">
        <div className="h-80 w-full" role="img" aria-label="Comparaison du taux de présentation DNB, de réussite DNB et CFG entre les années">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} tickFormatter={value => value + '%'} />
              <Tooltip formatter={(value, name) => [typeof value === 'number' ? display(value) : 'Non renseigné', name]} />
              <Legend />
              <Line type="monotone" dataKey="presentation" name="Présentation DNB" stroke="#a16207" strokeWidth={3} connectNulls={false} />
              <Line type="monotone" dataKey="dnb" name="Réussite DNB" stroke="#2563eb" strokeWidth={3} connectNulls={false} />
              <Line type="monotone" dataKey="cfg" name="Réussite CFG" stroke="#0d9488" strokeWidth={3} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left bg-white dark:bg-slate-900">
          <caption className="text-left p-4 font-semibold">Détail des sessions et couverture des données</caption>
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr><th className="p-3">Année</th><th className="p-3">Collèges</th><th className="p-3">DNB renseignés</th><th className="p-3">CFG renseignés</th><th className="p-3">Présentation DNB</th><th className="p-3">Réussite DNB</th><th className="p-3">Réussite CFG</th></tr>
          </thead>
          <tbody>
            {rows.map(r => <tr key={r.year} className="border-t border-slate-200 dark:border-slate-700">
              <th scope="row" className="p-3">{r.year}{r.demo ? ' (démo)' : ''}</th>
              <td className="p-3">{r.total}</td>
              <td className="p-3">{r.dnbReady} / {r.total}</td>
              <td className="p-3">{r.cfgReady} / {r.total}</td>
              <td className="p-3">{display(r.presentation)}</td>
              <td className="p-3">{display(r.dnb)}</td>
              <td className="p-3">{display(r.cfg)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
};
