# 🏗️ Camada de Domínio - By Império Dog

## 📋 Visão Geral

Esta é a camada de domínio do marketplace de filhotes de Spitz Alemão, seguindo princípios de **Domain-Driven Design (DDD)**. Toda a lógica de negócio está centralizada aqui, garantindo:

- ✅ **Separação de responsabilidades** (domain, schema, UI)
- ✅ **Type safety** completo com TypeScript
- ✅ **Reutilização** de código entre rotas, schemas e componentes
- ✅ **Escalabilidade** para crescimento do marketplace
- ✅ **One Brand**: Todos os filhotes são "By Império Dog" aos olhos do cliente

---

## 🗂️ Estrutura

```
src/domain/
├── puppy.ts # Entidade principal Puppy + Value Objects + Helpers
├── taxonomies.ts # Taxonomias (cores, cidades, status, intenções de busca)
├── config.ts # Configurações de negócio (marca, metas, regras)
└── index.ts # Barrel exports
```

---

## 🐕 Entidade Principal: `Puppy`

### Interface Completa

```typescript
interface Puppy {
 // IDENTIFICAÇÃO
 id: string;
 slug: string; // "thor-spitz-alemao-macho-laranja"
 name: string; // "Thor"

 // CARACTERÍSTICAS FÍSICAS
 breed: "Spitz Alemão Anão" | "Lulu da Pomerânia";
 color: Color; // Enum de cores (creme, branco, laranja, etc)
 sex: "male" | "female";
 birthDate: Date;
 readyForAdoptionDate?: Date;
 
 currentWeight?: number; // kg
 expectedAdultWeight?: number; // 1.5 - 3.5 kg
 currentHeight?: number; // cm
 expectedAdultHeight?: number; // 18-22cm
 size: "toy" | "mini" | "standard";

 // COMERCIAL (BY IMPÉRIO DOG)
 title: string; // "Spitz Alemão Anão Macho Laranja - Thor"
 description: string;
 priceCents: number; // Centavos (350000 = R$ 3.500)
 currency: "BRL";
 status: PuppyStatus; // available, reserved, sold, coming-soon
 
 isHighlighted: boolean;
 isFeatured: boolean;
 isBestSeller: boolean;
 isNewArrival: boolean;
 discountPercentage?: number;
 originalPriceCents?: number;

 // LOCALIZAÇÃO E ENTREGA
 city: City; // Enum de cidades
 state: string; // UF
 availableForShipping: boolean;
 shippingCities?: City[];
 shippingNotes?: string;

 // MÍDIA E CONTEÚDO
 images: string[];
 videoUrl?: string;
 galleryImages?: string[];
 thumbnailUrl?: string;
 seoTitle?: string;
 seoDescription?: string;
 seoKeywords: string[];
 canonicalUrl?: string;

 // SAÚDE E DOCUMENTAÇÃO
 hasPedigree: boolean;
 pedigreeNumber?: string;
 pedigreeUrl?: string;
 vaccinationStatus: "up-to-date" | "partial" | "pending";
 vaccinationDates?: Date[];
 nextVaccinationDate?: Date;
 hasMicrochip: boolean;
 microchipId?: string;
 healthCertificateUrl?: string;
 healthNotes?: string;
 parentsMale?: string;
 parentsFemale?: string;
 parentsImages?: { male?: string; female?: string };

 // SOCIAL PROOF
 reviewCount: number;
 averageRating: number; // 0-5
 viewCount: number;
 favoriteCount: number;
 shareCount: number;
 inquiryCount: number;

 // CONTROLE INTERNO (NÃO EXIBIR AO PÚBLICO)
 source: PuppySource; // "own-breeding" | "external-breeder"
 internalSourceId?: string; // ID do criador externo (se aplicável)
 internalNotes?: string;
 costCents?: number;
 profitMarginPercentage?: number;

 // METADATA
 createdAt: Date;
 updatedAt: Date;
 publishedAt?: Date;
 soldAt?: Date;
 reservedAt?: Date;
 reservedBy?: string;
 reservationExpiresAt?: Date;
 createdBy?: string;
 updatedBy?: string;
}
```

---

## 💎 Value Objects

### `PuppyPrice`

Encapsula lógica de conversão centavos ↔ reais.

```typescript
// Criação
const price = PuppyPrice.fromCents(350000); // R$ 3.500,00
const price2 = PuppyPrice.fromReais(3500); // Mesmo resultado

// Conversão
price.toReais(); // 3500
price.format(); // "R$ 3.500,00"
price.format("en-US"); // "$3,500.00"

// Operações
price.applyDiscount(10); // 10% off → R$ 3.150,00
price.calculateDeposit(30); // Sinal de 30% → R$ 1.050,00
price.isInRange(200000, 500000); // true
```

