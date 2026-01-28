/**
 * @module domain/taxonomies
 * @description Taxonomias e enums centralizados do domÃ­nio
 */

/**
 * Cores oficiais do Spitz AlemÃ£o AnÃ£o (Lulu da PomerÃ¢nia)
 */
export const PUPPY_COLORS = {
 creme: {
 label: "Creme",
 hex: "#F5DEB3",
 seoKeywords: ["creme", "bege claro", "champagne"],
 },
 branco: {
 label: "Branco",
 hex: "#FFFFFF",
 seoKeywords: ["branco", "branco neve", "white"],
 },
 laranja: {
 label: "Laranja",
 hex: "#FF8C00",
 seoKeywords: ["laranja", "orange", "ruivo"],
 },
 preto: {
 label: "Preto",
 hex: "#000000",
 seoKeywords: ["preto", "black", "Ã©bano"],
 },
 particolor: {
 label: "Particolor",
 hex: "#C8C8C8",
 seoKeywords: ["particolor", "bicolor", "malhado", "tricolor"],
 },
 chocolate: {
 label: "Chocolate",
 hex: "#7B3F00",
 seoKeywords: ["chocolate", "marrom", "brown"],
 },
 azul: {
 label: "Azul",
 hex: "#4A5568",
 seoKeywords: ["azul", "cinza azulado", "blue"],
 },
 sable: {
 label: "Sable",
 hex: "#D2691E",
 seoKeywords: ["sable", "zibelina", "dourado escuro"],
 },
} as const;

export type Color = keyof typeof PUPPY_COLORS;

/**
 * Status do filhote
 */
 export const PUPPY_STATUS = {
 available: {
 label: "Disponível",
 color: "green",
 description: "Pronto para aquisição",
 },
 reserved: {
 label: "Reservado",
 color: "yellow",
 description: "Reservado por um cliente",
 },
 sold: {
 label: "Vendido",
 color: "gray",
 description: "JÃ¡ foi vendido",
 },
 pending: {
 label: "Pendente",
 color: "blue",
 description: "Aguardando aprovaÃ§Ã£o ou documentaÃ§Ã£o",
 },
 unavailable: {
 label: "Indisponível",
 color: "red",
 description: "Temporariamente indisponível",
 },
} as const;

export type PuppyStatus = keyof typeof PUPPY_STATUS;

/**
 * Cidades principais de atuaÃ§Ã£o (SEO-optimized)
 */
