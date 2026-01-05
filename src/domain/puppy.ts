/**
 * @module domain/puppy
 * @description Entidade central do domÃ­nio: Filhote de Spitz AlemÃ£o (By ImpÃ©rio Dog)
 * 
 * REGRA DE NEGÃ“CIO:
 * - Todos os filhotes sÃ£o comercializados sob a marca "By ImpÃ©rio Dog"
 * - A origem (prÃ³pria ou externa) Ã© APENAS para controle interno
 * - NUNCA expor "criador parceiro" ao cliente final
 */

import type { City, Color, PuppyStatus } from "./taxonomies";

/**
 * Origem interna do filhote (NÃƒO EXIBIR AO PÃšBLICO)
 */
export type PuppySource = "own-breeding" | "external-breeder";

/**
 * Entidade Puppy - Filhote de Spitz AlemÃ£o AnÃ£o (Lulu da PomerÃ¢nia)
 * Comercializado 100% sob a marca "By ImpÃ©rio Dog"
 */
export interface Puppy {
  // ==========================================
  // IDENTIFICAÃ‡ÃƒO
  // ==========================================
  id: string;
  slug: string; // URL-friendly (ex: "thor-spitz-alemao-macho-laranja")
  name: string; // Nome do filhote (ex: "Thor")

  // ==========================================
  // CARACTERÃSTICAS FÃSICAS
  // ==========================================
  breed: "Spitz Alemão Anão" | "Spitz AlemÃ£o AnÃ£o" | "Lulu da Pomerânia" | "Lulu da PomerÃ¢nia"; // Raça oficial
  color: Color; // Cor da pelagem
  sex: "male" | "female";
  birthDate: Date; // Data de nascimento
  readyForAdoptionDate?: Date; // Data em que pode ir para o novo lar (geralmente 60 dias)
  
  // Medidas e porte
  currentWeight?: number; // Peso atual em kg
  expectedAdultWeight?: number; // Peso adulto esperado (1.5 - 3.5 kg para Spitz AnÃ£o)
  currentHeight?: number; // Altura atual em cm
  expectedAdultHeight?: number; // Altura adulta esperada (18-22cm na cernelha)
  size: "toy" | "mini" | "standard"; // ClassificaÃ§Ã£o de porte

  // ==========================================
  // COMERCIAL (BY IMPÃ‰RIO DOG)
  // ==========================================
  title: string; // Título comercial SEO (ex: "Spitz Alemão Anão Macho Laranja - Thor")
  description: string; // Descrição voltada à venda
  priceCents: number; // Preço em centavos (ex: 350000 = R$ 3.500,00)
  currency: "BRL"; // Moeda (sempre BRL)
  status: PuppyStatus; // DisponÃ­vel, reservado, vendido, em breve
  
  // Destaque e promoÃ§Ã£o
  isHighlighted: boolean; // Destaque no catÃ¡logo
  isFeatured: boolean; // Vitrine principal (homepage)
  isBestSeller: boolean; // Mais vendido
  isNewArrival: boolean; // RecÃ©m-chegado
  discountPercentage?: number; // Desconto percentual (ex: 10 = 10% off)
  originalPriceCents?: number; // PreÃ§o original se houver desconto

  // ==========================================
  // LOCALIZAÃ‡ÃƒO E ENTREGA
  // ==========================================
  city: City; // Cidade de anÃºncio/entrega principal
  state: string; // UF (SP, RJ, MG, etc)
  availableForShipping: boolean; // Aceita envio para outras cidades
  shippingCities?: City[]; // Cidades especÃ­ficas que atende
  shippingNotes?: string; // Ex: "Entrega gratuita na Grande SP"
  
  // ==========================================
  // MÃDIA E CONTEÃšDO
  // ==========================================
  images: string[]; // URLs das imagens (primeira = thumbnail principal)
  videoUrl?: string; // URL do vÃ­deo de apresentaÃ§Ã£o (YouTube, Vimeo)
  captionUrl?: string; // URL de legendas/captions do vÃ­deo (opcional)
  galleryImages?: string[]; // Galeria adicional de imagens
  thumbnailUrl?: string; // Thumbnail customizado (se diferente da primeira image)

  // SEO e ranqueamento
  seoTitle?: string; // Meta title customizado
  seoDescription?: string; // Meta description customizada
  seoKeywords: string[]; // ["spitz alemÃ£o macho", "lulu pomerania creme sp", etc]
  canonicalUrl?: string; // URL canÃ´nica (se houver duplicatas)