### `PuppyAge`

Encapsula cálculos de idade e validações.

```typescript
const age = PuppyAge.fromDate(new Date("2024-10-01"));

// Cálculos
age.getDays(); // 60
age.getWeeks(); // 8
age.getMonths(); // 2

// Validações
age.isReadyForAdoption(8); // true (mínimo 8 semanas)
age.isPuppy(12); // true (até 12 meses é filhote)

// Formatação
age.formatAge(); // "2 meses"
age.getReadyForAdoptionDate(8); // Data em que completa 8 semanas
```

---

## 📊 DTOs (Data Transfer Objects)

### `CreatePuppyDTO`

```typescript
const newPuppy: CreatePuppyDTO = {
 name: "Thor",
 color: "laranja",
 sex: "male",
 birthDate: new Date("2024-10-01"),
 priceCents: 350000,
 city: "sao-paulo",
 state: "SP",
 title: "Spitz Alemão Anão Macho Laranja - Thor",
 description: "...",
 images: ["url1", "url2"],
 source: "own-breeding", // ou "external-breeder"
 internalSourceId: undefined, // Apenas se source = "external-breeder"
};
```

### `UpdatePuppyDTO`

```typescript
const update: UpdatePuppyDTO = {
 id: "abc123",
 status: "reserved",
 discountPercentage: 10, // Aplicar 10% de desconto
};
```

### `PuppyFilters`

```typescript
const filters: PuppyFilters = {
 status: ["available", "coming-soon"],
 colors: ["creme", "laranja"],
 sex: "male",
 cities: ["sao-paulo", "campinas"],
 minPrice: 200000,
 maxPrice: 500000,
 hasPedigree: true,
 minRating: 4.5,
 search: "thor", // Busca textual (nome, descrição)
};
```

---

## 🛠️ Helpers

### `PuppyHelpers`

```typescript
// Geração de slug
PuppyHelpers.generateSlug("Thor", "laranja", "male");
// → "thor-spitz-alemao-macho-laranja"

// Verificação de disponibilidade
PuppyHelpers.isAvailable(puppy);
// → true (se status=available e reserva não expirou)

// Desconto
PuppyHelpers.calculateDiscount(puppy);
// → { hasDiscount: true, savedCents: 35000, savedReais: 350 }

// SEO
PuppyHelpers.generateSeoTitle(puppy);
// → "Thor • Spitz Alemão Anão Macho Laranja | By Império Dog"

PuppyHelpers.generateSeoDescription(puppy);
// → "Conheça Thor, filhote de Spitz Alemão Anão laranja macho. R$ 3.500,00. Pedigree Pedigree..."

PuppyHelpers.generateSeoKeywords(puppy);
// → ["spitz alemão laranja", "lulu da pomerânia macho", ...]

// Alertas
PuppyHelpers.needsAttention(puppy);
// → { needsAttention: true, reasons: ["Mais de 6 meses sem venda", "Poucas visualizações"] }

// Aquisi��o
PuppyHelpers.getAcquisitionAvailability(birthDate);
// → { isReady: true, readyDate: Date(...), daysUntilReady: 0 }
```

---

## 🎨 Taxonomias

### `PUPPY_COLORS`

```typescript
const PUPPY_COLORS = {
 creme: {
 label: "Creme",
 hex: "#F5DEB3",
 seoKeywords: ["spitz alemão creme", "lulu pomerania creme", ...],
 },
 branco: { ... },
 laranja: { ... },
 preto: { ... },
 particolor: { ... },
 chocolate: { ... },
 azul: { ... },
 sable: { ... },
} as const;

type Color = keyof typeof PUPPY_COLORS;
```

### `CITIES`

```typescript
const CITIES = {
 "sao-paulo": {
 label: "São Paulo",
 state: "SP",
 region: "Sudeste",
 population: 12000000,
 metropolitanArea: "Grande São Paulo",
 seoKeywords: ["spitz são paulo", "lulu sp", ...],
 },
 // ... 16 outras cidades (Campinas, RJ, BH, etc)
} as const;

type City = keyof typeof CITIES;
```

### `PUPPY_STATUS`

```typescript
const PUPPY_STATUS = {
 available: { label: "Disponível", color: "green", ... },
 reserved: { label: "Reservado", color: "yellow", ... },
 sold: { label: "Vendido", color: "gray", ... },
 "coming-soon": { label: "Em Breve", color: "blue", ... },
 unavailable: { label: "Indispon�vel", color: "red", ... },
} as const;

type PuppyStatus = keyof typeof PUPPY_STATUS;
```

### `SEARCH_INTENTS`

