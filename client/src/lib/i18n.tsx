import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'en' | 'sq';

type Translations = Record<string, { en: string; sq: string }>;

const T: Translations = {
  // Header
  'nav.companies': { en: 'Companies', sq: 'Kompanitë' },
  'nav.order': { en: 'Order Report', sq: 'Porosit Raport' },
  'nav.sample': { en: 'Sample', sq: 'Mostra' },
  'nav.dashboard': { en: 'Dashboard', sq: 'Paneli' },
  'nav.admin': { en: 'Admin', sq: 'Administrimi' },
  'nav.login': { en: 'Login', sq: 'Hyr' },
  'nav.logout': { en: 'Logout', sq: 'Dil' },
  'nav.register': { en: 'Register', sq: 'Regjistrohu' },

  // Home
  'home.hero.title': { en: "Know who you're doing business with in Kosovo.", sq: 'Dijeni me kë po bëni biznes në Kosovë.' },
  'home.hero.subtitle': { en: 'Professional due diligence reports on any Kosovo company in 48 hours, built from public records, procurement data, and media analysis.', sq: 'Raporte profesionale të vlerësimit të kujdesshëm për çdo kompani kosovare brenda 48 orëve, të ndërtuara nga regjistra publikë, të dhëna të prokurimit dhe analizë mediatike.' },
  'home.browse': { en: 'Browse 45+ Companies', sq: 'Shfleto 45+ Kompani' },
  'home.order': { en: 'Order a Report', sq: 'Porosit një Raport' },
  'home.value.title': { en: 'Why pay for this?', sq: 'Pse të paguani për këtë?' },
  'home.value.hours': { en: 'Save analyst hours', sq: 'Kurseni orë pune' },
  'home.value.hours.desc': { en: 'Researching a single Kosovo company across ARBK, e-Prokurimi, news archives, and court records takes 6–10 hours of skilled analyst time. We have done it.', sq: 'Hulumtimi i një kompanie kosovare në ARBK, e-Prokurimi, arkivat e lajmeve dhe gjykatat zgjat 6–10 orë pune analiste. Ne e kemi bërë.' },
  'home.value.verified': { en: 'Verified at source', sq: 'I verifikuar në burim' },
  'home.value.verified.desc': { en: 'Every report links back to the official ARBK URL so the recipient can verify each fact at the government source.', sq: 'Çdo raport lidhet me URL-në zyrtare të ARBK-së në mënyrë që marrësi të verifikojë çdo fakt në burimin qeveritar.' },
  'home.value.ai': { en: 'AI risk analysis', sq: 'Analiza e rrezikut me AI' },
  'home.value.ai.desc': { en: 'Composite risk score (0–100) with executive narrative explaining flags, gaps, and recommendations.', sq: 'Rezultat i kombinuar i rrezikut (0–100) me përmbledhje ekzekutive që shpjegon shqetësimet, mangësitë dhe rekomandimet.' },

  // Companies
  'companies.title': { en: 'Kosovo Companies Database', sq: 'Baza e të Dhënave të Kompanive të Kosovës' },
  'companies.subtitle': { en: 'Browse indexed Kosovo companies. Click any company to view its full intelligence profile.', sq: 'Shfletoni kompanitë e indeksuara të Kosovës. Klikoni në çdo kompani për të parë profilin e plotë të inteligjencës.' },
  'companies.search': { en: 'Search by name...', sq: 'Kërko sipas emrit...' },
  'companies.all_statuses': { en: 'All statuses', sq: 'Të gjithë statuset' },
  'companies.status.active': { en: 'Active', sq: 'Aktiv' },
  'companies.status.suspended': { en: 'Suspended', sq: 'I pezulluar' },
  'companies.status.deregistered': { en: 'Deregistered', sq: 'I çregjistruar' },

  // Company detail
  'company.registration': { en: 'Registration', sq: 'Regjistrimi' },
  'company.location': { en: 'Location', sq: 'Lokacioni' },
  'company.capital': { en: 'Capital', sq: 'Kapitali' },
  'company.owners': { en: 'Owners & Authorized Persons', sq: 'Pronarët & Personat e Autorizuar' },
  'company.procurement': { en: 'Government Procurement', sq: 'Prokurimi Publik' },
  'company.procurement.total': { en: 'Total value', sq: 'Vlera totale' },
  'company.procurement.none': { en: 'No procurement records.', sq: 'Pa të dhëna prokurimi.' },
  'company.news': { en: 'Media & News', sq: 'Mediat & Lajmet' },
  'company.news.none': { en: 'No mentions.', sq: 'Pa përmendje.' },
  'company.want_report': { en: 'Want a full intelligence report on this company?', sq: 'Doni një raport të plotë inteligjence për këtë kompani?' },
  'company.want_report.desc': { en: 'Get a professional PDF with AI-generated risk analysis, executive summary, full procurement & ownership breakdown.', sq: 'Merr një PDF profesional me analizë të rrezikut të gjeneruar nga AI, përmbledhje ekzekutive, prokurim i plotë dhe ndarje e pronësisë.' },
  'company.order_report': { en: 'Order Report', sq: 'Porosit Raportin' },
  'company.back': { en: 'All companies', sq: 'Të gjitha kompanitë' },
  'company.verify': { en: 'Verify this data at the official source:', sq: 'Verifikoni këto të dhëna në burimin zyrtar:' },

  // Dashboard
  'dashboard.title': { en: 'My Orders', sq: 'Porositë e Mia' },
  'dashboard.empty': { en: 'No orders yet.', sq: 'Ende pa porosi.' },
  'dashboard.download': { en: 'Download', sq: 'Shkarko' },
  'dashboard.download.lang': { en: 'Choose language:', sq: 'Zgjidh gjuhën:' },

  // Order
  'order.title': { en: 'Order a Due Diligence Report', sq: 'Porosit një Raport Vlerësimi' },
  'order.step': { en: 'Step', sq: 'Hapi' },
  'order.of': { en: 'of', sq: 'nga' },
  'order.next': { en: 'Next', sq: 'Vazhdo' },
  'order.back': { en: 'Back', sq: 'Mbrapa' },
  'order.submit': { en: 'Submit Order', sq: 'Dërgo Porosinë' },
  'order.received': { en: 'Order completed', sq: 'Porosia u plotësua' },
  'order.demo_note': { en: 'Demo Mode: Your report has been auto-generated and is ready to download.', sq: 'Modaliteti Demo: Raporti juaj është gjeneruar automatikisht dhe është gati për shkarkim.' },
  'order.go_dashboard': { en: 'Go to Dashboard to Download', sq: 'Shko në Panel për të Shkarkuar' },
  'order.company_label': { en: 'Company name (search Kosovo registry)', sq: 'Emri i kompanisë (kërko regjistrin e Kosovës)' },
  'order.company_placeholder': { en: 'Start typing...', sq: 'Filloni të shkruani...' },
  'order.report_type': { en: 'Report type', sq: 'Lloji i raportit' },
  'order.urgency': { en: 'Urgency', sq: 'Urgjenca' },
  'order.full_name': { en: 'Full name', sq: 'Emri i plotë' },
  'order.email': { en: 'Email', sq: 'Email' },
  'order.your_company': { en: 'Your company', sq: 'Kompania juaj' },
  'order.phone': { en: 'Phone', sq: 'Telefoni' },
  'order.notes': { en: 'Notes', sq: 'Shënime' },
  'order.review': { en: 'Review', sq: 'Rishikim' },
  'order.subject': { en: 'Subject', sq: 'Subjekti' },
  'order.report': { en: 'Report', sq: 'Raporti' },
  'order.requester': { en: 'Requester', sq: 'Kërkuesi' },
  'order.demo_paren': { en: '(In production, the order would be marked pending until payment is confirmed and an analyst completes the review.)', sq: '(Në prodhim, porosia do të shënohej si në pritje deri sa pagesa të konfirmohet dhe analisti të kompletojë rishikimin.)' },

  // Sample
  'sample.title': { en: 'Sample Reports', sq: 'Raportet Mostër' },
  'sample.subtitle': { en: "See exactly what each report tier contains. All three samples are generated from real data on Kastrati Group Sh.P.K., one of Kosovo's largest business groups.", sq: 'Shihni saktësisht se çfarë përmban çdo nivel raporti. Të tre mostrat janë gjeneruar nga të dhëna reale për Kastrati Group Sh.P.K., një nga grupet më të mëdha afariste të Kosovës.' },
  'sample.watermark_note': { en: 'PDFs are watermarked SAMPLE and labelled with their tier. Language:', sq: 'PDF-të janë me filigran MOSTËR dhe etiketohen me nivelin e tyre. Gjuha:' },
  'sample.live_note': { en: 'Note: Live reports do not have the SAMPLE watermark and include your company name as the named recipient. The data shown in all three samples is from public sources.', sq: 'Shënim: Raportet reale nuk kanë filigran MOSTËR dhe përfshijnë emrin e kompanisë tuaj si marrës. Të dhënat e treguara në të tri mostrat janë nga burime publike.' },
  'sample.download': { en: 'Download', sq: 'Shkarko' },
  'sample.generating': { en: 'Generating...', sq: 'Duke gjeneruar...' },
  'sample.pages': { en: 'pages', sq: 'faqe' },

  // Tier contents (used in sample page)
  'tier.basic.f1': { en: 'Cover & risk badge', sq: 'Kopertina & shenja e rrezikut' },
  'tier.basic.f2': { en: 'Snapshot with key stats', sq: 'Pamje e shpejtë me statistika kryesore' },
  'tier.basic.f3': { en: 'Full company profile (ARBK)', sq: 'Profil i plotë i kompanisë (ARBK)' },
  'tier.basic.f4': { en: 'Ownership table', sq: 'Tabela e pronësisë' },
  'tier.basic.f5': { en: 'Sources & methodology', sq: 'Burimet & metodologjia' },
  'tier.std.f1': { en: 'Everything in Basic', sq: 'Gjithçka në Basic' },
  'tier.std.f2': { en: 'Procurement charts (by year, by authority)', sq: 'Grafikët e prokurimit (sipas vitit, autoritetit)' },
  'tier.std.f3': { en: 'Full procurement table', sq: 'Tabela e plotë e prokurimit' },
  'tier.std.f4': { en: 'News with sentiment distribution', sq: 'Lajme me shpërndarje sentimenti' },
  'tier.std.f5': { en: 'Analyst written assessment', sq: 'Vlerësim i shkruar nga analisti' },
  'tier.comp.f1': { en: 'Everything in Standard', sq: 'Gjithçka në Standard' },
  'tier.comp.f2': { en: 'Risk score breakdown (6 components)', sq: 'Ndarja e pikëve të rrezikut (6 komponentë)' },
  'tier.comp.f3': { en: 'Full AI risk narrative (4 paragraphs)', sq: 'Përmbledhje e plotë e rrezikut nga AI (4 paragrafë)' },
  'tier.comp.f4': { en: 'Risk flags with severity & details', sq: 'Shqetësime me ashpërsi dhe detaje' },
  'tier.comp.f5': { en: 'Data gaps + recommendations box', sq: 'Boshllëqe të dhënash + kuti rekomandimesh' },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('ki_lang') as Lang) || 'en');

  useEffect(() => { localStorage.setItem('ki_lang', lang); }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (key: string) => T[key]?.[lang] || key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useT = () => useContext(LangContext);
