import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Dados iniciais do catálogo da AllAtiva Joias — peças de exemplo
 * organizadas por categoria para demonstração do sistema.
 */
const seedData = [
  {
    name: "Anéis",
    slug: "aneis",
    order: 1,
    products: [
      {
        title: "Anel Solitário Ouro 18k",
        description: "Ouro amarelo 18k com diamante de 20 pontos.",
        price: 4890.0,
        imageUrl:
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Aliança Ouro Branco",
        description: "Par de alianças em ouro branco 18k, acabamento fosco.",
        price: 5760.0,
        imageUrl:
          "https://images.unsplash.com/photo-1595781572981-d63151b232ed?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Anel Meia Aliança",
        description: "Ouro 18k cravejado com zircônias em fileira.",
        price: 2350.0,
        imageUrl:
          "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    name: "Colares",
    slug: "colares",
    order: 2,
    products: [
      {
        title: "Colar Ponto de Luz",
        description: "Corrente veneziana em ouro 18k com pingente de diamante.",
        price: 3120.0,
        imageUrl:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Gargantilha de Prata 925",
        description: "Prata 925 com banho de ródio e pingente coração.",
        price: 480.0,
        imageUrl:
          "https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Colar Pérola Cultivada",
        description: "Fio de pérolas cultivadas com fecho em ouro 18k.",
        price: 2790.0,
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    name: "Brincos",
    slug: "brincos",
    order: 3,
    products: [
      {
        title: "Brinco Argola Ouro 18k",
        description: "Par de argolas em ouro 18k, tubo abaulado.",
        price: 2180.0,
        imageUrl:
          "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Brinco Solitário Zircônia",
        description: "Prata 925 com banho de ródio e zircônia cristal.",
        price: 320.0,
        imageUrl:
          "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    name: "Pulseiras",
    slug: "pulseiras",
    order: 4,
    products: [
      {
        title: "Pulseira Riviera",
        description: "Ouro branco 18k cravejado com zircônias em toda a volta.",
        price: 6420.0,
        imageUrl:
          "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Bracelete Prata 925",
        description: "Prata 925 maciça com acabamento polido.",
        price: 690.0,
        imageUrl:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    name: "Relógios",
    slug: "relogios",
    order: 5,
    products: [
      {
        title: "Relógio Clássico Aço",
        description: "Caixa em aço inoxidável, pulseira malha milanesa.",
        price: 1890.0,
        imageUrl:
          "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80",
      },
      {
        title: "Relógio Dourado Feminino",
        description: "Caixa banhada a ouro com mostrador madrepérola.",
        price: 2260.0,
        imageUrl:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Limpando dados existentes...");
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log("🌱 Populando categorias e peças...");
  for (const category of seedData) {
    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        order: category.order,
        products: {
          create: category.products.map((product) => ({
            title: product.title,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            isAvailable: true,
          })),
        },
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