```typescript
const SEARCH_INTENTS = {
 commercial: {
 priority: "high",
 keywords: ["comprar spitz alemão", "preço", "à venda"],
 },
 informational: {
 priority: "medium",
 keywords: ["o que é spitz alemão", "características", "cuidados"],
 },
 local: {
 priority: "high",
 keywords: ["spitz alemão perto de mim", "são paulo", "criador"],
 },
 navigational: {
 priority: "medium",
 keywords: ["by imperio dog", "contato"],
 },
 longTail: {
 priority: "very-high",
 keywords: ["spitz macho laranja são paulo", ...],
 },
} as const;
```

### `TaxonomyHelpers`

```typescript
// Busca
TaxonomyHelpers.getCityBySlug("sao-paulo");
TaxonomyHelpers.getCitiesByState(["SP"]);
TaxonomyHelpers.getCitiesByRegion("Sudeste");
TaxonomyHelpers.getColorBySlug("creme");

// SEO
TaxonomyHelpers.generateSeoKeywords({ city: "sao-paulo", color: "laranja", sex: "male" });
// → ["spitz alemão laranja macho são paulo", ...]

// Validação
TaxonomyHelpers.isValidCity("sao-paulo"); // true
TaxonomyHelpers.isValidColor("roxo"); // false
```

---

## ⚙️ Configurações de Negócio

### `BRAND`

```typescript
const BRAND = {
 name: "By Império Dog",
 legalName: "By Império Dog Criação de Spitz Alemão",
 slogan: "Criadora especializada em Spitz Alemão Anão Lulu da Pomerânia",
 
 headquarters: {
 city: "Bragança Paulista",
 state: "SP",
 country: "BR",
 },

 contact: {
 phone: "+55 11 96863-3239",
 whatsapp: "+55 11 96863-3239",
 email: "contato@byimperiodog.com.br",
 },

 social: {
 instagram: "@byimperiodog",
 facebook: "byimperiodog",
 youtube: "@byimperiodog",
 },

 urls: {
 site: "https://www.byimperiodog.com.br",
 whatsappLink: "https://wa.me/5511968633239",
 },
};
```

### `PRODUCT_CONFIG`

```typescript
const PRODUCT_CONFIG = {
 breed: {
 official: "Spitz Alemão Anão",
 alternative: "Lulu da Pomerânia",
 },

 specs: {
 adultHeightMin: 18, // cm
 adultHeightMax: 22,
 adultWeightMin: 1.5, // kg
 adultWeightMax: 3.5,
 lifeExpectancy: "12-16 anos",
 temperament: ["Alegre", "Inteligente", "Sociável", "Protetor", "Ativo"],
 },

 ages: {
 minWeeksForAdoption: 8, // Mínimo legal
 idealWeeksForAdoption: 10,
 maxMonthsForPuppy: 12,
 },

 pricing: {
 minPriceCents: 200000, // R$ 2.000
 maxPriceCents: 800000, // R$ 8.000
 averagePriceCents: 350000, // R$ 3.500
 },
};
```

### `BUSINESS_RULES`

```typescript
const BUSINESS_RULES = {
 reservation: {
 durationDays: 7,
 depositPercentage: 30,
 requiresDeposit: true,
 },

 shipping: {
 freeShippingCities: ["sao-paulo", "campinas", "braganca-paulista"],
 maxShippingDistanceKm: 500,
 shippingPartners: ["Gollog", "Voe Pet", "Amigo Pet Express"],
 },

 warranties: {
 healthGuaranteeDays: 90,
 pedigreeIncluded: true,
 lifetimeSupport: true,
 },

 requiredDocuments: [
 "Pedigree Pedigree",
 "Carteira de vacinação",
 "Atestado de saúde veterinário",
 "Contrato de compra e venda",
 "Termo de garantia",
 ],
};
```

### `BUSINESS_GOALS`

```typescript
const BUSINESS_GOALS = {
 daily: {
 targetSales: 10, // 10 vendas/dia
 minLeads: 50,
 conversionRate: 0.2, // 20%
 },

 monthly: {
 targetRevenueCents: 10500000, // R$ 105.000/mês
 targetPuppiesListed: 100,
 },

 seo: {
 targetKeywords: ["comprar spitz alemão", "lulu da pomerânia preço", ...],
 targetCities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba"],
 targetPositions: 3, // Top 3 no Google
 },
};
```

### `ConfigHelpers`

```typescript
// Entrega gratuita
ConfigHelpers.hasFreeShipping("sao-paulo"); // true

// Sinal (30%)
ConfigHelpers.calculateDeposit(350000); // 105000 (R$ 1.050)

// Expiração de reserva
ConfigHelpers.calculateReservationExpiry(new Date()); // +7 dias

// Pronto para adoção
ConfigHelpers.isReadyForAdoption(new Date("2024-10-01")); // true (8+ semanas)

// WhatsApp
ConfigHelpers.getWhatsAppLink("Olá! Gostaria de informações sobre filhotes.");
// → "https://wa.me/5511968633239?text=..."

// SEO
ConfigHelpers.generatePuppyTitle({ name: "Thor", color: "Laranja", sex: "male" });
// → "Thor • Laranja • Macho | Spitz Alemão Anão | By Império Dog"
```

