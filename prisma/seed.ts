/**
 * Seed script — popula o banco com dados de exemplo realistas.
 * Executar com: bun run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // ─── LIMPEZA ─────────────────────────────────────────────────────────
  console.log("  Limpando dados antigos...");
  await db.sessao.deleteMany();
  await db.pagamento.deleteMany();
  await db.itemPedido.deleteMany();
  await db.avaliacao.deleteMany();
  await db.pedido.deleteMany();
  await db.cupom.deleteMany();
  await db.cartao.deleteMany();
  await db.endereco.deleteMany();
  await db.produto.deleteMany();
  await db.restaurante.deleteMany();
  await db.entregador.deleteMany();
  await db.cliente.deleteMany();
  await db.usuario.deleteMany();

  // ─── USUÁRIOS BASE ───────────────────────────────────────────────────
  console.log("  Criando usuários...");

  // 1 Admin
  const adminUser = await db.usuario.create({
    data: {
      nome: "Admin Sistema",
      email: "admin@fooddelivery.com",
      telefone: "(11) 4000-0000",
      senhaHash: await hashSenha("admin123"),
      tipoUsuario: "ADMIN",
    },
  });

  // 1 Cliente (Maria Santos - mesma do PDF)
  const clienteUser = await db.usuario.create({
    data: {
      nome: "Maria Santos",
      email: "maria@gmail.com",
      telefone: "(11) 98765-4321",
      senhaHash: await hashSenha("cliente123"),
      avatarUrl: "https://i.pravatar.cc/150?img=47",
      tipoUsuario: "CLIENTE",
    },
  });
  const cliente = await db.cliente.create({
    data: {
      usuarioId: clienteUser.id,
      avaliacaoMedia: 4.9,
      enderecos: {
        create: [
          {
            apelido: "Casa",
            rua: "Rua das Flores",
            numero: "123",
            complemento: "Apto 45",
            bairro: "Jardim Primavera",
            cidade: "São Paulo",
            estado: "SP",
            cep: "01234-567",
            latitude: -23.5613,
            longitude: -46.6565,
          },
          {
            apelido: "Trabalho",
            rua: "Av. Paulista",
            numero: "456",
            complemento: "Sala 1201",
            bairro: "Bela Vista",
            cidade: "São Paulo",
            estado: "SP",
            cep: "01310-100",
            latitude: -23.561414,
            longitude: -46.655881,
          },
        ],
      },
      cartoes: {
        create: [
          {
            bandeira: "VISA",
            ultimos4: "4321",
            token: "tok_visa_4321",
            validade: "08/27",
            principal: true,
          },
        ],
      },
    },
  });

  // 2 Entregadores
  const joaoUser = await db.usuario.create({
    data: {
      nome: "João Pereira",
      email: "joao@entregador.com",
      telefone: "(11) 91234-5678",
      senhaHash: await hashSenha("entregador123"),
      avatarUrl: "https://i.pravatar.cc/150?img=12",
      tipoUsuario: "ENTREGADOR",
    },
  });
  const entregador1 = await db.entregador.create({
    data: {
      usuarioId: joaoUser.id,
      cnh: "12345678900",
      veiculo: "Moto Honda CG 160",
      disponivel: true,
      avaliacaoMedia: 4.8,
    },
  });

  const anaUser = await db.usuario.create({
    data: {
      nome: "Ana Souza",
      email: "ana@entregador.com",
      telefone: "(11) 99876-5432",
      senhaHash: await hashSenha("entregador123"),
      avatarUrl: "https://i.pravatar.cc/150?img=23",
      tipoUsuario: "ENTREGADOR",
    },
  });
  const entregador2 = await db.entregador.create({
    data: {
      usuarioId: anaUser.id,
      cnh: "98765432100",
      veiculo: "Moto Yamaha Factor",
      disponivel: true,
      avaliacaoMedia: 4.9,
    },
  });

  // ─── RESTAURANTES + PRODUTOS ─────────────────────────────────────────
  console.log("  Criando restaurantes e produtos...");

  const restaurantesData = [
    {
      nome: "Burguer House",
      cnpj: "12.345.678/0001-90",
      descricao: "Hambúrgueres artesanais com carne nobre e ingredientes selecionados",
      endereco: "Rua dos Pinheiros, 1500 - Pinheiros, São Paulo",
      telefone: "(11) 3030-1000",
      avaliacaoMedia: 4.8,
      tempoEntrega: 30,
      taxaEntrega: 7.90,
      comissao: 0.12,
      aberto: true,
      categoria: "Hambúrgueres",
      imagemUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
      produtos: [
        { nome: "X-Burger Especial", descricao: "Pão brioche, blend 180g, cheddar, bacon, alface, tomate e molho da casa", preco: 25.90, categoria: "Hambúrgueres", tempoPreparo: 15, imagemUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
        { nome: "X-Salada Duplo", descricao: "Dois blends 120g, queijo, alface, tomate e cebola roxa", preco: 28.50, categoria: "Hambúrgueres", tempoPreparo: 18, imagemUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
        { nome: "X-Bacon Costela", descricao: "Blend 200g, bacon defumado, cheddar inglês e cebola caramelizada", preco: 32.00, categoria: "Hambúrgueres", tempoPreparo: 20, imagemUrl: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400" },
        { nome: "Batata Rústica", descricao: "Batatas rústicas com alecrim e parmesão (400g)", preco: 18.90, categoria: "Acompanhamentos", tempoPreparo: 12, imagemUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
        { nome: "Onion Rings", descricao: "Anéis de cebola empanados com molho barbecue (300g)", preco: 16.50, categoria: "Acompanhamentos", tempoPreparo: 10, imagemUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400" },
        { nome: "Milkshake Chocolate", descricao: "Milkshake cremoso de chocolate belga (400ml)", preco: 14.00, categoria: "Bebidas", tempoPreparo: 5, imagemUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
      ],
    },
    {
      nome: "Pizzaria Bella Italia",
      cnpj: "23.456.789/0001-01",
      descricao: "Pizzas artesanais no forno a lenha com massa de fermentação natural",
      endereco: "Rua Augusta, 2200 - Consolação, São Paulo",
      telefone: "(11) 3030-2000",
      avaliacaoMedia: 4.7,
      tempoEntrega: 45,
      taxaEntrega: 9.90,
      comissao: 0.13,
      aberto: true,
      categoria: "Pizzas",
      imagemUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      produtos: [
        { nome: "Pizza Margherita", descricao: "Molho de tomate San Marzano, mozzarella de búfala, manjericão fresco e azeite extra virgem", preco: 42.00, categoria: "Pizzas", tempoPreparo: 25, imagemUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400" },
        { nome: "Pizza Calabresa", descricao: "Molho, mozzarella, calabresa artesanal, cebola e orégano", preco: 45.00, categoria: "Pizzas", tempoPreparo: 25, imagemUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
        { nome: "Pizza Quatro Queijos", descricao: "Mozzarella, gorgonzola, parmesão e provolone", preco: 48.00, categoria: "Pizzas", tempoPreparo: 25, imagemUrl: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400" },
        { nome: "Pizza Portuguesa", descricao: "Molho, mozzarella, presunto, ovos, cebola, ervilha e azeitonas", preco: 47.00, categoria: "Pizzas", tempoPreparo: 28, imagemUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400" },
        { nome: "Bruschetta Caprese", descricao: "Pão italiano, mozzarella, tomate, manjericão e azeite (4 unidades)", preco: 22.50, categoria: "Entradas", tempoPreparo: 10, imagemUrl: "https://images.unsplash.com/photo-1572695157366-5e585ae2c4ae?w=400" },
        { nome: "Vinho Tinto da Casa", descricao: "Taça de vinho tinto Malbec (200ml)", preco: 18.00, categoria: "Bebidas", tempoPreparo: 2, imagemUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" },
      ],
    },
    {
      nome: "Sushi Yamato",
      cnpj: "34.567.890/0001-12",
      descricao: "Culinária japonesa tradicional com peixes frescos importados diariamente",
      endereco: "Rua dos Japoneses, 350 - Liberdade, São Paulo",
      telefone: "(11) 3030-3000",
      avaliacaoMedia: 4.9,
      tempoEntrega: 40,
      taxaEntrega: 8.90,
      comissao: 0.14,
      aberto: true,
      categoria: "Japonesa",
      imagemUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
      produtos: [
        { nome: "Combo 30 Peças", descricao: "10 nigiris, 12 sashimis e 8 uramakis variados", preco: 89.90, categoria: "Combos", tempoPreparo: 30, imagemUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400" },
        { nome: "Uramaki Filadélfia", descricao: "8 peças com salmão, cream cheese e cebolinha", preco: 32.00, categoria: "Uramakis", tempoPreparo: 15, imagemUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400" },
        { nome: "Nigiri Salmão", descricao: "5 peças de nigiri com salmão fresco", preco: 28.00, categoria: "Nigiris", tempoPreparo: 12, imagemUrl: "https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=400" },
        { nome: "Sashimi Atum", descricao: "10 fatias de sashimi de atum vermelho", preco: 38.00, categoria: "Sashimis", tempoPreparo: 12, imagemUrl: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400" },
        { nome: "Temaki Especial", descricao: "Cone de salmão, cream cheese e cebolinha", preco: 24.00, categoria: "Temakis", tempoPreparo: 10, imagemUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400" },
        { nome: "Sake Quente", descricao: "Garrafa de saquê quente (300ml)", preco: 20.00, categoria: "Bebidas", tempoPreparo: 3, imagemUrl: "https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400" },
      ],
    },
    {
      nome: "Taco Loco Mexicano",
      cnpj: "45.678.901/0001-23",
      descricao: "Autêntica culinária mexicana com tacos, burritos e nachos",
      endereco: "Rua Haddock Lobo, 800 - Cerqueira César, São Paulo",
      telefone: "(11) 3030-4000",
      avaliacaoMedia: 4.6,
      tempoEntrega: 35,
      taxaEntrega: 6.90,
      comissao: 0.11,
      aberto: true,
      categoria: "Mexicana",
      imagemUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
      produtos: [
        { nome: "Tacos al Pastor (3un)", descricao: "Tacos de porco marinado com abacaxi, cebola e coentro", preco: 26.00, categoria: "Tacos", tempoPreparo: 15, imagemUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400" },
        { nome: "Burrito Carne", descricao: "Tortilla grande com carne, arroz, feijão, queijo e guacamole", preco: 32.00, categoria: "Burritos", tempoPreparo: 18, imagemUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400" },
        { nome: "Quesadilla Frango", descricao: "Tortilla recheada com frango, queijo e pimentões", preco: 28.50, categoria: "Quesadillas", tempoPreparo: 14, imagemUrl: "https://images.unsplash.com/photo-1618040996337-11a35e36c1f0?w=400" },
        { nome: "Nachos Supremo", descricao: "Tortilla chips com queijo, guacamole, pico de galo e jalapeños", preco: 24.00, categoria: "Entradas", tempoPreparo: 10, imagemUrl: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400" },
        { nome: "Margarita", descricao: "Drink margarita clássico com tequila e limão (300ml)", preco: 19.00, categoria: "Bebidas", tempoPreparo: 5, imagemUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400" },
      ],
    },
    {
      nome: "Cantina Italiana La Nonna",
      cnpj: "56.789.012/0001-34",
      descricao: "Massas frescas feitas à mão e molhos tradicionais italianos",
      endereco: "Rua Oscar Freire, 1200 - Jardins, São Paulo",
      telefone: "(11) 3030-5000",
      avaliacaoMedia: 4.8,
      tempoEntrega: 50,
      taxaEntrega: 10.90,
      comissao: 0.13,
      aberto: false,
      categoria: "Italiana",
      imagemUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400",
      produtos: [
        { nome: "Spaghetti Carbonara", descricao: "Massa fresca com bacon, ovos, parmesão e pimenta-do-reino", preco: 38.00, categoria: "Massas", tempoPreparo: 22, imagemUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400" },
        { nome: "Lasanha à Bolonhesa", descricao: "Camadas de massa, molho bolonhesa, presunto e queijo", preco: 42.00, categoria: "Massas", tempoPreparo: 30, imagemUrl: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400" },
        { nome: "Fettuccine Alfredo", descricao: "Massa fresca com molho cremoso de parmesão e manteiga", preco: 36.00, categoria: "Massas", tempoPreparo: 20, imagemUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400" },
        { nome: "Risotto Funghi", descricao: "Risoto de arroz arbóreo com cogumelos funghi e parmesão", preco: 44.00, categoria: "Risottos", tempoPreparo: 28, imagemUrl: "https://images.unsplash.com/photo-1633964913849-96bb09cfc0f8?w=400" },
        { nome: "Tiramisù", descricao: "Sobremesa italiana com café, mascarpone e cacau", preco: 18.00, categoria: "Sobremesas", tempoPreparo: 5, imagemUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" },
      ],
    },
    {
      nome: "Açaí Tropical",
      cnpj: "67.890.123/0001-45",
      descricao: "Açaí cremoso natural da Amazônia com complementos frescos",
      endereco: "Rua Teodoro Sampaio, 600 - Pinheiros, São Paulo",
      telefone: "(11) 3030-6000",
      avaliacaoMedia: 4.7,
      tempoEntrega: 25,
      taxaEntrega: 5.90,
      comissao: 0.10,
      aberto: true,
      categoria: "Saudável",
      imagemUrl: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400",
      produtos: [
        { nome: "Açaí 500ml Completo", descricao: "Açaí cremoso com granola, banana, leite condensado e morango", preco: 22.00, categoria: "Açaí", tempoPreparo: 8, imagemUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400" },
        { nome: "Açaí 300ml Simples", descricao: "Açaí cremoso com granola", preco: 14.00, categoria: "Açaí", tempoPreparo: 5, imagemUrl: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400" },
        { nome: "Smoothie Tropical", descricao: "Smoothie de manga, maracujá e açaí (400ml)", preco: 16.50, categoria: "Smoothies", tempoPreparo: 6, imagemUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400" },
        { nome: "Tigela de Frutas", descricao: "Iogurte, granola, frutas vermelhas e mel", preco: 18.00, categoria: "Saudável", tempoPreparo: 7, imagemUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400" },
      ],
    },
  ];

  // Cria um usuário dono para cada restaurante (apenas para o Burguer House para simplicidade)
  const senhaHashRestaurante = await hashSenha("restaurante123");
  const burguerHouseOwner = await db.usuario.create({
    data: {
      nome: "Carlos Burger",
      email: "burguer@house.com",
      telefone: "(11) 3030-1001",
      senhaHash: senhaHashRestaurante,
      avatarUrl: "https://i.pravatar.cc/150?img=33",
      tipoUsuario: "RESTAURANTE",
    },
  });
  console.log(`    ✓ Usuário dono: ${burguerHouseOwner.email} (senha: restaurante123)`);

  for (const r of restaurantesData) {
    const { produtos, ...restauranteData } = r;
    // Apenas Burguer House tem dono vinculado (para teste de login)
    const usuarioId = r.nome === "Burguer House" ? burguerHouseOwner.id : null;
    const restaurante = await db.restaurante.create({
      data: {
        ...restauranteData,
        usuarioId,
        produtos: {
          create: produtos,
        },
      },
    });
    console.log(`    ✓ ${restaurante.nome} (${produtos.length} produtos)`);
  }

  // ─── CUPONS ─────────────────────────────────────────────────────────
  console.log("  Criando cupons...");
  const restaurante1 = await db.restaurante.findFirst({ where: { nome: "Burguer House" } });

  await db.cupom.createMany({
    data: [
      {
        restauranteId: restaurante1?.id,
        codigo: "BEMVINDO10",
        descontoPercentual: 10,
        tipo: "PERCENTUAL",
        validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usosMaximos: 1000,
        usosAtuais: 0,
        ativo: true,
      },
      {
        restauranteId: null,
        codigo: "FRETE10",
        descontoFixo: 10,
        tipo: "FRETE_GRATIS",
        validade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        usosMaximos: 500,
        usosAtuais: 12,
        ativo: true,
      },
      {
        restauranteId: null,
        codigo: "FOOD15",
        descontoPercentual: 15,
        tipo: "PERCENTUAL",
        validade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usosMaximos: 200,
        usosAtuais: 35,
        ativo: true,
      },
    ],
  });

  // ─── PEDIDO EXEMPLO (snapshot do PDF — Pedido #1001) ─────────────────
  console.log("  Criando pedido de exemplo (Maria Santos → Burguer House)...");
  const burguerHouse = await db.restaurante.findFirst({ where: { nome: "Burguer House" } });
  const xburger = await db.produto.findFirst({ where: { nome: "X-Burger Especial" } });

  if (burguerHouse && xburger && restaurante1) {
    const pedido = await db.pedido.create({
      data: {
        clienteId: cliente.id,
        restauranteId: burguerHouse.id,
        entregadorId: entregador1.id,
        dataHora: new Date(),
        status: "EM_PREPARACAO",
        valorTotal: 89.90,
        valorFrete: 7.90,
        valorDesconto: 0,
        formaPagamento: "PIX",
        enderecoEntrega: "Rua das Flores, 123 - Apto 45, Jardim Primavera, São Paulo",
        codigoRastreio: "FD-20260814-1001",
        tempoEstimado: 30,
        itens: {
          create: [
            {
              produtoId: xburger.id,
              quantidade: 2,
              precoUnitario: 25.90,
              observacoes: "Sem cebola",
              subtotal: 51.80,
            },
          ],
        },
        pagamento: {
          create: {
            valor: 89.90,
            metodo: "PIX",
            status: "APROVADO",
            transacaoId: "PIX-20260814-889",
            parcelas: 1,
          },
        },
      },
    });
    console.log(`    ✓ Pedido ${pedido.id.substring(0, 8)} criado (R$ 89,90)`);

    // Avaliação de exemplo
    await db.avaliacao.create({
      data: {
        clienteId: cliente.id,
        restauranteId: burguerHouse.id,
        pedidoId: pedido.id,
        nota: 5,
        comentario: "Hambúrguer excelente, entrega rápida e quentinha!",
        tipo: "RESTAURANTE",
      },
    });
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`   Admin:       admin@fooddelivery.com / admin123`);
  console.log(`   Cliente:     maria@gmail.com / cliente123`);
  console.log(`   Entregador:  joao@entregador.com / entregador123`);
  console.log(`   Restaurante: burguer@house.com / restaurante123`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
