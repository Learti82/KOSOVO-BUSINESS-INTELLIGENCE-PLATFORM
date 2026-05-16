import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import bcrypt from 'bcryptjs';
import { pool, query } from './pool';
import { normalizeCompanyName, generateOrderNumber, hashPII } from '../utils/normalize';
import { KOSOVO_COMPANIES, PROCUREMENT_DATA, NEWS_DATA } from './kosovo-data';

async function seed() {
  console.log('Seeding database with real Kosovo company data...');

  await query('TRUNCATE reports, report_orders, news_mentions, procurement_records, company_persons, companies, users, scrape_jobs RESTART IDENTITY CASCADE');

  // Users
  const analystHash = await bcrypt.hash('analyst123', 10);
  const clientHash = await bcrypt.hash('demo1234', 10);
  const analyst = await query<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, role, verified)
     VALUES ('analyst@kosovaintel.com', $1, 'Senior Analyst', 'analyst', true) RETURNING id`,
    [analystHash]
  );
  const client = await query<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, company_name, role, use_case, verified)
     VALUES ('demo@client.com', $1, 'Demo Client', 'Demo Law Firm', 'client', 'law_firm', true) RETURNING id`,
    [clientHash]
  );
  console.log(`  ✓ Created ${2} users`);

  // Companies
  const regToId: Record<string, number> = {};
  for (const c of KOSOVO_COMPANIES) {
    const r = await query<{ id: number }>(
      `INSERT INTO companies (registration_number, name, name_normalized, legal_form, status, registration_date,
        municipality, address, primary_activity_description, share_capital_eur, source_url, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id`,
      [c.reg, c.name, normalizeCompanyName(c.name), c.form, c.status, c.date, c.municipality,
       c.address, c.activity, c.capital, `https://arbk.rks-gov.net/page.aspx?id=1,38,${c.reg}`]
    );
    regToId[c.reg] = r.rows[0].id;
    for (const p of c.persons) {
      await query(
        `INSERT INTO company_persons (company_id, full_name, role, ownership_percent, person_type, id_number_hash)
         VALUES ($1,$2,$3,$4,'individual',$5)`,
        [r.rows[0].id, p.name, p.role, p.pct, hashPII(p.name)]
      );
    }
  }
  console.log(`  ✓ Inserted ${KOSOVO_COMPANIES.length} companies with owners`);

  // Procurement
  let procCount = 0;
  for (let i = 0; i < PROCUREMENT_DATA.length; i++) {
    const p = PROCUREMENT_DATA[i];
    const cid = regToId[p.company_reg];
    if (!cid) continue;
    const companyName = KOSOVO_COMPANIES.find(c => c.reg === p.company_reg)?.name || '';
    await query(
      `INSERT INTO procurement_records
       (company_id, company_name_raw, ocid, tender_title, contracting_authority, contract_value_eur,
        award_date, procedure_type, cpv_code, source_url, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9,NOW())`,
      [cid, companyName, `ocds-kos-${10000 + i}`, p.title, p.authority, p.value, p.date,
       p.cpv || null, `https://e-prokurimi.rks-gov.net/contract/${10000 + i}`]
    );
    procCount++;
  }
  console.log(`  ✓ Inserted ${procCount} procurement records`);

  // News
  let newsCount = 0;
  for (const n of NEWS_DATA) {
    const cid = regToId[n.company_reg];
    if (!cid) continue;
    const companyName = KOSOVO_COMPANIES.find(c => c.reg === n.company_reg)?.name || '';
    const slug = n.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    await query(
      `INSERT INTO news_mentions (company_id, search_term, headline, summary, source_name, source_url, published_at, sentiment, scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())`,
      [cid, companyName, n.headline, n.summary, n.source,
       `https://${n.source.toLowerCase().replace(/\s/g, '')}.net/${slug}`, n.date, n.sentiment]
    );
    newsCount++;
  }
  console.log(`  ✓ Inserted ${newsCount} news mentions`);

  // Sample completed orders (so the analyst kanban + client dashboard have content)
  const sampleOrders = [
    { reg: '70234001', type: 'comprehensive', daysAgo: 5, rating: 'low' },
    { reg: '70234002', type: 'standard', daysAgo: 8, rating: 'medium' },
    { reg: '70567001', type: 'standard', daysAgo: 12, rating: 'low' },
  ];

  for (let i = 0; i < sampleOrders.length; i++) {
    const s = sampleOrders[i];
    const cid = regToId[s.reg];
    const company = KOSOVO_COMPANIES.find(c => c.reg === s.reg)!;
    const orderNum = generateOrderNumber(i + 1);
    const orderResult = await query<{ id: number }>(
      `INSERT INTO report_orders
       (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur,
        paid, status, completed_at, due_at, created_at)
       VALUES ($1,$2,$3,$4,$5,'standard',$6,true,'completed',
               NOW() - INTERVAL '${s.daysAgo} days', NOW() - INTERVAL '${s.daysAgo - 2} days', NOW() - INTERVAL '${s.daysAgo + 2} days')
       RETURNING id`,
      [orderNum, client.rows[0].id, cid, company.name, s.type, s.type === 'comprehensive' ? 1199 : 599]
    );
    const score = s.rating === 'low' ? 22 : s.rating === 'medium' ? 48 : 72;
    await query(
      `INSERT INTO reports (order_id, company_id, analyst_summary, analyst_risk_rating, analyst_flags,
        analyst_recommendations, ai_risk_narrative, ai_risk_score, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW() - INTERVAL '${s.daysAgo - 2} days')`,
      [orderResult.rows[0].id, cid,
       `Comprehensive analyst review of ${company.name}. Company is operational with documented history. Ownership transparent, financial position adequate for its sector.`,
       s.rating,
       JSON.stringify([
         { flag: 'Verified active status', severity: 'low', detail: 'Company is currently active per ARBK registry' },
         { flag: 'Established operations', severity: 'low', detail: `Operating since ${company.date}` },
       ]),
       'Proceed with standard commercial terms. Verify counterparty details directly before signing.',
       `${company.name} is an established Kosovo-registered ${company.form} operating in the ${company.sector} sector. The company has been continuously active since ${company.date.split('-')[0]}. Share capital of €${company.capital.toLocaleString()} is appropriate for the sector. Ownership structure is documented and stable. Government procurement history shows ${PROCUREMENT_DATA.filter(p => p.company_reg === s.reg).length} contracts won, indicating active market participation. No negative news flags identified during the screening period.`,
       score]
    );
  }
  console.log(`  ✓ Created ${sampleOrders.length} completed sample reports`);

  // One in-progress order assigned to analyst
  const inProgressReg = '71456003'; // High-risk new company
  const inProgressCompany = KOSOVO_COMPANIES.find(c => c.reg === inProgressReg)!;
  await query(
    `INSERT INTO report_orders
     (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur,
      paid, status, assigned_analyst_id, due_at, created_at)
     VALUES ($1,$2,$3,$4,'comprehensive','express',1799,true,'in_progress',$5,
             NOW() + INTERVAL '12 hours', NOW() - INTERVAL '6 hours')`,
    [generateOrderNumber(4), client.rows[0].id, regToId[inProgressReg], inProgressCompany.name, analyst.rows[0].id]
  );

  // One pending order (newly arrived, unassigned)
  await query(
    `INSERT INTO report_orders
     (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur,
      paid, status, due_at, created_at)
     VALUES ($1,$2,$3,$4,'standard','standard',599,false,'pending',
             NOW() + INTERVAL '48 hours', NOW() - INTERVAL '1 hours')`,
    [generateOrderNumber(5), client.rows[0].id, regToId['70123002'], 'Raiffeisen Bank Kosovo Sh.A.']
  );

  console.log('\n  ✓ Seed complete!');
  console.log('\n  Login credentials:');
  console.log('  ─────────────────────────────────────');
  console.log('  Analyst: analyst@kosovaintel.com / analyst123');
  console.log('  Client:  demo@client.com / demo1234');
  console.log('  ─────────────────────────────────────\n');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