  // ==========================================
  // SAÃšDE E DOCUMENTAÃ‡ÃƒO
  // ==========================================
  hasPedigree: boolean; // Tem pedigree Pedigree
  pedigreeNumber?: string; // NÃºmero do pedigree Pedigree
  pedigreeUrl?: string; // URL do PDF do pedigree
  
  vaccinationStatus: "up-to-date" | "partial" | "pending"; // Status de vacinaÃ§Ã£o
  vaccinationDates?: Date[]; // Datas das vacinas aplicadas
  nextVaccinationDate?: Date; // PrÃ³xima vacina programada
  
  hasMicrochip: boolean; // Tem microchip
  microchipId?: string; // ID do microchip
  
  healthCertificateUrl?: string; // Atestado de saÃºde veterinÃ¡rio
  healthNotes?: string; // ObservaÃ§Ãµes de saÃºde (alergias, cuidados especiais)
  
  // Linhagem
  parentsMale?: string; // Nome do pai
  parentsFemale?: string; // Nome da mÃ£e
  parentsImages?: { male?: string; female?: string }; // Fotos dos pais

  // ==========================================
  // SOCIAL PROOF E ENGAJAMENTO
  // ==========================================
  reviewCount: number; // Total de avaliaÃ§Ãµes
  averageRating: number; // MÃ©dia de avaliaÃ§Ã£o (0-5)
  viewCount: number; // VisualizaÃ§Ãµes da pÃ¡gina
  favoriteCount: number; // FavoritaÃ§Ãµes
  shareCount: number; // Compartilhamentos
  inquiryCount: number; // Consultas via formulÃ¡rio

  // ==========================================
  // CONTROLE INTERNO (NÃƒO EXIBIR AO PÃšBLICO)
  // ==========================================
  source: PuppySource; // Origem: criaÃ§Ã£o prÃ³pria ou externa
  internalSourceId?: string; // ID do criador externo (se aplicÃ¡vel) - APENAS INTERNO
  internalNotes?: string; // Notas administrativas internas
  costCents?: number; // Custo de aquisiÃ§Ã£o (se externo) - APENAS INTERNO
  profitMarginPercentage?: number; // Margem de lucro - APENAS INTERNO

  // ==========================================
  // METADATA E TIMESTAMPS
  // ==========================================
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date; // Data de publicaÃ§Ã£o no site
  soldAt?: Date; // Data da venda
  reservedAt?: Date; // Data da reserva
  reservedBy?: string; // ID ou email do cliente que reservou
  reservationExpiresAt?: Date; // Validade da reserva

  // Auditoria
  createdBy?: string; // ID do admin que criou
  updatedBy?: string; // ID do admin da Ãºltima atualizaÃ§Ã£o
}

// ==========================================
// VALUE OBJECTS
// ==========================================
// VALUE OBJECTS (definidos mais abaixo apÃ³s interfaces auxiliares)

/**
 * Value Object: Idade do filhote
 * Encapsula cÃ¡lculos de idade e validaÃ§Ãµes
 */
export class PuppyAge {
  constructor(private readonly birthDate: Date) {}

  static fromDate(date: Date): PuppyAge {
    return new PuppyAge(date);
  }