export const CITIES = {
 // SÃ£o Paulo
 "sao-paulo": {
 name: "SÃ£o Paulo",
 slug: "sao-paulo",
 state: "SP",
 region: "Sudeste",
 metropolitanArea: "Grande SÃ£o Paulo",
 population: 12_000_000,
 seoKeywords: [
 "spitz alemÃ£o sÃ£o paulo",
 "lulu da pomerania sp capital",
 "filhote spitz zona sul",
 "comprar spitz alemÃ£o sÃ£o paulo",
 ],
 },
 campinas: {
 name: "Campinas",
 slug: "campinas",
 state: "SP",
 region: "Sudeste",
 metropolitanArea: "RegiÃ£o Metropolitana de Campinas",
 population: 1_200_000,
 seoKeywords: ["spitz alemÃ£o campinas", "lulu pomerania campinas sp"],
 },
 "sao-jose-dos-campos": {
 name: "SÃ£o JosÃ© dos Campos",
 slug: "sao-jose-dos-campos",
 state: "SP",
 region: "Sudeste",
 population: 700_000,
 seoKeywords: ["spitz sjc", "lulu pomerania vale do paraÃ­ba"],
 },
 sorocaba: {
 name: "Sorocaba",
 slug: "sorocaba",
 state: "SP",
 region: "Sudeste",
 population: 680_000,
 seoKeywords: ["spitz alemÃ£o sorocaba"],
 },
 santos: {
 name: "Santos",
 slug: "santos",
 state: "SP",
 region: "Sudeste",
 metropolitanArea: "Baixada Santista",
 population: 430_000,
 seoKeywords: ["spitz alemÃ£o santos", "lulu pomerania litoral sp"],
 },
 "ribeirao-preto": {
 name: "RibeirÃ£o Preto",
 slug: "ribeirao-preto",
 state: "SP",
 region: "Sudeste",
 population: 700_000,
 seoKeywords: ["spitz alemÃ£o ribeirÃ£o preto"],
 },

 // Rio de Janeiro
 "rio-de-janeiro": {
 name: "Rio de Janeiro",
 slug: "rio-de-janeiro",
 state: "RJ",
 region: "Sudeste",
 population: 6_700_000,
 seoKeywords: [
 "spitz alemÃ£o rio de janeiro",
 "lulu pomerania rj",
 "filhote spitz zona sul rio",
 "comprar spitz alemÃ£o rio",
 ],
 },
 niteroi: {
 name: "NiterÃ³i",
 slug: "niteroi",
 state: "RJ",
 region: "Sudeste",
 population: 500_000,
 seoKeywords: ["spitz alemÃ£o niterÃ³i"],
 },
 petropolis: {
 name: "PetrÃ³polis",
 slug: "petropolis",
 state: "RJ",
 region: "Sudeste",
 population: 300_000,
 seoKeywords: ["spitz alemÃ£o petrÃ³polis", "lulu pomerania serra fluminense"],
 },

 // Minas Gerais
 "belo-horizonte": {
 name: "Belo Horizonte",
 slug: "belo-horizonte",
 state: "MG",
 region: "Sudeste",
 population: 2_500_000,
 seoKeywords: ["spitz alemÃ£o belo horizonte", "lulu pomerania bh mg"],
 },
 uberlandia: {
 name: "UberlÃ¢ndia",
 slug: "uberlandia",
 state: "MG",
 region: "Sudeste",
 population: 700_000,
 seoKeywords: ["spitz alemÃ£o uberlÃ¢ndia"],
 },
 "juiz-de-fora": {
 name: "Juiz de Fora",
 slug: "juiz-de-fora",
 state: "MG",
 region: "Sudeste",
 population: 570_000,
 seoKeywords: ["spitz alemÃ£o juiz de fora"],
 },

 // ParanÃ¡
 curitiba: {
 name: "Curitiba",
 slug: "curitiba",
 state: "PR",
 region: "Sul",
 population: 1_900_000,
 seoKeywords: ["spitz alemÃ£o curitiba", "lulu pomerania pr"],
 },

 // Sede do criatÃ³rio
 "braganca-paulista": {
 name: "BraganÃ§a Paulista",
 slug: "braganca-paulista",
 state: "SP",
 region: "Sudeste",
 population: 170_000,
 isHeadquarters: true,
 seoKeywords: ["criador spitz braganÃ§a paulista", "criatÃ³rio lulu pomerania braganÃ§a"],
 },
} as const;

export type City = keyof typeof CITIES;

/**
 * IntenÃ§Ãµes de busca (Search Intent) - Para SEO e conteÃºdo
 */
export const SEARCH_INTENTS = {
 // IntenÃ§Ã£o comercial (alta conversÃ£o)
 commercial: {
 keywords: [
 "comprar spitz alemÃ£o",
 "filhote spitz alemÃ£o Ã  venda",
 "preÃ§o spitz alemÃ£o",
 "quanto custa lulu da pomerÃ¢nia",
 "spitz alemÃ£o anÃ£o para comprar",
 "onde comprar spitz alemÃ£o",
 "filhote lulu pomerania preÃ§o",
 "spitz alemÃ£o barato",
 "spitz alemÃ£o promoÃ§Ã£o",
 ],
 intent: "commercial",
 priority: "high",
 },

 // IntenÃ§Ã£o informacional
 informational: {
 keywords: [
 "o que Ã© spitz alemÃ£o",
 "lulu da pomerÃ¢nia caracterÃ­sticas",
 "spitz alemÃ£o tamanho adulto",
 "diferenÃ§a spitz alemÃ£o lulu pomerania",
 "cuidados com spitz alemÃ£o",
 "spitz alemÃ£o temperamento",
 "quanto vive spitz alemÃ£o",
 "spitz alemÃ£o solta pelo",
 "alimentaÃ§Ã£o spitz alemÃ£o",
 ],
 intent: "informational",
 priority: "medium",
 },

 // IntenÃ§Ã£o de pesquisa local
 local: {
 keywords: [
 "criador de spitz alemÃ£o perto de mim",
 "spitz alemÃ£o sÃ£o paulo",
 "spitz alemÃ£o rio de janeiro",
 "canil spitz alemÃ£o sp",
 "criador confiÃ¡vel spitz alemÃ£o",
 "spitz alemÃ£o braganÃ§a paulista",
 "visitar filhotes spitz alemÃ£o",
 ],
 intent: "local",
 priority: "high",
 },

 // IntenÃ§Ã£o navegacional
 navigational: {
 keywords: [
 "by imperio dog",
 "imperio dog spitz",
 "criador by imperio dog",
 "instagram by imperio dog",
 "contato by imperio dog",
 ],
 intent: "navigational",
 priority: "medium",
 },

 // Long-tail especÃ­ficos (alta intenÃ§Ã£o de compra)
 longTail: {
 keywords: [
 "spitz alemÃ£o macho laranja sÃ£o paulo",
 "lulu pomerania fÃªmea branca filhote",
 "spitz alemÃ£o anÃ£o pedigree",
 "filhote spitz alemÃ£o 2 meses vacinado",
 "comprar spitz alemÃ£o parcelado",
 "spitz alemÃ£o mini toy",
 "lulu pomerania creme bebÃª",
 ],
 intent: "commercial",
 priority: "very-high",
 },
} as const;

