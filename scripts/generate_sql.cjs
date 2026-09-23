const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const schemaPath = path.join(root, "api", "database", "schema.sql");
const seedJsonPath = path.join(root, "api", "database", "seed_data.json");
const seedSqlPath = path.join(root, "api", "database", "seed.sql");

const seedData = JSON.parse(fs.readFileSync(seedJsonPath, "utf-8"));

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "object") {
    val = JSON.stringify(val);
  }
  return "'" + val.toString().replace(/[\x5c\x27]/g, "\\$&").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
}

let sql = "-- ==========================================================\n";
sql += "-- GANGCHILL INITIAL SEED DATA (PRODUCTS, BLOG, INVESTMENTS)\n";
sql += "-- ==========================================================\n\n";

// 1. Platform Settings
sql += "-- 1. Platform Settings\n";
const defaultSettings = {
  platformName: "Gangchill B2B Hub",
  tagline: "জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক",
  supportEmail: "supply@gangchill.com",
  emergencyHotline: "+880 1712-345678",
  businessHours: "শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা",
  headOfficeAddress: "হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ",
  hubLocations: "চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট",
  defaultMoqKg: 50,
  coldChainEnabled: true,
  allowPublicSellerSubmissions: true,
  allowPublicInvestorInterest: true,
  maintenanceMode: false,
  notifyOnNewOrder: true,
  notifyOnNewLot: true,
  notifyOnNewInvestmentInterest: true
};
sql += `INSERT INTO \`platform_settings\` (\`id\`, \`settings_json\`, \`updated_by\`) VALUES (1, ${escapeSql(defaultSettings)}, 'MD Admin') ON DUPLICATE KEY UPDATE \`settings_json\` = VALUES(\`settings_json\`);\n\n`;

// 2. Stocks
sql += "-- 2. Fish Inventory & Stocks\n";
if (seedData.stocks && seedData.stocks.length) {
  for (const s of seedData.stocks) {
    sql += `INSERT INTO \`stocks\` (\`id\`, \`slug\`, \`product_name\`, \`bangla_name\`, \`category\`, \`status\`, \`quantity\`, \`unit\`, \`location\`, \`district\`, \`division\`, \`grade\`, \`harvest_date\`, \`packaging\`, \`minimum_order\`, \`price\`, \`price_type\`, \`description\`, \`images\`, \`specifications\`, \`origin_details\`, \`logistics\`, \`featured\`) VALUES (\n`;
    sql += `  ${escapeSql(s.id)}, ${escapeSql(s.slug)}, ${escapeSql(s.productName)}, ${escapeSql(s.banglaName)}, ${escapeSql(s.category)}, ${escapeSql(s.status)}, ${s.quantity}, ${escapeSql(s.unit)},\n`;
    sql += `  ${escapeSql(s.location)}, ${escapeSql(s.district)}, ${escapeSql(s.division)}, ${escapeSql(s.grade)}, ${escapeSql(s.harvestDate || s.availabilityDate)}, ${escapeSql(s.packaging)}, ${s.minimumOrder || 50},\n`;
    sql += `  ${s.price}, ${escapeSql(s.priceType || "fixed")}, ${escapeSql(s.description)}, ${escapeSql(s.images || [])}, ${escapeSql(s.specifications || [])}, ${escapeSql(s.originDetails || null)}, ${escapeSql(s.logistics || null)}, ${s.featured ? 1 : 0}\n`;
    sql += `) ON DUPLICATE KEY UPDATE \`product_name\` = VALUES(\`product_name\`);\n`;
  }
  sql += "\n";
}