  getDays(referenceDate: Date = new Date()): number {
    const diff = referenceDate.getTime() - this.birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getWeeks(referenceDate: Date = new Date()): number {
    return Math.floor(this.getDays(referenceDate) / 7);
  }

  getMonths(referenceDate: Date = new Date()): number {
    const diff = referenceDate.getTime() - this.birthDate.getTime();
    const monthsDiff = diff / (1000 * 60 * 60 * 24 * 30.44);
    return Math.floor(monthsDiff);
  }

  isReadyForAdoption(minWeeks: number = 8): boolean {
    return this.getWeeks() >= minWeeks;
  }

  isPuppy(maxMonths: number = 12): boolean {
    return this.getMonths() <= maxMonths;
  }

  formatAge(): string {
    const months = this.getMonths();
    const weeks = this.getWeeks();

    if (months >= 1) {
      return months === 1 ? "1 mÃªs" : `${months} meses`;
    }
    return weeks === 1 ? "1 semana" : `${weeks} semanas`;
  }

  getReadyForAdoptionDate(minWeeks: number = 8): Date {
    const readyDate = new Date(this.birthDate);
    readyDate.setDate(readyDate.getDate() + minWeeks * 7);
    return readyDate;
  }
}

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

/**
 * DTO para criaÃ§Ã£o de novo filhote
 */
export interface CreatePuppyDTO {
  name: string;
  color: Color;
  sex: "male" | "female";
  birthDate: Date;
  priceCents: number;
  city: City;
  state: string;
  title: string;
  description: string;
  images: string[];
  source: PuppySource; // prÃ³prio ou externo (interno)
  internalSourceId?: string; // ID do criador externo (se aplicÃ¡vel)
}

/**
 * DTO para atualizaÃ§Ã£o de filhote
 */
export type UpdatePuppyDTO = Partial<CreatePuppyDTO> & {
  id: string;
  status?: PuppyStatus;
  isHighlighted?: boolean;
  isFeatured?: boolean;
  discountPercentage?: number;
};

/**
 * DTO para filtros de busca
 */
export interface PuppyFilters {
  status?: PuppyStatus | PuppyStatus[];
  colors?: Color[];
  sex?: "male" | "female";
  cities?: City[];
  minPrice?: number;
  maxPrice?: number;
  hasPedigree?: boolean;
  minRating?: number;
  source?: PuppySource; // Filtro interno (admin)
  isHighlighted?: boolean;
  isFeatured?: boolean;
  search?: string; // Busca textual (nome, descriÃ§Ã£o)
}

/**
 * DTO para ordenaÃ§Ã£o
 */
export type PuppySortBy =
  | "recent" // Mais recentes primeiro
  | "price-asc" // Menor preÃ§o
  | "price-desc" // Maior preÃ§o
  | "popular" // Mais visualizados
  | "rating" // Melhor avaliados
  | "name-asc" // A-Z
  | "name-desc"; // Z-A

// ==========================================
// HELPERS E UTILITÃRIOS
// ==========================================

export const PuppyHelpers = {
  /**
   * Gera slug amigÃ¡vel para URL
   */
  generateSlug(name: string, color: Color, sex: "male" | "female"): string {
    const sexLabel = sex === "male" ? "macho" : "femea";
    const normalized = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "-") // Remove caracteres especiais
      .replace(/^-+|-+$/g, ""); // Remove hÃ­fens nas pontas

    return `${normalized}-spitz-alemao-${sexLabel}-${color}`;
  },

  /**
  * Verifica se filhote está disponível para venda
   */
  isAvailable(puppy: Puppy): boolean {
    if (puppy.status !== "available") return false;

    // Verifica se reserva expirou
    if (puppy.reservedAt && puppy.reservationExpiresAt) {
      const now = new Date();
      if (now > puppy.reservationExpiresAt) {
        return true; // Reserva expirada, volta a ficar disponível
      }
      return false;
    }

    return true;
  },

  /**
   * Calcula desconto ativo
   */
  calculateDiscount(puppy: Puppy): { hasDiscount: boolean; savedCents: number; savedReais: number } {
    if (!puppy.discountPercentage || !puppy.originalPriceCents) {
      return { hasDiscount: false, savedCents: 0, savedReais: 0 };
    }

    const savedCents = puppy.originalPriceCents - puppy.priceCents;
    return {
      hasDiscount: true,
      savedCents,
      savedReais: savedCents / 100,
    };
  },

  /**
   * Gera tÃ­tulo SEO otimizado
   */
  generateSeoTitle(puppy: Puppy): string {
    const sexLabel = puppy.sex === "male" ? "Macho" : "FÃªmea";
    const colorCapitalized = puppy.color.charAt(0).toUpperCase() + puppy.color.slice(1);

    return `${puppy.name} â€¢ Spitz AlemÃ£o AnÃ£o ${sexLabel} ${colorCapitalized} | By ImpÃ©rio Dog`;
  },

  /**
   * Gera descriÃ§Ã£o SEO otimizada
   */
  generateSeoDescription(puppy: Puppy): string {
    const sexLabel = puppy.sex === "male" ? "macho" : "fÃªmea";
    const price = PuppyPrice.fromCents(puppy.priceCents).format();

    return `ConheÃ§a ${puppy.name}, filhote de Spitz AlemÃ£o AnÃ£o ${puppy.color} ${sexLabel}. ${price}. Pedigree Pedigree, entrega segura e suporte vitalÃ­cio. By ImpÃ©rio Dog.`;
  },