/**
 * RegiÃµes do Brasil para segmentaÃ§Ã£o
 */
export const REGIONS = {
 sudeste: {
 name: "Sudeste",
 states: ["SP", "RJ", "MG", "ES"],
 priority: "high",
 },
 sul: {
 name: "Sul",
 states: ["PR", "SC", "RS"],
 priority: "medium",
 },
 nordeste: {
 name: "Nordeste",
 states: ["BA", "PE", "CE", "MA", "RN", "PB", "SE", "AL", "PI"],
 priority: "medium",
 },
 "centro-oeste": {
 name: "Centro-Oeste",
 states: ["DF", "GO", "MT", "MS"],
 priority: "medium",
 },
 norte: {
 name: "Norte",
 states: ["AM", "PA", "RO", "AC", "RR", "AP", "TO"],
 priority: "low",
 },
} as const;

export type Region = keyof typeof REGIONS;

/**
 * Helpers para taxonomias
 */
export const TaxonomyHelpers = {
 /**
 * Busca cidade por slug
 */
 getCityBySlug(slug: string): (typeof CITIES)[City] | undefined {
 return CITIES[slug as City];
 },

 /**
 * Lista cidades por estado
 */
 getCitiesByState(state: string): Array<{ slug: City; data: (typeof CITIES)[City] }> {
 return Object.entries(CITIES)
 .filter(([, data]) => data.state === state)
 .map(([slug, data]) => ({ slug: slug as City, data }));
 },

 /**
 * Lista cidades por regiÃ£o
 */
 getCitiesByRegion(region: Region): Array<{ slug: City; data: (typeof CITIES)[City] }> {
 const regionStates = REGIONS[region].states;
 return Object.entries(CITIES)
 .filter(([, cityData]) => {
 return regionStates.some((state) => state === cityData.state);
 })
 .map(([slug, data]) => ({ slug: slug as City, data }));
 },

 /**
 * ObtÃ©m cor por slug
 */
 getColorBySlug(slug: string): (typeof PUPPY_COLORS)[Color] | undefined {
 return PUPPY_COLORS[slug as Color];
 },

 /**
 * Gera keywords SEO para combinaÃ§Ã£o cidade + cor + sexo
 */
 generateSeoKeywords(params: { city?: City; color?: Color; sex?: "male" | "female" }): string[] {
 const keywords: string[] = [];
 const cityData = params.city ? CITIES[params.city] : null;
 const colorData = params.color ? PUPPY_COLORS[params.color] : null;
 const sexLabel = params.sex === "male" ? "macho" : params.sex === "female" ? "fÃªmea" : null;

 // Keyword base
 keywords.push("spitz alemÃ£o anÃ£o", "lulu da pomerÃ¢nia");

 // Com cor
 if (colorData) {
 keywords.push(`spitz alemÃ£o ${colorData.label.toLowerCase()}`);
 keywords.push(`lulu pomerania ${colorData.label.toLowerCase()}`);
 }

 // Com sexo
 if (sexLabel) {
 keywords.push(`spitz alemÃ£o ${sexLabel}`);
 if (colorData) {
 keywords.push(`spitz alemÃ£o ${colorData.label.toLowerCase()} ${sexLabel}`);
 }
 }

 // Com cidade
 if (cityData) {
 keywords.push(`spitz alemÃ£o ${cityData.name.toLowerCase()}`);
 keywords.push(`comprar spitz alemÃ£o ${cityData.name.toLowerCase()}`);
 if (colorData) {
 keywords.push(`spitz alemÃ£o ${colorData.label.toLowerCase()} ${cityData.name.toLowerCase()}`);
 }
 }

 return keywords;
 },

 /**
 * Valida se cidade existe
 */
 isValidCity(slug: string): slug is City {
 return slug in CITIES;
 },

 /**
 * Valida se cor existe
 */
 isValidColor(slug: string): slug is Color {
 return slug in PUPPY_COLORS;
 },
};

