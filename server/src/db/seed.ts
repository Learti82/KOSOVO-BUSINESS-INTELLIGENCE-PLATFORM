import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import bcrypt from 'bcryptjs';
import { pool, query } from './pool';
import { normalizeCompanyName, generateOrderNumber } from '../utils/normalize';

async function seed() {
  console.log('Seeding database...');

  // Wipe (development only)
  await query('TRUNCATE reports, report_orders, news_mentions, procurement_records, company_persons, companies, users, scrape_jobs RESTART IDENTITY CASCADE');

  // Users
  const analystHash = await bcrypt.hash('analyst123', 10);
  const clientHash = await bcrypt.hash('demo1234', 10);
  const analyst = await query<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, role, verified)
     VALUES ('analyst@kosovaintel.com', $1, 'Analyst Demo', 'analyst', true) RETURNING id`,
    [analystHash]
  );
  const client = await query<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, company_name, role, use_case, verified)
     VALUES ('demo@client.com', $1, 'Demo Client', 'Demo Law Firm', 'client', 'law_firm', true) RETURNING id`,
    [clientHash]
  );

  // Companies
  const companies = [
    { name: 'Kastrati Group Sh.P.K.', reg: '70123456', form: 'SH.P.K', status: 'active', date: '2002-03-15',
      municipality: 'Prishtinë', address: 'Rr. UÇK, Prishtinë', activity: 'Wholesale and retail trade',
      capital: 5000000, persons: [{ name: 'Nazim Kastrati', role: 'owner', pct: 100 }] },
    { name: 'Elkos Group Sh.P.K.', reg: '70234567', form: 'SH.P.K', status: 'active', date: '1995-06-22',
      municipality: 'Prishtinë', address: 'Magjistralja Prishtinë-Ferizaj', activity: 'Retail trade',
      capital: 3500000, persons: [{ name: 'Bedri Hamza', role: 'director', pct: 50 }, { name: 'Egzon Hamza', role: 'partner', pct: 50 }] },
    { name: 'Beni-M Sh.P.K.', reg: '70345678', form: 'SH.P.K', status: 'active', date: '2008-11-10',
      municipality: 'Prizren', address: 'Rr. Adem Jashari, Prizren', activity: 'Construction',
      capital: 250000, persons: [{ name: 'Benjamin Mehmeti', role: 'owner', pct: 100 }] },
    { name: 'Demo Inactive Sh.P.K.', reg: '70456789', form: 'SH.P.K', status: 'suspended', date: '2015-01-20',
      municipality: 'Mitrovicë', address: 'Rr. Mbreteresha Teute', activity: 'Services',
      capital: 5000, persons: [{ name: 'Unknown Owner', role: 'owner', pct: 100 }] },
    { name: 'New Startup Sh.P.K.', reg: '70567890', form: 'SH.P.K', status: 'active',
      date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      municipality: 'Prishtinë', address: 'Rr. Migjeni', activity: 'IT services',
      capital: 1, persons: [{ name: 'Anonymous Founder', role: 'owner', pct: 100 }] },
  ];

  const companyIds: number[] = [];
  for (const c of companies) {
    const r = await query<{ id: number }>(
      `INSERT INTO companies (registration_number, name, name_normalized, legal_form, status, registration_date,
        municipality, address, primary_activity_description, share_capital_eur, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING id`,
      [c.reg, c.name, normalizeCompanyName(c.name), c.form, c.status, c.date, c.municipality, c.address, c.activity, c.capital]
    );
    companyIds.push(r.rows[0].id);
    for (const p of c.persons) {
      await query(
        `INSERT INTO company_persons (company_id, full_name, role, ownership_percent, person_type)
         VALUES ($1,$2,$3,$4,'individual')`,
        [r.rows[0].id, p.name, p.role, p.pct]
      );
    }
  }

  // Procurement
  const proc = [
    { ci: 0, title: 'Wholesale fuel supply contract', auth: 'Ministry of Internal Affairs', value: 1200000, date: '2023-08-15' },
    { ci: 0, title: 'Office supplies framework agreement', auth: 'Municipality of Prishtinë', value: 350000, date: '2023-11-20' },
    { ci: 0, title: 'Vehicle maintenance', auth: 'Kosovo Police', value: 780000, date: '2024-02-10' },
    { ci: 1, title: 'Food supplies for state institutions', auth: 'Ministry of Education', value: 2400000, date: '2023-05-05' },
    { ci: 1, title: 'Cleaning services contract', auth: 'University of Prishtinë', value: 180000, date: '2024-01-15' },
    { ci: 2, title: 'Road infrastructure works in Prizren', auth: 'Municipality of Prizren', value: 850000, date: '2023-09-12' },
    { ci: 2, title: 'School renovation', auth: 'Ministry of Education', value: 420000, date: '2024-03-01' },
    { ci: 2, title: 'Public building construction', auth: 'Government of Kosovo', value: 1800000, date: '2024-04-22' },
    { ci: 2, title: 'Bridge repair', auth: 'Ministry of Infrastructure', value: 670000, date: '2024-06-10' },
    { ci: 4, title: 'IT consulting services', auth: 'Agency for IT Society', value: 120000, date: '2024-08-01' },
  ];
  for (let i = 0; i < proc.length; i++) {
    const p = proc[i];
    await query(
      `INSERT INTO procurement_records
       (company_id, company_name_raw, ocid, tender_title, contracting_authority, contract_value_eur, award_date, procedure_type, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'open',NOW())`,
      [companyIds[p.ci], companies[p.ci].name, `ocds-kosovo-${1000 + i}`, p.title, p.auth, p.value, p.date]
    );
  }

  // News
  const news = [
    { ci: 0, h: 'Kastrati Group invests €10M in new logistics hub', src: 'Koha', sentiment: 'positive', date: '2024-09-01' },
    { ci: 0, h: 'Fuel price controversy: Kastrati responds', src: 'Gazeta Express', sentiment: 'neutral', date: '2024-07-12' },
    { ci: 1, h: 'Elkos expands ETC chain to Albania', src: 'Prishtina Insight', sentiment: 'positive', date: '2024-06-20' },
    { ci: 1, h: 'Elkos founder addresses tax compliance concerns', src: 'Zëri', sentiment: 'negative', date: '2024-03-08' },
    { ci: 2, h: 'Beni-M wins major infrastructure tender', src: 'Koha', sentiment: 'positive', date: '2024-04-25' },
    { ci: 3, h: 'Investigation into shell company activities in Mitrovicë', src: 'Gazeta Express', sentiment: 'negative', date: '2023-11-15' },
    { ci: 4, h: 'New IT startups in Kosovo receive government contracts', src: 'Prishtina Insight', sentiment: 'positive', date: '2024-08-15' },
    { ci: 4, h: 'Questions raised about rapid procurement award to new company', src: 'Koha', sentiment: 'negative', date: '2024-09-05' },
  ];
  for (const n of news) {
    await query(
      `INSERT INTO news_mentions (company_id, search_term, headline, summary, source_name, source_url, published_at, sentiment, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [companyIds[n.ci], companies[n.ci].name, n.h, n.h, n.src, `https://${n.src.toLowerCase().replace(/\s/g, '')}.com/article`, n.date, n.sentiment]
    );
  }

  // Orders
  for (let i = 0; i < 3; i++) {
    const num = generateOrderNumber(i + 1);
    const order = await query<{ id: number }>(
      `INSERT INTO report_orders
       (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur, paid, status, completed_at, created_at)
       VALUES ($1,$2,$3,$4,'standard','standard',599,true,'completed',NOW() - INTERVAL '${i+1} days', NOW() - INTERVAL '${i+3} days')
       RETURNING id`,
      [num, client.rows[0].id, companyIds[i], companies[i].name]
    );
    await query(
      `INSERT INTO reports (order_id, company_id, analyst_summary, analyst_risk_rating, ai_risk_narrative, ai_risk_score, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [order.rows[0].id, companyIds[i],
       `Analyst review of ${companies[i].name} completed. Company shows ${companies[i].status} status with documented operations.`,
       i === 0 ? 'low' : i === 1 ? 'medium' : 'medium',
       `Risk narrative for ${companies[i].name}: This is a seeded sample report demonstrating the full report flow.`,
       i === 0 ? 25 : i === 1 ? 45 : 55]
    );
  }

  // In-progress order
  const inProgressNum = generateOrderNumber(4);
  await query(
    `INSERT INTO report_orders
     (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur, paid, status, assigned_analyst_id)
     VALUES ($1,$2,$3,$4,'comprehensive','express',1799,true,'in_progress',$5)`,
    [inProgressNum, client.rows[0].id, companyIds[4], companies[4].name, analyst.rows[0].id]
  );

  console.log('Seed complete.');
  console.log('Analyst login: analyst@kosovaintel.com / analyst123');
  console.log('Client login:  demo@client.com / demo1234');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
