import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function exportSeed() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  const stocksMod = await server.ssrLoadModule('./src/data/stocks.ts');
  const investmentsMod = await server.ssrLoadModule('./src/data/investments.ts');
  const blogMod = await server.ssrLoadModule('./src/data/blog.ts');

  await server.close();

  const seedData = {
    stocks: stocksMod.MOCK_STOCKS || [],
    investments: investmentsMod.MOCK_INVESTMENTS || [],
    blogPosts: blogMod.MOCK_BLOG_POSTS || []
  };

  const outPath = path.resolve('api/database/seed_data.json');
  fs.writeFileSync(outPath, JSON.stringify(seedData, null, 2), 'utf8');
  console.log(`Successfully exported seed data to ${outPath}:`, {
    stocksCount: seedData.stocks.length,
    investmentsCount: seedData.investments.length,
    blogCount: seedData.blogPosts.length
  });
}

exportSeed().catch(err => {
  console.error("Export seed error:", err);
  process.exit(1);
});
