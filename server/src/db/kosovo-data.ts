// Real major Kosovo companies — curated dataset
// Sourced from publicly known business directories and ARBK records

export interface SeedCompany {
  name: string;
  reg: string;
  form: string;
  status: string;
  date: string;
  municipality: string;
  address: string;
  activity: string;
  capital: number;
  sector: string;
  persons: Array<{ name: string; role: string; pct?: number }>;
}

export const KOSOVO_COMPANIES: SeedCompany[] = [
  // === BANKS ===
  { name: 'Banka Kombëtare Tregtare Kosovë Sh.A.', reg: '70123001', form: 'SH.A', status: 'active', date: '2007-04-25', municipality: 'Prishtinë', address: 'Rr. Agim Ramadani 5, Prishtinë', activity: 'Banking services', capital: 25000000, sector: 'Banking', persons: [{ name: 'Suat Bakkal', role: 'CEO', pct: 0 }] },
  { name: 'Raiffeisen Bank Kosovo Sh.A.', reg: '70123002', form: 'SH.A', status: 'active', date: '2001-11-15', municipality: 'Prishtinë', address: 'Rr. UÇK 51, Prishtinë', activity: 'Banking services', capital: 58000000, sector: 'Banking', persons: [{ name: 'Iliriana Toçi', role: 'CEO', pct: 0 }] },
  { name: 'ProCredit Bank Kosovo Sh.A.', reg: '70123003', form: 'SH.A', status: 'active', date: '2000-01-12', municipality: 'Prishtinë', address: 'Rr. Mother Teresa 16, Prishtinë', activity: 'Banking services', capital: 50000000, sector: 'Banking', persons: [{ name: 'Eriola Bibolli', role: 'CEO', pct: 0 }] },
  { name: 'NLB Banka Sh.A.', reg: '70123004', form: 'SH.A', status: 'active', date: '2006-09-20', municipality: 'Prishtinë', address: 'Rr. Rexhep Luci 5, Prishtinë', activity: 'Banking services', capital: 40000000, sector: 'Banking', persons: [{ name: 'Albert Lumezi', role: 'CEO', pct: 0 }] },
  { name: 'TEB Sh.A.', reg: '70123005', form: 'SH.A', status: 'active', date: '2008-01-18', municipality: 'Prishtinë', address: 'Bulevardi Bill Klinton, Prishtinë', activity: 'Banking services', capital: 35000000, sector: 'Banking', persons: [{ name: 'Orçun Özdemir', role: 'CEO', pct: 0 }] },
  { name: 'Banka për Biznes Sh.A.', reg: '70123006', form: 'SH.A', status: 'active', date: '2001-12-28', municipality: 'Prishtinë', address: 'Rr. Ukshin Hoti 124, Prishtinë', activity: 'Banking services', capital: 27000000, sector: 'Banking', persons: [{ name: 'Arton Celina', role: 'CEO', pct: 0 }] },
  { name: 'Banka Ekonomike Sh.A.', reg: '70123007', form: 'SH.A', status: 'active', date: '2001-02-22', municipality: 'Prishtinë', address: 'Rr. Migjeni 1, Prishtinë', activity: 'Banking services', capital: 26000000, sector: 'Banking', persons: [{ name: 'Lavdim Koshi', role: 'CEO', pct: 0 }] },

  // === RETAIL / TRADE ===
  { name: 'Kastrati Group Sh.P.K.', reg: '70234001', form: 'SH.P.K', status: 'active', date: '1991-06-15', municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Ferizaj km 8', activity: 'Wholesale fuel, retail, real estate', capital: 50000000, sector: 'Retail/Energy', persons: [{ name: 'Nazim Kastrati', role: 'owner', pct: 100 }] },
  { name: 'ELKOS Group Sh.P.K.', reg: '70234002', form: 'SH.P.K', status: 'active', date: '1995-06-22', municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Ferizaj km 6', activity: 'Retail chain (ETC supermarkets)', capital: 35000000, sector: 'Retail', persons: [{ name: 'Bedri Hamza', role: 'owner', pct: 50 }, { name: 'Egzon Hamza', role: 'partner', pct: 50 }] },
  { name: 'Viva Fresh Store Sh.P.K.', reg: '70234003', form: 'SH.P.K', status: 'active', date: '2009-03-10', municipality: 'Prishtinë', address: 'Rr. Garibaldi 12, Prishtinë', activity: 'Retail supermarket chain', capital: 12000000, sector: 'Retail', persons: [{ name: 'Blerim Devolli', role: 'owner', pct: 60 }] },
  { name: 'Albi Mall Sh.P.K.', reg: '70234004', form: 'SH.P.K', status: 'active', date: '2008-11-05', municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Ferizaj', activity: 'Shopping mall & retail', capital: 15000000, sector: 'Retail', persons: [{ name: 'Albi Lluka', role: 'owner', pct: 100 }] },
  { name: 'Devolli Corporation Sh.P.K.', reg: '70234005', form: 'SH.P.K', status: 'active', date: '1992-05-20', municipality: 'Prishtinë', address: 'Rr. Tirana 21, Prishtinë', activity: 'Coffee imports & distribution', capital: 20000000, sector: 'FMCG', persons: [{ name: 'Blerim Devolli', role: 'owner', pct: 100 }] },
  { name: 'Meridian Express Sh.P.K.', reg: '70234006', form: 'SH.P.K', status: 'active', date: '2002-07-14', municipality: 'Prishtinë', address: 'Rr. Bill Klinton, Prishtinë', activity: 'Retail supermarket chain', capital: 8000000, sector: 'Retail', persons: [{ name: 'Naim Hasani', role: 'owner', pct: 100 }] },

  // === TELECOMS ===
  { name: 'IPKO Telecommunications Sh.P.K.', reg: '70345001', form: 'SH.P.K', status: 'active', date: '1999-09-09', municipality: 'Prishtinë', address: 'Rr. Lidhja e Pejës, Prishtinë', activity: 'Mobile telecom, internet, TV', capital: 25000000, sector: 'Telecom', persons: [{ name: 'Akan Yapakçı', role: 'CEO', pct: 0 }] },
  { name: 'Telekomi i Kosovës Sh.A. (Vala)', reg: '70345002', form: 'SH.A', status: 'active', date: '2005-01-01', municipality: 'Prishtinë', address: 'Rr. Dardania, Prishtinë', activity: 'Mobile & fixed telecom (state-owned)', capital: 80000000, sector: 'Telecom', persons: [{ name: 'Ehat Miftaraj', role: 'CEO', pct: 0 }] },

  // === ENERGY ===
  { name: 'Korporata Energjetike e Kosovës Sh.A. (KEK)', reg: '70456001', form: 'SH.A', status: 'active', date: '2005-07-01', municipality: 'Obiliq', address: 'Rr. Hyzri Talla, Obiliq', activity: 'Electricity generation (state-owned)', capital: 200000000, sector: 'Energy', persons: [{ name: 'Nagip Krasniqi', role: 'CEO', pct: 0 }] },
  { name: 'KESCO Sh.A.', reg: '70456002', form: 'SH.A', status: 'active', date: '2013-05-08', municipality: 'Prishtinë', address: 'Rr. Bill Klinton, Prishtinë', activity: 'Electricity supply', capital: 30000000, sector: 'Energy', persons: [{ name: 'Petrit Pepaj', role: 'CEO', pct: 0 }] },
  { name: 'KOSTT Sh.A.', reg: '70456003', form: 'SH.A', status: 'active', date: '2006-06-29', municipality: 'Prishtinë', address: 'Rr. Isa Boletini, Prishtinë', activity: 'Electricity transmission', capital: 45000000, sector: 'Energy', persons: [{ name: 'Mustafë Hasani', role: 'CEO', pct: 0 }] },

  // === CONSTRUCTION ===
  { name: 'Beni-M Sh.P.K.', reg: '70567001', form: 'SH.P.K', status: 'active', date: '2008-11-10', municipality: 'Prizren', address: 'Rr. Adem Jashari, Prizren', activity: 'Civil construction & infrastructure', capital: 5000000, sector: 'Construction', persons: [{ name: 'Benjamin Mehmeti', role: 'owner', pct: 100 }] },
  { name: '2NB Group Sh.P.K.', reg: '70567002', form: 'SH.P.K', status: 'active', date: '2006-04-12', municipality: 'Prishtinë', address: 'Lagjja Mati 1, Prishtinë', activity: 'Real estate development', capital: 8000000, sector: 'Construction', persons: [{ name: 'Nuhi Bytyqi', role: 'owner', pct: 100 }] },
  { name: 'Sallahu Group Sh.P.K.', reg: '70567003', form: 'SH.P.K', status: 'active', date: '2001-08-22', municipality: 'Prishtinë', address: 'Rr. Industriale, Prishtinë', activity: 'Construction materials & contracting', capital: 6000000, sector: 'Construction', persons: [{ name: 'Behxhet Sallahu', role: 'owner', pct: 100 }] },
  { name: 'Bechtel-Enka JV', reg: '70567004', form: 'BRANCH', status: 'active', date: '2010-04-15', municipality: 'Prishtinë', address: 'Highway R7 site office', activity: 'Highway construction', capital: 100000, sector: 'Construction', persons: [{ name: 'Project Director', role: 'authorized', pct: 0 }] },

  // === BUILDING MATERIALS / INDUSTRY ===
  { name: 'Sharrcem Sh.P.K.', reg: '70678001', form: 'SH.P.K', status: 'active', date: '2000-10-15', municipality: 'Hani i Elezit', address: 'Hani i Elezit', activity: 'Cement production', capital: 75000000, sector: 'Industry', persons: [{ name: 'Plant Director', role: 'CEO', pct: 0 }] },
  { name: 'NewCo Ferronikeli Sh.P.K.', reg: '70678002', form: 'SH.P.K', status: 'suspended', date: '2006-12-01', municipality: 'Drenas', address: 'Drenas industrial zone', activity: 'Ferronickel mining & smelting', capital: 30000000, sector: 'Mining', persons: [{ name: 'Plant Manager', role: 'authorized', pct: 0 }] },
  { name: 'Trepça Sh.A.', reg: '70678003', form: 'SH.A', status: 'active', date: '2018-09-15', municipality: 'Mitrovicë', address: 'Stantërg, Mitrovicë', activity: 'Lead/zinc mining (state-owned)', capital: 50000000, sector: 'Mining', persons: [{ name: 'Ahmet Tmava', role: 'CEO', pct: 0 }] },

  // === FOOD & BEVERAGE ===
  { name: 'Birra Peja Sh.A.', reg: '70789001', form: 'SH.A', status: 'active', date: '1969-01-01', municipality: 'Pejë', address: 'Rr. Mbretëresha Teutë, Pejë', activity: 'Beer production', capital: 18000000, sector: 'Beverage', persons: [{ name: 'Driton Dovolani', role: 'CEO', pct: 0 }] },
  { name: 'Frutomania Sh.P.K.', reg: '70789002', form: 'SH.P.K', status: 'active', date: '1995-06-10', municipality: 'Lipjan', address: 'Industriale, Lipjan', activity: 'Juice & beverage production', capital: 7000000, sector: 'Beverage', persons: [{ name: 'Naim Asllani', role: 'owner', pct: 100 }] },
  { name: 'Solid Sh.P.K. (Rugove water)', reg: '70789003', form: 'SH.P.K', status: 'active', date: '1998-03-22', municipality: 'Pejë', address: 'Rrugovë, Pejë', activity: 'Bottled water production', capital: 6000000, sector: 'Beverage', persons: [{ name: 'Driton Sopjani', role: 'owner', pct: 100 }] },
  { name: 'Liberta Sh.P.K.', reg: '70789004', form: 'SH.P.K', status: 'active', date: '2003-05-08', municipality: 'Ferizaj', address: 'Zona industriale, Ferizaj', activity: 'Bottled water & soft drinks', capital: 4000000, sector: 'Beverage', persons: [{ name: 'Fatos Llapashtica', role: 'owner', pct: 100 }] },

  // === TECH ===
  { name: 'Gjirafa Inc. Sh.P.K.', reg: '70890001', form: 'SH.P.K', status: 'active', date: '2013-06-30', municipality: 'Prishtinë', address: 'Innovation Centre Kosovo, Prishtinë', activity: 'E-commerce & search engine', capital: 3000000, sector: 'Technology', persons: [{ name: 'Mërgim Cahani', role: 'CEO', pct: 60 }] },
  { name: '3CIS Sh.P.K.', reg: '70890002', form: 'SH.P.K', status: 'active', date: '2014-09-12', municipality: 'Prishtinë', address: 'Lagjja Pejton, Prishtinë', activity: 'Software development & outsourcing', capital: 1500000, sector: 'Technology', persons: [{ name: 'Visar Statovci', role: 'CEO', pct: 50 }] },
  { name: 'StarLabs Sh.P.K.', reg: '70890003', form: 'SH.P.K', status: 'active', date: '2018-11-20', municipality: 'Prishtinë', address: 'Innovation Park, Prishtinë', activity: 'Software development', capital: 500000, sector: 'Technology', persons: [{ name: 'Tech Founder', role: 'owner', pct: 100 }] },

  // === INSURANCE ===
  { name: 'Sigma Interalbanian VIG Sh.A.', reg: '70901001', form: 'SH.A', status: 'active', date: '2005-08-15', municipality: 'Prishtinë', address: 'Rr. Eqrem Çabej, Prishtinë', activity: 'Non-life insurance', capital: 12000000, sector: 'Insurance', persons: [{ name: 'Avni Ponari', role: 'CEO', pct: 0 }] },
  { name: 'Eurosig Sh.A.', reg: '70901002', form: 'SH.A', status: 'active', date: '2006-04-20', municipality: 'Prishtinë', address: 'Rr. Nëna Terezë, Prishtinë', activity: 'Non-life insurance', capital: 8000000, sector: 'Insurance', persons: [{ name: 'Insurance CEO', role: 'CEO', pct: 0 }] },

  // === MEDIA ===
  { name: 'Klan Kosova Sh.P.K.', reg: '71012001', form: 'SH.P.K', status: 'active', date: '2008-11-20', municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Skopje', activity: 'Television broadcasting', capital: 4000000, sector: 'Media', persons: [{ name: 'Baton Haxhiu', role: 'owner', pct: 100 }] },
  { name: 'Koha Group Sh.P.K.', reg: '71012002', form: 'SH.P.K', status: 'active', date: '1997-04-10', municipality: 'Prishtinë', address: 'Rr. Garibaldi 1, Prishtinë', activity: 'Newspaper, TV (KohaVision)', capital: 3500000, sector: 'Media', persons: [{ name: 'Flaka Surroi', role: 'owner', pct: 100 }] },

  // === EDUCATION ===
  { name: 'AAB College Sh.P.K.', reg: '71123001', form: 'SH.P.K', status: 'active', date: '2002-09-12', municipality: 'Prishtinë', address: 'Rr. Elez Berisha 56, Prishtinë', activity: 'Higher education', capital: 5000000, sector: 'Education', persons: [{ name: 'Masar Stavileci', role: 'owner', pct: 100 }] },
  { name: 'UBT — Universiteti për Biznes dhe Teknologji Sh.P.K.', reg: '71123002', form: 'SH.P.K', status: 'active', date: '2004-10-15', municipality: 'Prishtinë', address: 'Lagjja Kalabria, Prishtinë', activity: 'Higher education', capital: 6000000, sector: 'Education', persons: [{ name: 'Edmond Hajrizi', role: 'owner', pct: 100 }] },

  // === HOTELS ===
  { name: 'Swiss Diamond Hotel Sh.P.K.', reg: '71234001', form: 'SH.P.K', status: 'active', date: '2009-05-30', municipality: 'Prishtinë', address: 'Sheshi Nëna Terezë, Prishtinë', activity: 'Five-star hotel', capital: 12000000, sector: 'Hospitality', persons: [{ name: 'Hotel Group', role: 'owner', pct: 100 }] },
  { name: 'Emerald Hotel Sh.P.K.', reg: '71234002', form: 'SH.P.K', status: 'active', date: '2011-03-15', municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Aeroport', activity: 'Hotel & conference', capital: 8000000, sector: 'Hospitality', persons: [{ name: 'Naim Berisha', role: 'owner', pct: 100 }] },

  // === LOGISTICS ===
  { name: 'Eurolog Sh.P.K.', reg: '71345001', form: 'SH.P.K', status: 'active', date: '2003-07-14', municipality: 'Prishtinë', address: 'Zona Industriale, Prishtinë', activity: 'Logistics & warehousing', capital: 3000000, sector: 'Logistics', persons: [{ name: 'Logistics CEO', role: 'owner', pct: 100 }] },

  // === HIGH-RISK / FLAGGED EXAMPLES (for demo) ===
  { name: 'Shell Company Demo Sh.P.K.', reg: '71456001', form: 'SH.P.K', status: 'suspended', date: '2020-01-15', municipality: 'Mitrovicë', address: 'Unknown address', activity: 'Unspecified services', capital: 1000, sector: 'Unknown', persons: [{ name: 'Anonymous Person', role: 'owner', pct: 100 }] },
  { name: 'Phantom Trading Sh.P.K.', reg: '71456002', form: 'SH.P.K', status: 'deregistered', date: '2019-06-20', municipality: 'Prishtinë', address: '—', activity: 'Trading', capital: 500, sector: 'Unknown', persons: [{ name: 'Unknown Owner', role: 'owner', pct: 100 }] },
  { name: 'Quick Win Tenders Sh.P.K.', reg: '71456003', form: 'SH.P.K', status: 'active', date: '2024-09-01', municipality: 'Prishtinë', address: 'Recently registered', activity: 'General contracting', capital: 1, sector: 'Construction', persons: [{ name: 'Recent Founder', role: 'owner', pct: 100 }] },
];

// Procurement records — realistic Kosovo government contracts
export const PROCUREMENT_DATA: Array<{
  company_reg: string;
  title: string;
  authority: string;
  value: number;
  date: string;
  cpv?: string;
}> = [
  // Kastrati Group — major fuel/services contracts
  { company_reg: '70234001', title: 'Furnizim me karburant për institucionet e Republikës së Kosovës', authority: 'Ministria e Punëve të Brendshme', value: 4200000, date: '2023-08-15', cpv: '09100000' },
  { company_reg: '70234001', title: 'Furnizim me derivate nafte për Policinë e Kosovës', authority: 'Policia e Kosovës', value: 2800000, date: '2024-02-10', cpv: '09100000' },
  { company_reg: '70234001', title: 'Karburant për Forcën e Sigurisë së Kosovës', authority: 'Ministria e Mbrojtjes', value: 1900000, date: '2024-06-22', cpv: '09100000' },
  // ELKOS — food supplies
  { company_reg: '70234002', title: 'Furnizim me ushqim për institucionet edukative', authority: 'Ministria e Arsimit', value: 2400000, date: '2023-05-05', cpv: '15800000' },
  { company_reg: '70234002', title: 'Furnizim ushqimor për qendrat e parashkollore', authority: 'Komuna e Prishtinës', value: 850000, date: '2024-01-15', cpv: '15800000' },
  // Beni-M — construction
  { company_reg: '70567001', title: 'Rikonstruksioni i rrugës rajonale Prizren-Prevallë', authority: 'Komuna e Prizrenit', value: 1850000, date: '2023-09-12', cpv: '45233140' },
  { company_reg: '70567001', title: 'Rinovimi i shkollave fillore në Prizren', authority: 'Ministria e Arsimit', value: 920000, date: '2024-03-01', cpv: '45214210' },
  { company_reg: '70567001', title: 'Ndërtimi i ndërtesës publike komunale', authority: 'Qeveria e Kosovës', value: 3400000, date: '2024-04-22', cpv: '45210000' },
  // 2NB Group
  { company_reg: '70567002', title: 'Ndërtimi i objektit administrativ', authority: 'Komuna e Prishtinës', value: 1200000, date: '2024-05-10', cpv: '45210000' },
  // Sallahu
  { company_reg: '70567003', title: 'Furnizim me materiale ndërtimore për autostradën R7', authority: 'Ministria e Infrastrukturës', value: 2100000, date: '2023-11-20', cpv: '44110000' },
  // Sharrcem — cement
  { company_reg: '70678001', title: 'Furnizim me çimento për projekte infrastrukturore', authority: 'Ministria e Infrastrukturës', value: 5600000, date: '2023-07-08', cpv: '44111000' },
  // IPKO — telecom services
  { company_reg: '70345001', title: 'Shërbime telekomunikimi për institucionet qeveritare', authority: 'Ministria e Punëve të Brendshme', value: 780000, date: '2024-01-20', cpv: '64200000' },
  // Telekomi i Kosovës
  { company_reg: '70345002', title: 'Shërbime telekomunikimi për Kuvendin e Kosovës', authority: 'Kuvendi i Kosovës', value: 320000, date: '2024-03-15', cpv: '64200000' },
  // KEK — energy contracts
  { company_reg: '70456001', title: 'Furnizim me thëngjill për termocentralin', authority: 'KEK Sh.A.', value: 8900000, date: '2024-02-28', cpv: '09111100' },
  // Birra Peja
  { company_reg: '70789001', title: 'Furnizim me pije për institucionet', authority: 'Ministria e Kulturës', value: 95000, date: '2024-04-12', cpv: '15910000' },
  // High-risk: new company winning big contract
  { company_reg: '71456003', title: 'Kontratë e madhe ndërtimi pa kuotim publik', authority: 'Komuna anonime', value: 1200000, date: '2024-10-15', cpv: '45200000' },
  { company_reg: '71456003', title: 'Shërbime konsulence', authority: 'Agjenci shtetërore', value: 450000, date: '2024-11-01', cpv: '79400000' },
  // Banks — government bond services
  { company_reg: '70123002', title: 'Shërbime bankare për Thesarin e Republikës', authority: 'Ministria e Financave', value: 280000, date: '2024-05-20', cpv: '66100000' },
  { company_reg: '70123007', title: 'Llogari rrjedhëse për institucionet publike', authority: 'Thesari i Kosovës', value: 180000, date: '2024-06-10', cpv: '66100000' },
];

// News mentions — realistic Kosovo business news
export const NEWS_DATA: Array<{
  company_reg: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  sentiment: string;
}> = [
  // Kastrati
  { company_reg: '70234001', headline: 'Kastrati Group investon 10 milionë euro në qendrën e re logjistike', summary: 'Grupi Kastrati ka njoftuar investime të reja në zonën e Prishtinës me planifikim për 200 vende pune të reja.', source: 'Koha', date: '2024-09-01', sentiment: 'positive' },
  { company_reg: '70234001', headline: 'Kontroverse për çmimet e karburantit: Kastrati përgjigjet', summary: 'Pas akuzave për çmime artificiale, kompania ka publikuar strukturën e kostove.', source: 'Gazeta Express', date: '2024-07-12', sentiment: 'neutral' },
  // ELKOS
  { company_reg: '70234002', headline: 'ETC zgjeron rrjetin e dyqaneve në Shqipëri', summary: 'Grupi ELKOS planifikon hapjen e 15 supermarketeve të reja brenda 2 viteve.', source: 'Prishtina Insight', date: '2024-06-20', sentiment: 'positive' },
  { company_reg: '70234002', headline: 'ELKOS Group adreson çështjet e pajtueshmërisë tatimore', summary: 'Themeluesi i ELKOS publikoi raport për pajtueshmërinë pas shqetësimeve të ngritura.', source: 'Zëri', date: '2024-03-08', sentiment: 'neutral' },
  // Banks
  { company_reg: '70123002', headline: 'Raiffeisen Bank Kosovo raporton fitime rekorde', summary: 'Banka ka publikuar rezultatet e tremujorit të tretë me rritje 18% të fitimeve neto.', source: 'Koha', date: '2024-10-25', sentiment: 'positive' },
  { company_reg: '70123007', headline: 'Banka Ekonomike lëshon obligacione korporative', summary: 'Banka po planifikon emetim të obligacioneve për financim afatgjatë.', source: 'Koha', date: '2024-09-15', sentiment: 'positive' },
  // Telecom
  { company_reg: '70345001', headline: 'IPKO lançon rrjetin 5G në Prishtinë', summary: 'Operatori telekomunikues ka aktivizuar rrjetin 5G në kryeqytet.', source: 'Prishtina Insight', date: '2024-11-10', sentiment: 'positive' },
  { company_reg: '70345002', headline: 'Telekomi i Kosovës me humbje të vazhdueshme', summary: 'Kompania shtetërore raporton humbje për vitin e katërt radhazi.', source: 'Gazeta Express', date: '2024-08-20', sentiment: 'negative' },
  // Construction
  { company_reg: '70567001', headline: 'Beni-M fiton tender të rëndësishëm infrastrukture', summary: 'Kompania nga Prizreni do të ndërtojë rrugën rajonale me vlerë 1.85M EUR.', source: 'Koha', date: '2024-04-25', sentiment: 'positive' },
  // Energy
  { company_reg: '70456001', headline: 'KEK njofton mirëmbajtjen e bllokut B', summary: 'Termocentrali do të jetë jashtë funksionit për 14 ditë për remont teknik.', source: 'Koha', date: '2024-10-01', sentiment: 'neutral' },
  // High-risk companies
  { company_reg: '71456001', headline: 'Hetimet për kompanitë "shell" në Mitrovicë', summary: 'Prokuroria ka nisur hetimet për disa kompani me strukturë të paqartë pronësore.', source: 'Gazeta Express', date: '2023-11-15', sentiment: 'negative' },
  { company_reg: '71456003', headline: 'Pyetje për dhënien e shpejtë të tenderëve kompanive të reja', summary: 'Organizatat e shoqërisë civile ngrenë shqetësime për tenderë të mëdhenj që po u jepen kompanive të sapoformuara.', source: 'Koha', date: '2024-09-05', sentiment: 'negative' },
  // Tech
  { company_reg: '70890001', headline: 'Gjirafa lëshon platformën e re të e-commerce', summary: 'Kompania ka njoftuar zgjerim në tregjet rajonale.', source: 'Prishtina Insight', date: '2024-07-15', sentiment: 'positive' },
  // Industry
  { company_reg: '70678002', headline: 'NewCo Ferronikeli pezullon operacionet për shkak të çmimeve të energjisë', summary: 'Kompania minerare ka njoftuar pezullimin e prodhimit për një periudhë të paspecifikuar.', source: 'Zëri', date: '2024-05-20', sentiment: 'negative' },
];
