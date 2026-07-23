import type { Metadata } from "next";
import QRCode from "qrcode";
import { getResidenceName } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Affiche à imprimer — Voisins Collectif et en Colère",
  description:
    "Affiche A4 à imprimer et à poser dans le hall de votre immeuble pour inviter les locataires à rejoindre la plateforme.",
};

export default async function AffichePage() {
  const url = process.env.APP_URL || "https://voisins-aragon.onrender.com";
  // Page publique : elle doit rester imprimable même si la base est injoignable.
  const residence = await getResidenceName().catch(() => "");
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    width: 240,
    color: { dark: "#171717", light: "#ffffff" },
  });
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="affiche-root">
      <style>{CSS}</style>

      <div className="toolbar">
        <div className="toolbar-txt">
          <strong>Affiche à imprimer (A4)</strong>
          <span>
            Imprimez-la et posez-la dans le hall, l&apos;ascenseur ou le local à
            poubelles de votre bâtiment. Le QR code pointe déjà vers votre site.
          </span>
        </div>
        <div className="toolbar-actions">
          <PrintButton>🖨️ Imprimer l&apos;affiche</PrintButton>
          <a className="dl" href="/affiche-voisins-collectif.pdf" download>
            ⬇️ Télécharger le PDF
          </a>
        </div>
      </div>

      <div className="page">
        <header>
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <g fill="#e11d48">
                <rect x="120" y="176" width="120" height="216" rx="10" />
                <rect x="272" y="136" width="120" height="256" rx="10" />
              </g>
              <g fill="#ffffff">
                {[206, 256, 306].map((y) => (
                  <g key={`a${y}`}>
                    <rect x="146" y={y} width="28" height="28" rx="4" />
                    <rect x="186" y={y} width="28" height="28" rx="4" />
                  </g>
                ))}
                {[166, 216, 266, 316].map((y) => (
                  <g key={`b${y}`}>
                    <rect x="298" y={y} width="28" height="28" rx="4" />
                    <rect x="338" y={y} width="28" height="28" rx="4" />
                  </g>
                ))}
              </g>
              <g fill="#fbbf24">
                <path d="M196 96 L300 128 L300 72 Z" />
                <circle cx="196" cy="112" r="14" />
              </g>
            </svg>
          </div>
          <div className="head-txt">
            <div className="eyebrow">La plateforme des locataires</div>
            <h1>
              Voisins Collectif
              <br />
              et en Colère
            </h1>
            <div className="tagline">
              S&apos;informer. Se soutenir. <b>Agir ensemble.</b>
            </div>
          </div>
        </header>

        <main>
          <p className="intro">
            <b>Locataire ? Vous avez des soucis avec votre bailleur&nbsp;?</b>{" "}
            Cette application est faite pour vous — et pour{" "}
            <b>tous les locataires</b>, quel que soit le bailleur (social ou
            privé), dans <b>n&apos;importe quelle région et n&apos;importe quel
            pays</b>. Retrouvez vos voisins, signalez les problèmes du
            quotidien, échangez, mobilisez-vous, et faites entendre une{" "}
            <b>voix collective</b>.
            {residence ? (
              <>
                {" "}
                Ici, l&apos;espace de <b>{residence}</b>.
              </>
            ) : null}
          </p>

          <div className="section-title">
            <span className="num">1</span>
            <h2>Ce que vous pouvez faire</h2>
            <span className="rule" />
          </div>

          <div className="grid">
            {FEATURES.map((f) => (
              <div className="card" key={f.title}>
                <div className="ic">
                  <svg viewBox="0 0 24 24">{f.icon}</svg>
                </div>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="section-title">
            <span className="num">2</span>
            <h2>Comment rejoindre la plateforme</h2>
            <span className="rule" />
          </div>

          <div className="steps">
            <div className="step">
              <div className="n">01</div>
              <h4>Scannez le QR code</h4>
              <p>
                Ou tapez l&apos;adresse ci-dessous dans votre navigateur
                (Chrome, Safari…).
              </p>
            </div>
            <div className="step">
              <div className="n">02</div>
              <h4>Inscrivez-vous</h4>
              <p>
                Prénom, nom, e-mail, bâtiment et logement. Ça prend une minute.
              </p>
            </div>
            <div className="step">
              <div className="n">03</div>
              <h4>Validation</h4>
              <p>
                Un référent vérifie et valide votre compte, puis accès complet.
              </p>
            </div>
          </div>

          <div className="cta">
            <div
              className="qr"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div className="cta-txt">
              <div className="kicker">
                C&apos;est en ligne — inscrivez-vous dès maintenant
              </div>
              <h3>Scannez pour créer votre compte</h3>
              <span className="url">{displayUrl}</span>
              <small>
                Scannez le QR code avec l&apos;appareil photo de votre
                téléphone, ou tapez l&apos;adresse dans votre navigateur.
                L&apos;inscription est gratuite. Chaque compte est vérifié par
                un référent avant l&apos;accès.
              </small>
            </div>
          </div>
        </main>

        <footer>
          <div className="fine">
            Ouverte à tous les locataires — toutes régions, tous pays, tout type
            de bailleur.
            <br />
            Accès validé par un référent — vous choisissez ce que vous partagez.
          </div>
          <div className="slogan">
            Ensemble,
            <br />
            on pèse plus lourd.
          </div>
        </footer>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Annuaire des voisins",
    text: "Retrouvez et contactez vos voisins — chacun choisit ce qu'il partage.",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
  {
    title: "Signalements",
    text: "Pannes, dégradations, litiges : photos, suivi et export d'un dossier PDF.",
    icon: (
      <>
        <path d="M12 3 2 20h20L12 3Z" />
        <path d="M12 10v4" />
        <path d="M12 17h.01" />
      </>
    ),
  },
  {
    title: "Forum",
    text: "Un espace général et un espace par bâtiment pour échanger.",
    icon: <path d="M4 5h16v11H8l-4 4V5Z" />,
  },
  {
    title: "Annonces & réunions",
    text: "Informations officielles, comptes-rendus et confirmation de présence.",
    icon: (
      <>
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
        <path d="M9 9l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Pétitions & sondages",
    text: "Signez, votez, et faites le poids du nombre — résultats en direct.",
    icon: (
      <>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </>
    ),
  },
  {
    title: "Suivi des démarches",
    text: "La frise chronologique des courriers et réponses face au bailleur.",
    icon: (
      <>
        <path d="M3 12h16" />
        <path d="M14 7l5 5-5 5" />
      </>
    ),
  },
  {
    title: "Documents partagés",
    text: "Modèles de lettres, pétitions, preuves et comptes-rendus.",
    icon: <path d="M3 7l2-2h5l2 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  },
  {
    title: "Messagerie & entraide",
    text: "Messages privés, prêts de matériel et coups de main entre voisins.",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
];

const CSS = `
@page { size: A4 portrait; margin: 0; }
.affiche-root{
  --crimson:#e11d48; --crimson-dark:#9f1239; --amber:#fbbf24;
  --ink:#171717; --muted:#6b6b6b; --cream:#fdf2f4; --rose-100:#ffe4ea; --card:#ffffff;
  background:#f5f5f5; min-height:100vh; padding:16px 0 40px;
  font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.affiche-root *{ margin:0; padding:0; box-sizing:border-box; }

.affiche-root .toolbar{
  max-width:210mm; margin:0 auto 16px; padding:14px 18px; background:#fff;
  border:1px solid #e5e7eb; border-radius:12px;
  display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between;
}
.affiche-root .toolbar-txt{ display:flex; flex-direction:column; gap:4px; max-width:60ch; }
.affiche-root .toolbar-txt strong{ font-size:15px; }
.affiche-root .toolbar-txt span{ font-size:13px; color:#6b7280; }
.affiche-root .toolbar-actions{ display:flex; gap:8px; flex-wrap:wrap; }
.affiche-root .dl{
  display:inline-flex; align-items:center; gap:8px; border-radius:8px;
  border:1px solid #d1d5db; background:#fff; color:#374151;
  padding:8px 16px; font-size:14px; font-weight:600; text-decoration:none;
}

.affiche-root .page{
  width:210mm; min-height:297mm; background:var(--cream);
  display:flex; flex-direction:column; position:relative; margin:0 auto;
  box-shadow:0 6px 30px rgba(0,0,0,.12);
}
.affiche-root header{
  background:linear-gradient(120deg,var(--crimson) 0%,var(--crimson-dark) 100%);
  color:#fff; padding:6.5mm 12mm 6mm; display:flex; gap:7mm; align-items:center;
  position:relative; overflow:hidden;
}
.affiche-root header::after{
  content:""; position:absolute; right:-40mm; top:-40mm; width:120mm; height:120mm;
  border-radius:50%; background:rgba(255,255,255,.06);
}
.affiche-root .logo{
  flex:0 0 auto; width:26mm; height:26mm; border-radius:13px; background:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 6px 18px rgba(0,0,0,.18); position:relative; z-index:1;
}
.affiche-root .logo svg{ width:18mm; height:18mm; }
.affiche-root .head-txt{ position:relative; z-index:1; }
.affiche-root .eyebrow{ font-size:10pt; letter-spacing:.22em; font-weight:700; text-transform:uppercase; opacity:.92; }
.affiche-root h1{ font-size:31pt; line-height:1.03; font-weight:800; margin:3px 0 5px; }
.affiche-root .tagline{ font-size:14pt; font-weight:400; opacity:.95; }
.affiche-root .tagline b{ font-weight:800; }

.affiche-root main{ padding:4mm 12mm 0; flex:1; display:flex; flex-direction:column; }
.affiche-root .intro{ font-size:11.5pt; line-height:1.4; color:#3a3a3a; margin-bottom:3mm; }
.affiche-root .intro b{ color:var(--crimson); }

.affiche-root .section-title{ display:flex; align-items:center; gap:9px; margin:0 0 2.5mm; }
.affiche-root .num{
  flex:0 0 auto; width:24px; height:24px; border-radius:50%; background:var(--crimson);
  color:#fff; font-size:11pt; font-weight:800; display:flex; align-items:center; justify-content:center;
}
.affiche-root .section-title h2{ font-size:14pt; font-weight:800; letter-spacing:.02em; text-transform:uppercase; }
.affiche-root .section-title .rule{ flex:1; height:2px; background:var(--rose-100); border-radius:2px; }

.affiche-root .grid{ display:grid; grid-template-columns:1fr 1fr; gap:2.5mm; margin-bottom:3.5mm; }
.affiche-root .card{
  background:var(--card); border:1px solid var(--rose-100); border-radius:12px;
  padding:2.6mm 3.5mm; display:flex; gap:3.2mm; align-items:flex-start;
  box-shadow:0 1px 2px rgba(0,0,0,.03);
}
.affiche-root .ic{
  flex:0 0 auto; width:10mm; height:10mm; border-radius:50%; background:var(--rose-100);
  display:flex; align-items:center; justify-content:center;
}
.affiche-root .ic svg{ width:6mm; height:6mm; stroke:var(--crimson); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.affiche-root .card h3{ font-size:11pt; font-weight:700; margin-bottom:1mm; }
.affiche-root .card p{ font-size:9.5pt; line-height:1.34; color:var(--muted); }

.affiche-root .steps{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:3mm; margin-bottom:3.5mm; }
.affiche-root .step{
  background:var(--card); border:1px solid var(--rose-100); border-radius:12px;
  padding:3mm 3.5mm; box-shadow:0 1px 2px rgba(0,0,0,.03);
}
.affiche-root .step .n{ font-size:18pt; font-weight:800; color:var(--crimson); line-height:1; margin-bottom:1.5mm; }
.affiche-root .step h4{ font-size:11pt; font-weight:700; margin-bottom:1mm; }
.affiche-root .step p{ font-size:9.5pt; line-height:1.34; color:var(--muted); }

.affiche-root .cta{
  background:var(--ink); color:#fff; border-radius:14px;
  padding:4mm 5.5mm; display:flex; gap:5.5mm; align-items:center; margin-bottom:3mm;
}
.affiche-root .cta .qr{
  flex:0 0 auto; width:31mm; height:31mm; background:#fff; border-radius:10px;
  padding:2.5mm; display:flex; align-items:center; justify-content:center;
}
.affiche-root .cta .qr svg{ width:100%; height:100%; display:block; }
.affiche-root .cta-txt{ flex:1; }
.affiche-root .cta .kicker{ font-size:9.5pt; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--amber); margin-bottom:2mm; }
.affiche-root .cta h3{ font-size:15pt; font-weight:800; margin-bottom:2.5mm; }
.affiche-root .url{
  display:inline-block; background:var(--crimson); color:#fff; font-weight:700;
  font-size:12.5pt; padding:2.5mm 4mm; border-radius:8px; word-break:break-all;
}
.affiche-root .cta small{ display:block; font-size:9.5pt; line-height:1.45; opacity:.8; margin-top:3mm; }

.affiche-root footer{
  margin-top:auto; border-top:2px solid var(--rose-100);
  padding:3mm 12mm 4mm; display:flex; justify-content:space-between; align-items:flex-end; gap:8mm;
}
.affiche-root footer .fine{ font-size:9pt; line-height:1.5; color:var(--muted); max-width:120mm; }
.affiche-root footer .slogan{ font-size:15pt; font-weight:800; color:var(--crimson); text-align:right; line-height:1.1; }

@media (max-width:230mm){
  .affiche-root .page{ width:100%; min-height:0; }
  .affiche-root .toolbar{ max-width:100%; margin-left:12px; margin-right:12px; }
}

@media print{
  .affiche-root{ background:#fff; padding:0; }
  .affiche-root .toolbar{ display:none !important; }
  .affiche-root .page{ width:210mm; min-height:297mm; box-shadow:none; zoom:0.97; }
}
`;