---

## 🔄 Uso em Rotas e Componentes

### Importação

```typescript
import {
 // Entidade
 Puppy,
 PuppyPrice,
 PuppyAge,
 PuppyHelpers,

 // DTOs
 CreatePuppyDTO,
 UpdatePuppyDTO,
 PuppyFilters,
 PuppySortBy,

 // Taxonomias
 PUPPY_COLORS,
 CITIES,
 PUPPY_STATUS,
 SEARCH_INTENTS,
 TaxonomyHelpers,
 Color,
 City,

 // Config
 BRAND,
 PRODUCT_CONFIG,
 BUSINESS_RULES,
 BUSINESS_GOALS,
 ConfigHelpers,
} from "@/domain";
```

### Exemplo: Criar Filhote

```typescript
const newPuppy: CreatePuppyDTO = {
 name: "Thor",
 color: "laranja",
 sex: "male",
 birthDate: new Date("2024-10-01"),
 priceCents: 350000,
 city: "sao-paulo",
 state: "SP",
 title: PuppyHelpers.generateSeoTitle({ name: "Thor", color: "laranja", sex: "male" }),
 description: "...",
 images: ["url1"],
 source: "own-breeding",
};

const slug = PuppyHelpers.generateSlug(newPuppy.name, newPuppy.color, newPuppy.sex);
// → "thor-spitz-alemao-macho-laranja"
```

### Exemplo: Filtrar Catálogo

```typescript
const filters: PuppyFilters = {
 status: ["available"],
 colors: ["creme", "laranja"],
 cities: ["sao-paulo", "campinas"],
 minPrice: 200000,
 maxPrice: 500000,
 hasPedigree: true,
};

const sortBy: PuppySortBy = "price-asc";
```

### Exemplo: Validações

```typescript
// Idade
const age = PuppyAge.fromDate(puppy.birthDate);
if (!age.isReadyForAdoption(8)) {
 throw new Error("Filhote ainda não pode ser adotado (mínimo 8 semanas)");
}

// Preço
const price = PuppyPrice.fromCents(puppy.priceCents);
if (!price.isInRange(PRODUCT_CONFIG.pricing.minPriceCents, PRODUCT_CONFIG.pricing.maxPriceCents)) {
 throw new Error("Preço fora da faixa permitida");
}
```

---

## 🎯 Regra de Negócio: One Brand

**IMPORTANTE**: Todos os filhotes são comercializados sob a marca "By Império Dog".

### Campo `source`

O campo `source` na entidade `Puppy` é **APENAS INTERNO**:

```typescript
type PuppySource = "own-breeding" | "external-breeder";
```

- **"own-breeding"**: Criação própria da By Império Dog
- **"external-breeder"**: Filhote vindo de criador parceiro externo (controlado via `internalSourceId`)

### O que NÃO fazer

❌ Exibir nome do criador parceiro na página do filhote 
❌ Mencionar "parceiro" ou "terceiro" no schema JSON-LD 
❌ Usar seller diferente de "By Império Dog" nos schemas 

### O que fazer

✅ Sempre usar "By Império Dog" como marca/seller 
✅ Usar `source` apenas para controle administrativo interno 
✅ Rastrear `internalSourceId` apenas em painel admin (não público) 
✅ Aplicar margens de lucro diferentes baseado em `source` (interno) 

---

## 📈 Próximos Passos

1. **Rotas semânticas**:
 - `/filhotes/laranja` (por cor)
 - `/filhotes/sao-paulo` (por cidade) ✅ Já criado
 - `/comprar-spitz-alemao` (por intenção)

2. **Sistema de reviews**:
 - Implementar frontend de reviews
 - Usar `aggregateRating` em JSON-LD

3. **Backend marketplace**:
 - Painel admin para parceiros (baseado em `source`)
 - Cálculo de comissões por `source`
 - Onboarding de parceiros

4. **Blog programático**:
 - Usar `SEARCH_INTENTS` para gerar posts
 - SEO otimizado com `TaxonomyHelpers`

---

## 📚 Referências

- **DDD**: Domain-Driven Design (Eric Evans)
- **Value Objects**: Objetos imutáveis que encapsulam lógica (ex: PuppyPrice, PuppyAge)
- **DTOs**: Objetos para transferência de dados entre camadas
- **Helpers**: Funções puras que operam sobre entidades
- **Taxonomias**: Vocabulário controlado do domínio

---

**Mantido por**: By Império Dog Tech Team 
**Última atualização**: 30/11/2024

