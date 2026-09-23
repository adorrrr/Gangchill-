<?php
// Strict CLI execution check to prevent unauthorized web access
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => false,
        'error' => 'Database initialization script can only be executed via the command line interface (CLI).'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Auth.php';

try {
    $db = Database::getConnection();
    echo "Connected to database successfully.\n";

    // 1. Seed Admin User
    $stmt = $db->prepare("SELECT COUNT(*) FROM admins WHERE email = 'admin@gangchill.com'");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $adminId = 'adm-001';
        $passHash = Auth::hashPassword('admin123');
        $insertAdmin = $db->prepare("
            INSERT INTO admins (id, name, email, password_hash, role, designation, avatar, phone)
            VALUES (:id, :name, :email, :password_hash, :role, :designation, :avatar, :phone)
        ");
        $insertAdmin->execute([
            ':id' => $adminId,
            ':name' => 'MD Admin',
            ':email' => 'admin@gangchill.com',
            ':password_hash' => $passHash,
            ':role' => 'superadmin',
            ':designation' => 'ম্যানেজিং ডিরেক্টর ও অ্যাডমিন',
            ':avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            ':phone' => '01712-345678'
        ]);
        echo "Superadmin seeded: admin@gangchill.com / admin123\n";
    }

    // 2. Seed Platform Settings
    $stmt = $db->prepare("SELECT COUNT(*) FROM platform_settings WHERE id = 1");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $defaultSettings = [
            'platformName' => 'Gangchill B2B Hub',
            'tagline' => 'জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক',
            'supportEmail' => 'supply@gangchill.com',
            'emergencyHotline' => '+880 1712-345678',
            'businessHours' => 'শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা',
            'headOfficeAddress' => 'হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ',
            'hubLocations' => 'চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট',
            'defaultMoqKg' => 50,
            'coldChainEnabled' => true,
            'allowPublicSellerSubmissions' => true,
            'allowPublicInvestorInterest' => true,
            'maintenanceMode' => false,
            'notifyOnNewOrder' => true,
            'notifyOnNewLot' => true,
            'notifyOnNewInvestmentInterest' => true
        ];
        $insertSettings = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by)
            VALUES (1, :json, 'MD Admin')
        ");
        $insertSettings->execute([
            ':json' => json_encode($defaultSettings, JSON_UNESCAPED_UNICODE)
        ]);
        echo "Platform default settings seeded.\n";
    }

    // 3. Seed Seed Data from JSON
    $jsonFile = __DIR__ . '/seed_data.json';
    if (file_exists($jsonFile)) {
        $data = json_decode(file_get_contents($jsonFile), true);

        // Stocks
        if (!empty($data['stocks'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM stocks");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertStock = $db->prepare("
                    INSERT INTO stocks (
                        id, slug, product_name, bangla_name, category, status, quantity, unit,
                        location, district, division, grade, harvest_date, packaging, minimum_order,
                        price, price_type, description, images, specifications, origin_details, logistics, featured
                    ) VALUES (
                        :id, :slug, :product_name, :bangla_name, :category, :status, :quantity, :unit,
                        :location, :district, :division, :grade, :harvest_date, :packaging, :minimum_order,
                        :price, :price_type, :description, :images, :specifications, :origin_details, :logistics, :featured
                    )
                ");

                foreach ($data['stocks'] as $s) {
                    $insertStock->execute([
                        ':id' => $s['id'],
                        ':slug' => $s['slug'],
                        ':product_name' => $s['productName'],
                        ':bangla_name' => $s['banglaName'],
                        ':category' => $s['category'],
                        ':status' => $s['status'],
                        ':quantity' => $s['quantity'],
                        ':unit' => $s['unit'],
                        ':location' => $s['location'],
                        ':district' => $s['district'],
                        ':division' => $s['division'],
                        ':grade' => $s['grade'],
                        ':harvest_date' => $s['harvestDate'] ?? ($s['availabilityDate'] ?? null),
                        ':packaging' => $s['packaging'],
                        ':minimum_order' => $s['minimumOrder'] ?? 50,
                        ':price' => $s['price'],
                        ':price_type' => $s['priceType'] ?? 'fixed',
                        ':description' => $s['description'],
                        ':images' => json_encode($s['images'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':specifications' => json_encode($s['specifications'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':origin_details' => json_encode($s['originDetails'] ?? null, JSON_UNESCAPED_UNICODE),
                        ':logistics' => json_encode($s['logistics'] ?? null, JSON_UNESCAPED_UNICODE),
                        ':featured' => !empty($s['featured']) ? 1 : 0
                    ]);
                }
                echo "Seeded " . count($data['stocks']) . " fish stocks.\n";
            }
        }

        // Investments
        if (!empty($data['investments'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM investments");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertInv = $db->prepare("
                    INSERT INTO investments (
                        id, slug, stock_id, title, product_name, category, location,
                        required_capital, raised_capital, minimum_investment, profit_percentage,
                        duration_days, start_date, settlement_date, status, description,
                        procurement_plan, timeline, risks, security_and_compliance, images, investor_count
                    ) VALUES (
                        :id, :slug, :stock_id, :title, :product_name, :category, :location,
                        :required_capital, :raised_capital, :minimum_investment, :profit_percentage,
                        :duration_days, :start_date, :settlement_date, :status, :description,
                        :procurement_plan, :timeline, :risks, :security_and_compliance, :images, :investor_count
                    )
                ");

                foreach ($data['investments'] as $inv) {
                    $insertInv->execute([
                        ':id' => $inv['id'],
                        ':slug' => $inv['slug'],
                        ':stock_id' => $inv['stockId'] ?? null,
                        ':title' => $inv['title'],
                        ':product_name' => $inv['productName'],
                        ':category' => $inv['category'],
                        ':location' => $inv['location'],
                        ':required_capital' => $inv['requiredCapital'],
                        ':raised_capital' => $inv['raisedCapital'],
                        ':minimum_investment' => $inv['minimumInvestment'],
                        ':profit_percentage' => $inv['profitPercentage'],
                        ':duration_days' => $inv['durationDays'],
                        ':start_date' => $inv['startDate'] ?? null,
                        ':settlement_date' => $inv['settlementDate'] ?? null,
                        ':status' => $inv['status'],
                        ':description' => $inv['description'],
                        ':procurement_plan' => json_encode($inv['procurementPlan'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':timeline' => json_encode($inv['timeline'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':risks' => json_encode($inv['risks'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':security_and_compliance' => json_encode($inv['securityAndCompliance'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':images' => json_encode($inv['images'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':investor_count' => $inv['investorCount'] ?? 0
                    ]);
                }
                echo "Seeded " . count($data['investments']) . " investment projects.\n";
            }
        }

        // Blog Posts
        if (!empty($data['blogPosts'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM blog_posts");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertBlog = $db->prepare("
                    INSERT INTO blog_posts (
                        slug, title, excerpt, content, category, featured_image, image_alt,
                        author, published_at, reading_time, seo_title, seo_description, keywords, featured
                    ) VALUES (
                        :slug, :title, :excerpt, :content, :category, :featured_image, :image_alt,
                        :author, :published_at, :reading_time, :seo_title, :seo_description, :keywords, :featured
                    )
                ");

                foreach ($data['blogPosts'] as $bp) {
                    $insertBlog->execute([
                        ':slug' => $bp['slug'],
                        ':title' => $bp['title'],
                        ':excerpt' => $bp['excerpt'],
                        ':content' => $bp['content'],
                        ':category' => $bp['category'],
                        ':featured_image' => $bp['featuredImage'] ?? null,
                        ':image_alt' => $bp['imageAlt'] ?? null,
                        ':author' => $bp['author'] ?? 'Gangchill Editorial Team',
                        ':published_at' => $bp['publishedAt'] ?? date('Y-m-d'),
                        ':reading_time' => $bp['readingTime'] ?? '৫ মিনিট পড়া',
                        ':seo_title' => $bp['seoTitle'] ?? null,
                        ':seo_description' => $bp['seoDescription'] ?? null,
                        ':keywords' => json_encode($bp['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':featured' => !empty($bp['featured']) ? 1 : 0
                    ]);
                }
                echo "Seeded " . count($data['blogPosts']) . " blog posts.\n";
            }
        }
    }

    // 4. Seed Initial Buyer Orders
    $stmt = $db->prepare("SELECT COUNT(*) FROM buyer_orders");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertOrder = $db->prepare("
            INSERT INTO buyer_orders (
                id, company_name, contact_person, phone, email, product_name, quantity, unit,
                required_date, delivery_location, specification, notes, status, order_status,
                quoted_price_per_unit, total_estimated_value, assigned_staff, status_history, internal_notes
            ) VALUES (
                :id, :company_name, :contact_person, :phone, :email, :product_name, :quantity, :unit,
                :required_date, :delivery_location, :specification, :notes, :status, :order_status,
                :quoted_price_per_unit, :total_estimated_value, :assigned_staff, :status_history, :internal_notes
            )
        ");

        $demoOrders = [
            [
                'id' => 'REQ-1726001001',
                'company_name' => 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)',
                'contact_person' => 'তানভীর আহমেদ',
                'phone' => '01711-223344',
                'email' => 'procurement@unimart.com.bd',
                'product_name' => 'চাঁদপুরের পদ্মার রূপালী ইলিশ',
                'quantity' => 350,
                'unit' => 'কেজি (KG)',
                'required_date' => '2026-09-20',
                'delivery_location' => 'গুলশান ২, ঢাকা',
                'specification' => '১ কেজি+ সাইজ গ্রেড, তাজা বরফ প্যাক, নো ফরমালিন সার্টিফিকেট আবশ্যক',
                'notes' => 'সকাল ৮টার মধ্যে আনলোড নিশ্চিত করতে হবে',
                'status' => 'pending',
                'order_status' => 'under_review',
                'quoted_price_per_unit' => 1620,
                'total_estimated_value' => 567000,
                'assigned_staff' => 'MD Admin',
                'status_history' => [
                    ['status' => 'pending', 'timestamp' => '2026-09-14T08:30:00Z', 'updatedBy' => 'সিস্টেম (ওয়েব ফর্ম)', 'note' => 'ক্রেতা কর্তৃক চাহিদাপত্র জমা'],
                    ['status' => 'under_review', 'timestamp' => '2026-09-14T10:15:00Z', 'updatedBy' => 'MD Admin', 'note' => 'চাঁদপুর বড়স্টেশন ঘাটে লট বরাদ্দ যাচাই চলছে']
                ],
                'internal_notes' => []
            ],
            [
                'id' => 'REQ-1726001002',
                'company_name' => 'রেডিসন ব্লু ঢাকা ওয়াটার গার্ডেন',
                'contact_person' => 'শেফ মাহবুবুল আলম',
                'phone' => '01819-887766',
                'email' => 'executive.chef@radissondhaka.com',
                'product_name' => 'খুলনা ও সাতক্ষীরার বাগদা চিংড়ি',
                'quantity' => 150,
                'unit' => 'কেজি (KG)',
                'required_date' => '2026-09-18',
                'delivery_location' => 'বিমানবন্দর রোড, ঢাকা',
                'specification' => '১৬/২০ কাউন্ট এক্সপোর্ট গ্রেড, হেড-অন শেল-অন (HOSO), সম্পূর্ণ ফ্রেশ',
                'notes' => 'রেফার ভ্যানে তাপমাত্রা -২° সে.-এ রাখা দরকার',
                'status' => 'reviewed',
                'order_status' => 'confirmed',
                'quoted_price_per_unit' => 980,
                'total_estimated_value' => 147000,
                'assigned_staff' => 'MD Admin',
                'status_history' => [
                    ['status' => 'pending', 'timestamp' => '2026-09-13T14:20:00Z', 'updatedBy' => 'সিস্টেম'],
                    ['status' => 'confirmed', 'timestamp' => '2026-09-14T11:00:00Z', 'updatedBy' => 'MD Admin', 'note' => 'অফিশিয়াল পারচেজ অর্ডার কনফার্মড']
                ],
                'internal_notes' => []
            ]
        ];

        foreach ($demoOrders as $ord) {
            $insertOrder->execute([
                ':id' => $ord['id'],
                ':company_name' => $ord['company_name'],
                ':contact_person' => $ord['contact_person'],
                ':phone' => $ord['phone'],
                ':email' => $ord['email'],
                ':product_name' => $ord['product_name'],
                ':quantity' => $ord['quantity'],
                ':unit' => $ord['unit'],
                ':required_date' => $ord['required_date'],
                ':delivery_location' => $ord['delivery_location'],
                ':specification' => $ord['specification'],
                ':notes' => $ord['notes'],
                ':status' => $ord['status'],
                ':order_status' => $ord['order_status'],
                ':quoted_price_per_unit' => $ord['quoted_price_per_unit'],
                ':total_estimated_value' => $ord['total_estimated_value'],
                ':assigned_staff' => $ord['assigned_staff'],
                ':status_history' => json_encode($ord['status_history'], JSON_UNESCAPED_UNICODE),
                ':internal_notes' => json_encode($ord['internal_notes'], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo "Seeded demo buyer orders.\n";
    }

    // 5. Seed Initial Seller Lots
    $stmt = $db->prepare("SELECT COUNT(*) FROM seller_lots");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertLot = $db->prepare("
            INSERT INTO seller_lots (
                id, farmer_name, phone, district, product_name, stock_type, quantity, unit,
                location, availability_date, expected_price, description, images, status,
                verification_status, field_inspector_name, inspection_notes, approved_wholesale_price
            ) VALUES (
                :id, :farmer_name, :phone, :district, :product_name, :stock_type, :quantity, :unit,
                :location, :availability_date, :expected_price, :description, :images, :status,
                :verification_status, :field_inspector_name, :inspection_notes, :approved_wholesale_price
            )
        ");

        $demoLots = [
            [
                'id' => 'LOT-1726002001',
                'farmer_name' => 'মো: মোশাররফ হোসেন',
                'phone' => '01715-998877',
                'district' => 'চাঁদপুর',
                'product_name' => 'পদ্মার রূপালী ইলিশ (তাজা লট)',
                'stock_type' => 'current',
                'quantity' => 850,
                'unit' => 'কেজি (KG)',
                'location' => 'বড়স্টেশন মোহনা ঘাট, চাঁদপুর',
                'availability_date' => 'আজ ভোরের আহরণ',
                'expected_price' => 1550,
                'description' => 'মেঘনা-পদ্মার সঙ্গমস্থল থেকে আহরিত খাঁটি চকচকে ইলিশ। সরাসরি বরফ প্যাকেজে রেডি।',
                'images' => ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
                'status' => 'submitted',
                'verification_status' => 'verified',
                'field_inspector_name' => 'MD Admin',
                'inspection_notes' => 'ঘাট পয়েন্টে কোয়ালিটি অডিট সফল। কোনো ফরমালিনের অস্তিত্ব পাওয়া যায়নি।',
                'approved_wholesale_price' => 1550
            ],
            [
                'id' => 'LOT-1726002002',
                'farmer_name' => 'হাজী সামসুল হক (ট্রলার মালিক)',
                'phone' => '01814-332211',
                'district' => 'কক্সবাজার',
                'product_name' => 'সাদা রূপচাঁদা ও ব্ল্যাক পমফ্রেট',
                'stock_type' => 'upcoming',
                'quantity' => 1200,
                'unit' => 'কেজি (KG)',
                'location' => 'ফিশারি ঘাট টার্মিনাল, কক্সবাজার',
                'availability_date' => 'আগামী পরশু সকাল',
                'expected_price' => 1100,
                'description' => 'বঙ্গোপসাগরের গভীর জলের ট্রলার আহরণ। ৩০০-৪০০ গ্রাম ওজনের প্রতিটি চাঁদা মাছ।',
                'images' => ['https://images.unsplash.com/photo-1534943441045-1089b75eb353?auto=format&fit=crop&w=800&q=80'],
                'status' => 'submitted',
                'verification_status' => 'pending',
                'field_inspector_name' => null,
                'inspection_notes' => 'ট্রলার ঘাটে ভিড়ার পর ফিজিক্যাল ইন্সপেকশন সম্পন্ন হবে।',
                'approved_wholesale_price' => null
            ]
        ];

        foreach ($demoLots as $lot) {
            $insertLot->execute([
                ':id' => $lot['id'],
                ':farmer_name' => $lot['farmer_name'],
                ':phone' => $lot['phone'],
                ':district' => $lot['district'],
                ':product_name' => $lot['product_name'],
                ':stock_type' => $lot['stock_type'],
                ':quantity' => $lot['quantity'],
                ':unit' => $lot['unit'],
                ':location' => $lot['location'],
                ':availability_date' => $lot['availability_date'],
                ':expected_price' => $lot['expected_price'],
                ':description' => $lot['description'],
                ':images' => json_encode($lot['images'], JSON_UNESCAPED_UNICODE),
                ':status' => $lot['status'],
                ':verification_status' => $lot['verification_status'],
                ':field_inspector_name' => $lot['field_inspector_name'],
                ':inspection_notes' => $lot['inspection_notes'],
                ':approved_wholesale_price' => $lot['approved_wholesale_price']
            ]);
        }
        echo "Seeded demo seller lots.\n";
    }

    // 6. Seed Customers & Suppliers
    $stmt = $db->prepare("SELECT COUNT(*) FROM customers");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertCust = $db->prepare("
            INSERT INTO customers (
                id, company_name, business_type, contact_person, phone, email, delivery_location,
                tier, total_orders_count, total_volume_kg, total_order_value, last_order_date, preferred_fish
            ) VALUES (
                :id, :company_name, :business_type, :contact_person, :phone, :email, :delivery_location,
                :tier, :total_orders_count, :total_volume_kg, :total_order_value, :last_order_date, :preferred_fish
            )
        ");
        $insertCust->execute([
            ':id' => 'CUST-001',
            ':company_name' => 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)',
            ':business_type' => 'সুপারশপ চেইন',
            ':contact_person' => 'তানভীর আহমেদ',
            ':phone' => '01711-223344',
            ':email' => 'procurement@unimart.com.bd',
            ':delivery_location' => 'গুলশান ২, ঢাকা',
            ':tier' => 'VIP',
            ':total_orders_count' => 8,
            ':total_volume_kg' => 2850,
            ':total_order_value' => 4617000,
            ':last_order_date' => '2026-09-14',
            ':preferred_fish' => json_encode(['পদ্মার রূপালী ইলিশ', 'চলনবিলের পাবদা', 'গলদা চিংড়ি'], JSON_UNESCAPED_UNICODE)
        ]);
        echo "Seeded customer demo.\n";
    }

    $stmt = $db->prepare("SELECT COUNT(*) FROM suppliers");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertSup = $db->prepare("
            INSERT INTO suppliers (
                id, farmer_name, type, phone, district, location,
                verification_badge, total_lots_count, total_volume_kg, quality_rating, primary_species, joined_date
            ) VALUES (
                :id, :farmer_name, :type, :phone, :district, :location,
                :verification_badge, :total_lots_count, :total_volume_kg, :quality_rating, :primary_species, :joined_date
            )
        ");
        $insertSup->execute([
            ':id' => 'SUP-001',
            ':farmer_name' => 'মো: মোশাররফ হোসেন (জেলে সমবায়)',
            ':type' => 'জেলে সমবায়',
            ':phone' => '01715-998877',
            ':district' => 'চাঁদপুর',
            ':location' => 'বড়স্টেশন মোহনা ঘাট',
            ':verification_badge' => 'verified',
            ':total_lots_count' => 14,
            ':total_volume_kg' => 8500,
            ':quality_rating' => 4.9,
            ':primary_species' => json_encode(['পদ্মার রূপালী ইলিশ', 'মেঘনার পাঙ্গাশ', 'তপসে'], JSON_UNESCAPED_UNICODE),
            ':joined_date' => '2025-11-10'
        ]);
        echo "Seeded supplier demo.\n";
    }

    echo "ALL DATABASE MIGRATION & SEEDING FINISHED SUCCESSFULLY!\n";
} catch (Exception $e) {
    echo "Error in init.php: " . $e->getMessage() . "\n";
    exit(1);
}