// 3. Investments
sql += "-- 3. Fisheries Investments Projects\n";
if (seedData.investments && seedData.investments.length) {
  for (const inv of seedData.investments) {
    sql += `INSERT INTO \`investments\` (\`id\`, \`slug\`, \`stock_id\`, \`title\`, \`product_name\`, \`category\`, \`location\`, \`required_capital\`, \`raised_capital\`, \`minimum_investment\`, \`profit_percentage\`, \`duration_days\`, \`start_date\`, \`settlement_date\`, \`status\`, \`description\`, \`procurement_plan\`, \`timeline\`, \`risks\`, \`security_and_compliance\`, \`images\`, \`investor_count\`) VALUES (\n`;
    sql += `  ${escapeSql(inv.id)}, ${escapeSql(inv.slug)}, ${escapeSql(inv.stockId || null)}, ${escapeSql(inv.title)}, ${escapeSql(inv.productName)}, ${escapeSql(inv.category)}, ${escapeSql(inv.location)},\n`;
    sql += `  ${inv.requiredCapital}, ${inv.raisedCapital}, ${inv.minimumInvestment}, ${inv.profitPercentage}, ${inv.durationDays}, ${escapeSql(inv.startDate || null)}, ${escapeSql(inv.settlementDate || null)}, ${escapeSql(inv.status)}, ${escapeSql(inv.description)},\n`;
    sql += `  ${escapeSql(inv.procurementPlan || [])}, ${escapeSql(inv.timeline || [])}, ${escapeSql(inv.risks || [])}, ${escapeSql(inv.securityAndCompliance || [])}, ${escapeSql(inv.images || [])}, ${inv.investorCount || 0}\n`;
    sql += `) ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
  sql += "\n";
}

// 4. Blog Posts
sql += "-- 4. CMS Blog Posts\n";
if (seedData.blogPosts && seedData.blogPosts.length) {
  for (const bp of seedData.blogPosts) {
    sql += `INSERT INTO \`blog_posts\` (\`slug\`, \`title\`, \`excerpt\`, \`content\`, \`category\`, \`featured_image\`, \`image_alt\`, \`author\`, \`published_at\`, \`reading_time\`, \`seo_title\`, \`seo_description\`, \`keywords\`, \`featured\`) VALUES (\n`;
    sql += `  ${escapeSql(bp.slug)}, ${escapeSql(bp.title)}, ${escapeSql(bp.excerpt)}, ${escapeSql(bp.content)}, ${escapeSql(bp.category)}, ${escapeSql(bp.featuredImage || null)}, ${escapeSql(bp.imageAlt || null)},\n`;
    sql += `  ${escapeSql(bp.author || "Gangchill Editorial Team")}, ${escapeSql(bp.publishedAt || "2026-09-14")}, ${escapeSql(bp.readingTime || "৫ মিনিট পড়া")}, ${escapeSql(bp.seoTitle || null)}, ${escapeSql(bp.seoDescription || null)}, ${escapeSql(bp.keywords || [])}, ${bp.featured ? 1 : 0}\n`;
    sql += `) ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);\n`;
  }
  sql += "\n";
}

// 5. Customers
sql += "-- 5. Verified B2B Customers\n";
sql += `INSERT INTO \`customers\` (\`id\`, \`company_name\`, \`business_type\`, \`contact_person\`, \`phone\`, \`email\`, \`delivery_location\`, \`tier\`, \`total_orders_count\`, \`total_volume_kg\`, \`total_order_value\`, \`last_order_date\`, \`preferred_fish\`) VALUES (\n`;
sql += `  'CUST-001', 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)', 'সুপারশপ চেইন', 'তানভীর আহমেদ', '01711-223344', 'procurement@unimart.com.bd', 'গুলশান ২, ঢাকা', 'VIP', 8, 2850.00, 4617000.00, '2026-09-14', ${escapeSql(["পদ্মার রূপালী ইলিশ", "চলনবিলের পাবদা", "গলদা চিংড়ি"])}\n`;
sql += `) ON DUPLICATE KEY UPDATE \`company_name\` = VALUES(\`company_name\`);\n\n`;

// 6. Suppliers
sql += "-- 6. Coastal Suppliers & Cooperatives\n";
sql += `INSERT INTO \`suppliers\` (\`id\`, \`farmer_name\`, \`type\`, \`phone\`, \`district\`, \`location\`, \`verification_badge\`, \`total_lots_count\`, \`total_volume_kg\`, \`quality_rating\`, \`primary_species\`, \`joined_date\`) VALUES (\n`;
sql += `  'SUP-001', 'মো: মোশাররফ হোসেন (জেলে সমবায়)', 'জেলে সমবায়', '01715-998877', 'চাঁদপুর', 'বড়স্টেশন মোহনা ঘাট', 'verified', 14, 8500.00, 4.9, ${escapeSql(["পদ্মার রূপালী ইলিশ", "মেঘনার পাঙ্গাশ", "তপসে"])}, '2025-11-10'\n`;
sql += `) ON DUPLICATE KEY UPDATE \`farmer_name\` = VALUES(\`farmer_name\`);\n\n`;

