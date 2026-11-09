import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  School,
  Download,
  Copy,
  Presentation,
  Settings2,
  Check
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { SessionData, PresentationSettings, DEFAULT_PRESENTATION_SETTINGS } from '../types';
import { calculateBassinStats, computeDnb, computeCfg, partMentions } from '../utils/calculations';
import { collectDataIssues } from '../utils/dataIntegrity';
import { exportPresentationToPptx } from '../utils/pptxExport';

interface PresentationModeProps {
  session: SessionData;
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ session, onClose }) => {
  const [slidePosition, setSlidePosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PresentationSettings>(() => {
    try {
      const raw = localStorage.getItem('statsegpa_presentation_settings_v1');
      if (!raw) return DEFAULT_PRESENTATION_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<PresentationSettings>;
      return { ...DEFAULT_PRESENTATION_SETTINGS, ...parsed, enabledSlides: { ...DEFAULT_PRESENTATION_SETTINGS.enabledSlides, ...parsed.enabledSlides } };
    } catch { return DEFAULT_PRESENTATION_SETTINGS; }
  });
  const slideKeys: Array<keyof PresentationSettings['enabledSlides']> = ['intro', 'kpis', 'dnb', 'mentions', 'cfg', 'comparison'];
  const enabledIndices = slideKeys.map((key, index) => settings.enabledSlides[key] ? index : -1).filter((index) => index >= 0);
  const currentSlide = enabledIndices[slidePosition] ?? enabledIndices[0] ?? 0;
  const totalSlides = enabledIndices.length;
  const displayBadge = settings.badge.trim() || session.bassinName;
  const updateSettings = (newSettings: PresentationSettings) => {
    setSettings(newSettings);
    try { localStorage.setItem('statsegpa_presentation_settings_v1', JSON.stringify(newSettings)); } catch {}
  };
  const updateSlideEnabled = (key: keyof PresentationSettings['enabledSlides'], enabled: boolean) => {
    const next = { ...settings.enabledSlides, [key]: enabled };
    if (!Object.values(next).some(Boolean)) return;
    updateSettings({ ...settings, enabledSlides: next });
    setSlidePosition(0);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  const slideRef = useRef<HTMLDivElement>(null);

  const establishments = session.establishments;
  const stats = calculateBassinStats(establishments);
  const dataIssues = collectDataIssues(establishments);

  const nextSlide = () => setSlidePosition((prev) => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setSlidePosition((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 1. Exporter la diapositive active en image PNG HD
  const handleExportCurrentSlidePng = async () => {
    if (!slideRef.current || dataIssues.length) return;
    try {
      const dataUrl = await toPng(slideRef.current, { quality: 0.98, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Diapositive_${currentSlide + 1}_${session.year.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la capture de la diapositive.");
    }
  };

  // 2. Copier la diapositive active directement dans le presse-papier
  const handleCopyCurrentSlide = async () => {
    if (!slideRef.current || dataIssues.length) return;
    try {
      const blob = await toBlob(slideRef.current, { quality: 0.98, pixelRatio: 2 });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedStatus(true);
        setTimeout(() => setCopiedStatus(false), 2000);
      } else {
        handleExportCurrentSlidePng();
      }
    } catch (e) {
      console.warn(e);
      handleExportCurrentSlidePng();
    }
  };

  // 3. Exporter toute la présentation au format LibreOffice Impress / PowerPoint (.pptx)
  const handleExportPptx = async () => {
    if (dataIssues.length) return;
    try {
      setIsExportingPptx(true);
      await exportPresentationToPptx(session, settings);
    } catch (e: any) {
      console.error(e);
      alert(`Erreur lors de l'export de la présentation : ${e.message}`);
    } finally {
      setIsExportingPptx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden">
      {/* Barre supérieure de contrôle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
              {displayBadge}
            </span>
            <h2 className="text-sm font-bold text-slate-200">{session.year} — Bilan officiel</h2>
          </div>
        </div>

        {/* BOUTONS D'EXPORT SUR CHAQUE ÉCRAN */}
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-600"
          >
            <Settings2 className="w-4 h-4" /> Paramétrer
          </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Exporter toute la présentation LibreOffice / PowerPoint */}
          <button
            onClick={handleExportPptx}
            disabled={isExportingPptx || dataIssues.length > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            title="Télécharger toute la présentation (.pptx) prête à ouvrir dans LibreOffice Impress ou PowerPoint"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPptx ? 'Génération...' : 'Exporter Présentation LibreOffice (.pptx)'}</span>
          </button>

          {/* Bouton Capturer cette slide en image */}
          <button
            onClick={handleExportCurrentSlidePng}
            disabled={dataIssues.length > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Télécharger cette diapositive en image HD (PNG)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Capturer slide (PNG)</span>
          </button>

          {/* Bouton Copier dans le presse-papier */}
          <button
            onClick={handleCopyCurrentSlide}
            disabled={dataIssues.length > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            title="Copier l'image de cette diapositive pour la coller (Ctrl+V) directement dans LibreOffice ou PowerPoint"
          >
            {copiedStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedStatus ? 'Copié !' : 'Copier l’écran'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Slide {slidePosition + 1} / {totalSlides}
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Plein écran (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Quitter la présentation (Échap)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-20 right-4 sm:right-8 z-50 w-[min(24rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto p-4 space-y-3 bg-slate-900 text-white border border-slate-600 shadow-2xl rounded-2xl text-xs">
          <div className="flex justify-between items-center"><h3 className="font-bold text-sm">Réglages de la présentation</h3><button onClick={() => setShowSettings(false)} aria-label="Fermer les réglages"><X className="w-4 h-4" /></button></div>
          {([['title', 'Titre'], ['badge', 'Bassin / sur-titre (vide = session courante)'], ['subtitle', 'Sous-titre'], ['presenter', 'Présentateur'], ['closingMessage', 'Message final']] as const).map(([key, label]) => (
            <label key={key} className="block space-y-1"><span className="block text-slate-300">{label}</span>
              <input value={settings[key]} onChange={(e) => updateSettings({ ...settings, [key]: e.target.value })}
                placeholder={key === 'badge' ? session.bassinName : undefined}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-2 py-1.5 text-white" />
            </label>
          ))}
          <fieldset className="border-t border-slate-700 pt-3 space-y-2"><legend className="font-bold pt-2">Diapositives visibles</legend>
            {slideKeys.map((key) => (
              <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={settings.enabledSlides[key]} onChange={(e) => updateSlideEnabled(key, e.target.checked)} />
                <span>{({ intro: 'Introduction', kpis: 'Chiffres clés', dnb: 'DNB Pro', mentions: 'Mentions', cfg: 'CFG', comparison: 'Synthèse' } as const)[key]}</span>
              </label>
            ))}
          </fieldset>
          <button type="button" className="text-blue-300 underline" onClick={() => { updateSettings(DEFAULT_PRESENTATION_SETTINGS); setSlidePosition(0); }}>Restaurer les réglages par défaut</button>
        </div>
      )}
      <p className="sr-only">Couverture : DNB {stats.dnbRenseignes}/{stats.totalEtablissements}, CFG {stats.cfgRenseignes}/{stats.totalEtablissements}.</p>
      {dataIssues.length > 0 && (
        <div role="alert" className="bg-red-950 text-red-100 border-2 border-red-500 rounded-lg p-3 text-xs max-h-32 overflow-auto">
          <strong>Présentation non validée : exports désactivés tant que les résultats sont incohérents.</strong>
          <ul className="list-disc ml-5 mt-1">{dataIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
        </div>
      )}
      {/* Contenu de la diapositive active (capturable en haute fidélité) */}
      <div
        ref={slideRef}
        className="flex-1 flex flex-col justify-center items-center max-w-6xl mx-auto w-full py-6 px-4 bg-slate-950"
      >
        {/* SLIDE 0 : Titre & Introduction */}
        {currentSlide === 0 && (
          <div className="text-center space-y-6 animate-fade-in w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {settings.subtitle}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              {settings.title}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-300">
                DNB Professionnel & CFG
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 font-light max-w-3xl mx-auto">
              {displayBadge} • {session.year}
            </p>
            {settings.presenter.trim() && <p className="text-sm text-slate-300">{settings.presenter}</p>}
            <div className="pt-8 flex justify-center gap-6 text-sm text-slate-400 flex-wrap">
              <div className="bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="block text-2xl font-bold text-white">{stats.totalEtablissements}</span>
                <span>Collèges du réseau</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="block text-2xl font-bold text-amber-400">{stats.totalEffectifClasse}</span>
                <span>Élèves en 3e SEGPA</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 px-6 py-3 rounded-2xl">
                <span className="block text-2xl font-bold text-indigo-400">{stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}</span>
                <span>Présentation au DNB Pro</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1 : Chiffres Clés Réseau */}
        {currentSlide === 1 && (
          <div className="w-full space-y-8 animate-fade-in">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Vue d'ensemble</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-1">Les Chiffres Clés du Réseau</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-500/30 p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-300">DNB Professionnel</h3>
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-6xl font-black text-white">{stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}</div>
                <div className="text-sm text-slate-400 mt-2">de réussite sur les candidats présents</div>
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Taux d'inscription :</span>
                    <strong className="text-indigo-400">{stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'} de la classe ({stats.dnb.inscrits}/{stats.dnbEffectifClasse}, collèges renseignés)</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Candidats admis :</span>
                    <strong className="text-white">{stats.dnb.admis} / {stats.dnb.presents}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Mentions obtenues :</span>
                    <strong className="text-amber-400">{stats.dnb.totalMentions} ({stats.dnb.tauxMoyenMentions}%)</strong>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-900/50 to-slate-900 border border-teal-500/30 p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-teal-300">Certificat de Formation Générale</h3>
                  <CheckCircle2 className="w-6 h-6 text-teal-400" />
                </div>
                <div className="text-6xl font-black text-white">{stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}</div>
                <div className="text-sm text-slate-400 mt-2">de réussite sur l'effectif total</div>
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Inscription :</span>
                    <strong className="text-emerald-400">{stats.cfg.inscrits} inscrits / {stats.cfgEffectifClasse} élèves (collèges renseignés)</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Candidats admis :</span>
                    <strong className="text-white">{stats.cfg.admis} / {stats.cfg.presents}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Collèges à 100% :</span>
                    <strong className="text-teal-300">
                      {establishments.filter((e) => e.cfgComplete !== false && computeCfg(e.cfg, e.effectifClasse).tauxPresents === 100).length} sur {establishments.length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2 : DNB Pro par Collège & Présentation */}
        {currentSlide === 2 && (
          <div className="w-full space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Stratégie d'inscription & Réussite</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">DNB Pro : Inscriptions & Taux de Réussite</h2>
              </div>
              <div className="bg-blue-900/60 border border-blue-600 px-4 py-2 rounded-xl text-right">
                <span className="text-xs text-blue-300 block">Moyenne Réussite</span>
                <span className="text-2xl font-bold text-white">{stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {establishments.map((est) => {
                  const comp = computeDnb(est.dnb, est.effectifClasse);
                  return (
                    <div key={est.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: est.color || '#2563eb' }} />
                        <div className="text-xs font-semibold text-slate-200 truncate" title={est.name}>
                          {est.name.replace('Collège ', '')}
                        </div>
                      </div>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${est.dnbComplete === false ? 'text-slate-400' : comp.tauxPresents >= 85 ? 'text-emerald-400' : comp.tauxPresents >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                          {est.dnbComplete === false ? 'N.R.' : comp.tauxPresents + '%'}
                        </span>
                        <span className="text-[10px] text-slate-400">{est.dnbComplete === false ? 'Données en attente' : `(${est.dnb.admis}/${est.dnb.inscrits})`}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-900 pt-1 mt-1">
                        <span>Présentés :</span>
                        <strong className="text-indigo-400">{est.dnbComplete === false ? 'N.R.' : comp.tauxPresentation + '%'} classe</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3 : Focus Mentions */}
        {currentSlide === 3 && (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Valorisation du mérite</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                La Réussite par les Mentions au DNB Pro
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {stats.dnb.totalMentions} mentions au total ({stats.dnb.tauxMoyenMentions}% des admis)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto pt-4">
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-6 rounded-3xl text-center">
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Mention Assez Bien</span>
                <div className="text-5xl font-black text-emerald-300 my-3">{stats.dnb.mentionsAB}</div>
                <p className="text-sm font-semibold text-emerald-200">{partMentions(stats.dnb.mentionsAB, stats.dnb.totalMentions)}% des mentions</p>
                <p className="text-xs text-emerald-200/80">Solide niveau atteint</p>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/40 p-6 rounded-3xl text-center">
                <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">Mention Bien</span>
                <div className="text-5xl font-black text-blue-300 my-3">{stats.dnb.mentionsB}</div>
                <p className="text-sm font-semibold text-blue-200">{partMentions(stats.dnb.mentionsB, stats.dnb.totalMentions)}% des mentions</p>
                <p className="text-xs text-blue-200/80">Excellente maîtrise du socle</p>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/40 p-6 rounded-3xl text-center">
                <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">Mention Très Bien</span>
                <div className="text-5xl font-black text-amber-300 my-3">{stats.dnb.mentionsTB}</div>
                <p className="text-sm font-semibold text-amber-200">{partMentions(stats.dnb.mentionsTB, stats.dnb.totalMentions)}% des mentions</p>
                <p className="text-xs text-amber-200/80">Parcours d'excellence en SEGPA</p>
              </div>
              <div className="bg-purple-950/40 border border-purple-500/40 p-6 rounded-3xl text-center">
                <span className="text-xs font-bold uppercase text-purple-300 tracking-wider">Très Bien avec félicitations du jury</span>
                <div className="text-5xl font-black text-purple-300 my-3">{stats.dnb.mentionsTBF}</div>
                <p className="text-sm font-semibold text-purple-200">{partMentions(stats.dnb.mentionsTBF, stats.dnb.totalMentions)}% des mentions</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl max-w-2xl mx-auto text-center text-xs text-slate-400">
              💡 Les mentions au DNB Pro valorisent l'estime de soi et facilitent l'accès aux filières professionnelles sélectives.
            </div>
          </div>
        )}

        {/* SLIDE 4 : Focus CFG */}
        {currentSlide === 4 && (
          <div className="w-full space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Le Diplôme Fondateur</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Résultats du CFG (100% de la classe inscrite)</h2>
              </div>
              <div className="bg-teal-900/60 border border-teal-600 px-4 py-2 rounded-xl text-right">
                <span className="text-xs text-teal-300 block">Taux Réseau</span>
                <span className="text-2xl font-bold text-white">{stats.cfgRenseignes ? stats.cfg.tauxMoyenPresents + '%' : 'N.R.'}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {establishments.map((est) => {
                  const comp = computeCfg(est.cfg, est.effectifClasse);
                  return (
                    <div key={est.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: est.color || '#0d9488' }} />
                        <div className="text-xs font-semibold text-slate-200 truncate" title={est.name}>
                          {est.name.replace('Collège ', '')}
                        </div>
                      </div>
                      <div className="my-2 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${est.cfgComplete === false ? 'text-slate-400' : comp.tauxPresents === 100 ? 'text-emerald-400' : 'text-teal-300'}`}>
                          {est.cfgComplete === false ? 'N.R.' : comp.tauxPresents + '%'}
                        </span>
                        <span className="text-[10px] text-slate-400">{est.cfgComplete === false ? 'Données en attente' : `${est.cfg.admis}/${est.cfg.inscrits}`}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {est.cfgComplete === false ? 'Résultats non renseignés' : comp.tauxPresents === 100 ? '⭐ 100% de réussite' : `${est.cfg.refuses} non admis`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5 : Synthèse & Conclusions */}
        {currentSlide === 5 && (
          <div className="text-center space-y-6 animate-fade-in max-w-3xl mx-auto w-full">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-2">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Synthèse du Réseau SEGPA</h2>
            <div className="text-left bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                <p>
                  <strong>CFG :</strong> {stats.cfg.admis} admis sur {stats.cfg.presents} présents, parmi {stats.cfgRenseignes} établissement(s) renseigné(s).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                <p>
                  <strong>DNB Professionnel :</strong> Un taux de présentation de <strong>{stats.dnbRenseignes ? stats.tauxMoyenPresentationDnb + '%' : 'N.R.'}</strong> et une réussite de <strong>{stats.dnbRenseignes ? stats.dnb.tauxMoyenPresents + '%' : 'N.R.'}</strong>, avec de belles disparités positives selon les projets d'établissement.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-900/60 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                <p>
                  <strong>Mentions :</strong> <strong>{stats.dnb.totalMentions} mentions</strong> décernées ({stats.dnb.mentionsAB} AB, {stats.dnb.mentionsB} B, {stats.dnb.mentionsTB} TB, {stats.dnb.mentionsTBF} TBF), confirmant la capacité de nos élèves à viser l'excellence.
                </p>
              </div>
            </div>
            {settings.closingMessage.trim() && <p className="text-blue-200 text-sm">{settings.closingMessage}</p>}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleExportPptx}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-xs shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la présentation LibreOffice (.pptx)</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition text-xs"
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barre inférieure : pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        <button
          onClick={prevSlide}
          disabled={slidePosition === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <div className="flex items-center gap-2">
          {enabledIndices.map((slideIndex, index) => (
            <button
              key={slideIndex}
              onClick={() => setSlidePosition(index)}
              className={`h-2 rounded-full transition-all ${
                slidePosition === index ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Diapositive ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={slidePosition === totalSlides - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition text-xs font-semibold shadow-md shadow-blue-600/20"
        >
          Suivant
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
