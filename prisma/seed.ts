/**
 * Seed script — creates the super admin, demo restaurants, menus, staff and
 * a few sample orders so the platform is usable immediately after install.
 *
 * Run with:  npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPER_ADMIN_PASSWORD = "SmartBuzzer2026!";
const STAFF_PASSWORD = "Staff2026!";

async function main() {
  // ------------------------------------------------------------ admin
  const admin = await prisma.user.upsert({
    where: { email: "NOORALDEINSBAH@gmail.com" },
    update: {},
    create: {
      name: "نورالدين صباح حسين",
      email: "NOORALDEINSBAH@gmail.com",
      passwordHash: await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10),
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✓ super admin: ${admin.email}`);

  // ------------------------------------------------------- restaurants
  const demoRestaurants = [
    {
      slug: "rafidain",
      name: "مطعم الرافدين",
      nameEn: "Al-Rafidain Restaurant",
      tagline: "برجر وكباب عراقي على الطريقة الأصيلة",
      taglineEn: "Authentic Iraqi burgers and kebabs",
      primaryColor: "#22d3ee",
      secondaryColor: "#fbbf24",
      accentColor: "#38bdf8",
      phone: "07700028170",
      whatsapp: "9647700028170",
      address: "شارع الكرادة، بغداد",
      instagram: "@rafidain.restaurant",
      plan: "pro",
      categories: [
        {
          name: "البرجر",
          nameEn: "Burgers",
          items: [
            { name: "برجر الرافدين الخاص", nameEn: "Rafidain Special Burger", description: "لحم بقري ١٥٠ غ مع جبن شيدر", price: 18000 },
            { name: "برجر دجاج مقرمش", nameEn: "Crispy Chicken Burger", description: "صدر دجاج مقلي مع صلصة رانتش", price: 15000 },
            { name: "برجر مزدوج بالجبن", nameEn: "Double Cheese Burger", description: "قطعتا لحم مع جبن شيدر وصدر دجاج", price: 22000 },
          ],
        },
        {
          name: "المأكولات العراقية",
          nameEn: "Iraqi Dishes",
          items: [
            { name: "كباب عراقي", nameEn: "Iraqi Kebab", description: "كباب لحم مع خبز تنور وطماطم", price: 20000 },
            { name: "شاورما دجاج", nameEn: "Chicken Shawarma", description: "لحم دجاج مشوي مع ثومية", price: 12000 },
            { name: "فلافل", nameEn: "Falafel", description: "فلافل مقرمش مع خبز وطحينة", price: 8000 },
          ],
        },
        {
          name: "المشروبات",
          nameEn: "Drinks",
          items: [
            { name: "عصير برتقال طازج", nameEn: "Fresh Orange Juice", price: 6000 },
            { name: "كركديه", nameEn: "Hibiscus Tea", price: 4000 },
            { name: "آيس كوفي", nameEn: "Iced Coffee", price: 7000 },
          ],
        },
      ],
      promos: [
        {
          title: "خصم ٢٠٪ على البرجر",
          titleEn: "20% off all burgers",
          body: "العرض ساري من الأحد إلى الخميس من الساعة ١٢ ظهراً حتى ٥ مساءً.",
          bodyEn: "Valid Sunday to Thursday, 12:00 PM – 5:00 PM.",
        },
      ],
    },
    {
      slug: "nakheel",
      name: "كافيه النخيل",
      nameEn: "Al-Nakheel Cafe",
      tagline: "قهوة مختصة ومخبوزات طازجة يومياً",
      taglineEn: "Specialty coffee and fresh daily pastries",
      primaryColor: "#34d399",
      secondaryColor: "#fbbf24",
      accentColor: "#a3e635",
      phone: "07701234567",
      whatsapp: "9647701234567",
      address: "حي الجامعة، كربلاء",
      instagram: "@nakheel.cafe",
      plan: "trial",
      categories: [
        {
          name: "قهوة",
          nameEn: "Coffee",
          items: [
            { name: "إسبريسو", nameEn: "Espresso", price: 5000 },
            { name: "كابتشينو", nameEn: "Cappuccino", price: 7000 },
            { name: "لاتيه بالكراميل", nameEn: "Caramel Latte", price: 9000 },
          ],
        },
        {
          name: "مخبوزات",
          nameEn: "Pastries",
          items: [
            { name: "تشيز كيك", nameEn: "Cheesecake", price: 10000 },
            { name: "كرواسون بالزبدة", nameEn: "Butter Croissant", price: 6000 },
            { name: "كوكيز بالشوكولاتة", nameEn: "Chocolate Cookies", price: 5000 },
          ],
        },
      ],
      promos: [],
    },
    {
      slug: "furat",
      name: "مطعم الفرات",
      nameEn: "Al-Furat Restaurant",
      tagline: "أطباق عراقية أصيلة على السفرة",
      taglineEn: "Authentic Iraqi table food",
      primaryColor: "#f87171",
      secondaryColor: "#fb923c",
      accentColor: "#facc15",
      phone: "07709876543",
      address: "شارع 14 رمضان، البصرة",
      plan: "enterprise",
      categories: [
        {
          name: "الأطباق الرئيسية",
          nameEn: "Main Dishes",
          items: [
            { name: "دolly fish مقلية", nameEn: "Fried Dolly Fish", description: "سمك دولي مقرمش مع رز", price: 35000 },
            { name: "قوزي عراقي", nameEn: "Iraqi Quzi", description: "لحم غنم ودرون مع رز وباذنجان", price: 45000 },
            { name: "طاجن باذنجان", nameEn: "Eggplant Stew", description: "طاجن باذنجان باللحم والصلصة", price: 20000 },
          ],
        },
        {
          name: "سلطات",
          nameEn: "Salads",
          items: [
            { name: "سلطة فتوش", nameEn: "Fattoush Salad", price: 8000 },
            { name: "سلطة يونانية", nameEn: "Greek Salad", price: 9000 },
          ],
        },
      ],
      promos: [
        {
          title: "وجبة عائلية بـ ٥٠,٠٠٠ د.ع",
          titleEn: "Family meal for 50,000 IQD",
          body: "أربعة أطباق رئيسية مع خبز ومقبلات.",
          bodyEn: "Four main dishes with bread and appetisers.",
        },
      ],
    },
  ];

  for (const demo of demoRestaurants) {
    const existing = await prisma.tenant.findUnique({ where: { slug: demo.slug } });
    if (existing) {
      console.log(`• ${demo.slug} already exists — skipped`);
      continue;
    }

    const tenant = await prisma.tenant.create({
      data: {
        slug: demo.slug,
        name: demo.name,
        nameEn: demo.nameEn,
        tagline: demo.tagline,
        taglineEn: demo.taglineEn,
        primaryColor: demo.primaryColor,
        secondaryColor: demo.secondaryColor,
        accentColor: demo.accentColor,
        phone: demo.phone,
        whatsapp: demo.whatsapp,
        address: demo.address,
        instagram: demo.instagram,
        plan: demo.plan,
        subscriptionStatus: "active",
      },
    });

    const branch = await prisma.branch.create({
      data: { tenantId: tenant.id, name: "الفرع الرئيسي", nameEn: "Main Branch" },
    });

    for (const [categoryIndex, category] of demo.categories.entries()) {
      const created = await prisma.menuCategory.create({
        data: {
          tenantId: tenant.id,
          name: category.name,
          nameEn: category.nameEn,
          sortOrder: categoryIndex,
        },
      });

      for (const [itemIndex, item] of category.items.entries()) {
        await prisma.menuItem.create({
          data: {
            tenantId: tenant.id,
            categoryId: created.id,
            name: item.name,
            nameEn: item.nameEn,
            description: ("description" in item && typeof item.description === "string" ? item.description : null),
            descriptionEn: null,
            price: item.price,
            sortOrder: itemIndex,
          },
        });
      }
    }

    for (const [promoIndex, promo] of demo.promos.entries()) {
      await prisma.promo.create({
        data: {
          tenantId: tenant.id,
          title: promo.title,
          titleEn: promo.titleEn,
          body: promo.body,
          bodyEn: promo.bodyEn,
          sortOrder: promoIndex,
        },
      });
    }

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: `كاشير ${demo.name}`,
        email: `cashier@${demo.slug}.com`,
        passwordHash: await bcrypt.hash(STAFF_PASSWORD, 10),
        role: "CASHIER",
      },
    });

    console.log(`✓ ${demo.name} (/${demo.slug}) with ${demo.categories.length} menu categories`);
  }

  // ------------------------------------------------------ sample orders
  const rafidain = await prisma.tenant.findUnique({
    where: { slug: "rafidain" },
    include: { branches: true },
  });

  if (rafidain && rafidain.branches.length > 0) {
    const branch = rafidain.branches[0];
    const existingOrders = await prisma.order.count({ where: { tenantId: rafidain.id } });

    if (existingOrders === 0) {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Baghdad",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const samples = [
        { number: 101, status: "PREPARING", itemsNote: "برجر الرافدين الخاص، عصير برتقال", table: "5", total: 24000 },
        { number: 102, status: "READY", itemsNote: "كباب عراقي، خبز تنور", table: "2", total: 20000 },
        { number: 103, status: "PREPARING", itemsNote: "فلافل، كركديه", table: null, total: 12000 },
      ];

      for (const sample of samples) {
        const createdAt = new Date(Date.now() - Math.random() * 12 * 60 * 1000);
        const readyAt = sample.status === "READY" ? new Date(createdAt.getTime() + 9 * 60 * 1000) : null;

        await prisma.order.create({
          data: {
            tenantId: rafidain.id,
            branchId: branch.id,
            number: sample.number,
            businessDate: today,
            publicToken: crypto.randomUUID().replace(/-/g, ""),
            status: sample.status,
            tableNumber: sample.table,
            itemsNote: sample.itemsNote,
            totalAmount: sample.total,
            createdAt,
            readyAt,
            events: {
              create: {
                type: "CREATED",
                toStatus: "PREPARING",
              },
            },
          },
        });
      }

      console.log(`✓ 3 sample orders for ${rafidain.name}`);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`Super admin : NOORALDEINSBAH@gmail.com / ${SUPER_ADMIN_PASSWORD}`);
  console.log(`Staff login : cashier@rafidain.com / ${STAFF_PASSWORD}`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