  /**
   * Gera keywords SEO
   */
  generateSeoKeywords(puppy: Puppy): string[] {
    const sexLabel = puppy.sex === "male" ? "macho" : "fÃªmea";

    return [
      `spitz alemÃ£o ${puppy.color}`,
      `lulu da pomerÃ¢nia ${sexLabel}`,
      `filhote spitz ${puppy.city}`,
      `spitz alemÃ£o anÃ£o ${puppy.color}`,
      `comprar spitz alemÃ£o ${puppy.state.toLowerCase()}`,
      `by impÃ©rio dog ${puppy.color}`,
      `spitz ${sexLabel} pedigree`,
    ];
  },

  /**
   * Identifica filhotes que precisam de atenÃ§Ã£o (marketing)
   */
  needsAttention(puppy: Puppy): { needsAttention: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const age = PuppyAge.fromDate(puppy.birthDate);

    // Mais de 6 meses sem vender
    if (age.getMonths() > 6 && puppy.status === "available") {
      reasons.push("Mais de 6 meses sem venda");
    }

    // Poucas visualizações
    if (puppy.viewCount < 50) {
      reasons.push("Poucas visualizações (< 50)");
    }

    // Sem imagens
    if (!puppy.images || puppy.images.length === 0) {
      reasons.push("Sem imagens");
    }

    // Preço muito alto comparado à média
    const avgPrice = 350000; // R$ 3.500 (média)
    if (puppy.priceCents > avgPrice * 1.5) {
      reasons.push("Preço acima da média");
    }

    return {
      needsAttention: reasons.length > 0,
      reasons,
    };
  },

  /**
   * Formata data de nascimento para exibiÃ§Ã£o
   */
  formatBirthDate(birthDate: Date, locale: string = "pt-BR"): string {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(birthDate);
  },

  /**
   * Calcula disponibilidade para aquisição
   */
  getAcquisitionAvailability(birthDate: Date): {
    isReady: boolean;
    readyDate: Date;
    daysUntilReady: number;
  } {
    const age = PuppyAge.fromDate(birthDate);
    const isReady = age.isReadyForAdoption(8);
    const readyDate = age.getReadyForAdoptionDate(8);
    const now = new Date();
    const daysUntilReady = Math.max(
      0,
      Math.ceil((readyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return { isReady, readyDate, daysUntilReady };
  },
};

/**
 * DTO para criaÃ§Ã£o de filhote (campos obrigatÃ³rios mÃ­nimos)
 */
export interface CreatePuppyDTO {
  name: string;
  color: Color;
  sex: "male" | "female";
  birthDate: Date;
  priceCents: number;
  city: City;
  state: string;
  description: string;
  images: string[];
}

/**
 * Resultado paginado de busca de filhotes
 */
export interface PuppySearchResult {
  puppies: Puppy[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  filters: PuppyFilters;
  sortBy: PuppySortBy;
}

/**
 * Eventos de ciclo de vida do filhote
 */
export type PuppyEvent =
  | { type: "created"; timestamp: Date; by: string }
  | { type: "published"; timestamp: Date; by: string }
  | { type: "reserved"; timestamp: Date; by: string; customerId: string }
  | { type: "sold"; timestamp: Date; by: string; customerId: string; salePrice: number }
  | { type: "cancelled"; timestamp: Date; by: string; reason: string }
  | { type: "updated"; timestamp: Date; by: string; fields: string[] }
  | { type: "reviewed"; timestamp: Date; by: string; rating: number };

/**
 * Value Objects
 */

/**
 * PreÃ§o com formataÃ§Ã£o e validaÃ§Ã£o
 */
export class PuppyPrice {
  private constructor(private readonly cents: number) {
    if (cents < 0) throw new Error("Price cannot be negative");
    if (!Number.isInteger(cents)) throw new Error("Price must be in cents (integer)");
  }

  static fromCents(cents: number): PuppyPrice {
    return new PuppyPrice(cents);
  }

  static fromReais(reais: number): PuppyPrice {
    return new PuppyPrice(Math.round(reais * 100));
  }

  toCents(): number {
    return this.cents;
  }

  toReais(): number {
    return this.cents / 100;
  }

  format(locale = "pt-BR", currency = "BRL"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(this.toReais());
  }

  isInRange(min: PuppyPrice, max: PuppyPrice): boolean {
    return this.cents >= min.cents && this.cents <= max.cents;
  }
}


