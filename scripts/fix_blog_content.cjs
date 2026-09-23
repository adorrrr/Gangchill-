const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const seedPath = path.resolve(__dirname, '../api/database/seed_data.json');
  if (!fs.existsSync(seedPath)) {
    console.error('seed_data.json not found');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const posts = data.blogPosts;

  console.log(`Loaded ${posts.length} posts from seed_data.json`);

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'gangchill_db',
    port: 3306
  });

  for (const post of posts) {
    const jsonContent = JSON.stringify(post.content);
    console.log(`Updating post: ${post.slug} (length: ${jsonContent.length} chars)`);
    await connection.execute(
      'UPDATE blog_posts SET content = ? WHERE slug = ?',
      [jsonContent, post.slug]
    );
  }

  const [rows] = await connection.execute('SELECT id, slug, LEFT(content, 60) as preview FROM blog_posts');
  console.log('Updated blog posts:');
  console.table(rows);

  await connection.end();
  console.log('Finished updating blog content successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