// 7. Initial Buyer Orders
sql += "-- 7. Initial Buyer Orders\n";
sql += `INSERT INTO \`buyer_orders\` (\`id\`, \`company_name\`, \`contact_person\`, \`phone\`, \`email\`, \`product_name\`, \`quantity\`, \`unit\`, \`required_date\`, \`delivery_location\`, \`specification\`, \`notes\`, \`status\`, \`order_status\`, \`quoted_price_per_unit\`, \`total_estimated_value\`, \`assigned_staff\`, \`status_history\`, \`internal_notes\`) VALUES (\n`;
sql += `  'REQ-1726001001', 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)', 'তানভীর আহমেদ', '01711-223344', 'procurement@unimart.com.bd', 'চাঁদপুরের পদ্মার রূপালী ইলিশ', 350.00, 'কেজি (KG)', '2026-09-20', 'গুলশান ২, ঢাকা', '১ কেজি+ সাইজ গ্রেড, তাজা বরফ প্যাক', 'সকাল ৮টার মধ্যে আনলোড নিশ্চিত করতে হবে', 'pending', 'under_review', 1620.00, 567000.00, 'MD Admin', ${escapeSql([{status: "pending", timestamp: "2026-09-14T08:30:00Z", updatedBy: "সিস্টেম", note: "চাহিদাপত্র জমা"}])}, 'কোল্ড চেইন পরিবহন দল প্রস্তুত'\n`;
sql += `) ON DUPLICATE KEY UPDATE \`company_name\` = VALUES(\`company_name\`);\n\n`;

// 8. Seller Lots
sql += "-- 8. Coastal Harvest Seller Lots\n";
sql += `INSERT INTO \`seller_lots\` (\`id\`, \`farmer_name\`, \`phone\`, \`district\`, \`product_name\`, \`stock_type\`, \`quantity\`, \`unit\`, \`location\`, \`availability_date\`, \`expected_price\`, \`description\`, \`images\`, \`status\`, \`verification_status\`, \`field_inspector_name\`, \`inspection_notes\`, \`approved_wholesale_price\`) VALUES (\n`;
sql += `  'LOT-1726002001', 'মো: মোশাররফ হোসেন', '01715-998877', 'চাঁদপুর', 'পদ্মার রূপালী ইলিশ (তাজা লট)', 'current', 850.00, 'কেজি (KG)', 'বড়স্টেশন মোহনা ঘাট, চাঁদপুর', 'আজ ভোরের আহরণ', 1550.00, 'মেঘনা-পদ্মার সঙ্গমস্থল থেকে আহরিত খাঁটি চকচকে ইলিশ। সরাসরি বরফ প্যাকেজে রেডি।', ${escapeSql(["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"])}, 'submitted', 'verified', 'MD Admin', 'ঘাট পয়েন্টে কোয়ালিটি অডিট সফল।', 1550.00\n`;
sql += `) ON DUPLICATE KEY UPDATE \`farmer_name\` = VALUES(\`farmer_name\`);\n`;

fs.writeFileSync(seedSqlPath, sql, "utf-8");
console.log("✓ Generated " + seedSqlPath);

// Read clean base schema.sql (lines up to default superadmin account)
const fullRawSchema = fs.readFileSync(schemaPath, "utf-8");
const marker = "-- ==========================================================\n-- GANGCHILL INITIAL SEED DATA";
let baseSchema = fullRawSchema.includes(marker) ? fullRawSchema.split(marker)[0].trimEnd() : fullRawSchema.trimEnd();

const completeSchema = baseSchema + "\n\n" + sql;
fs.writeFileSync(schemaPath, completeSchema, "utf-8");
console.log("✓ Updated " + schemaPath + " with complete schema + seed data (" + completeSchema.length + " bytes)");
