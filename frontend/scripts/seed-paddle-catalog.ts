#!/usr/bin/env npx tsx
/**
 * Seed Paddle catalog with all PropManager plans.
 * Run: PADDLE_API_KEY=... npx tsx scripts/seed-paddle-catalog.ts
 * Outputs JSON with all product_ids and price_ids.
 */
import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error('PADDLE_API_KEY not set');
  process.exit(1);
}

const paddle = new Paddle(apiKey, { environment: Environment.sandbox });

const plans = [
  {
    name: 'Agent Starter',
    description: 'For a solo agent taking on real volume.',
    prices: [
      { interval: 'month', frequency: 1, amount: '12.00', description: 'Agent Starter monthly USD' },
      { interval: 'year', frequency: 1, amount: '120.00', description: 'Agent Starter yearly USD' },
    ],
  },
  {
    name: 'Agent Pro',
    description: 'For agents running a full pipeline and a team.',
    prices: [
      { interval: 'month', frequency: 1, amount: '29.00', description: 'Agent Pro monthly USD' },
      { interval: 'year', frequency: 1, amount: '290.00', description: 'Agent Pro yearly USD' },
    ],
  },
  {
    name: 'Agent Agency',
    description: 'For agencies with no ceiling on listings or seats.',
    prices: [
      { interval: 'month', frequency: 1, amount: '79.00', description: 'Agent Agency monthly USD' },
      { interval: 'year', frequency: 1, amount: '790.00', description: 'Agent Agency yearly USD' },
    ],
  },
  {
    name: 'Owner Starter',
    description: 'For a small portfolio and a helping hand.',
    prices: [
      { interval: 'month', frequency: 1, amount: '24.00', description: 'Owner Starter monthly USD' },
      { interval: 'year', frequency: 1, amount: '240.00', description: 'Owner Starter yearly USD' },
    ],
  },
  {
    name: 'Owner Pro',
    description: 'For a growing portfolio that needs the full toolkit.',
    prices: [
      { interval: 'month', frequency: 1, amount: '59.00', description: 'Owner Pro monthly USD' },
      { interval: 'year', frequency: 1, amount: '590.00', description: 'Owner Pro yearly USD' },
    ],
  },
  {
    name: 'Owner Enterprise',
    description: 'For large portfolios with no ceiling.',
    prices: [
      { interval: 'month', frequency: 1, amount: '149.00', description: 'Owner Enterprise monthly USD' },
      { interval: 'year', frequency: 1, amount: '1490.00', description: 'Owner Enterprise yearly USD' },
    ],
  },
] as const;

async function seed() {
  const results: Record<string, { productId: string; monthlyId?: string; yearlyId?: string }> = {};

  for (const plan of plans) {
    console.log(`Creating product: ${plan.name}...`);
    const product = await paddle.products.create({
      name: plan.name,
      taxCategory: 'saas',
      description: plan.description,
    });

    const monthlyPrice = await paddle.prices.create({
      productId: product.id,
      description: plan.prices[0].description,
      unitPrice: { amount: String(Math.round(parseFloat(plan.prices[0].amount) * 100)), currencyCode: 'USD' },
      billingCycle: { interval: plan.prices[0].interval, frequency: plan.prices[0].frequency },
      trialPeriod: { interval: 'day', frequency: 14 },
    });

    const yearlyPrice = await paddle.prices.create({
      productId: product.id,
      description: plan.prices[1].description,
      unitPrice: { amount: String(Math.round(parseFloat(plan.prices[1].amount) * 100)), currencyCode: 'USD' },
      billingCycle: { interval: plan.prices[1].interval, frequency: plan.prices[1].frequency },
      trialPeriod: { interval: 'day', frequency: 14 },
    });

    const key = plan.name.toLowerCase().replace(/\s+/g, '_');
    results[key] = {
      productId: product.id,
      monthlyId: monthlyPrice.id,
      yearlyId: yearlyPrice.id,
    };
    console.log(`  ✓ ${product.id} | monthly: ${monthlyPrice.id} | yearly: ${yearlyPrice.id}`);
  }

  console.log('\n=== COPY THESE INTO YOUR .env ===');
  console.log(JSON.stringify(results, null, 2));
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});