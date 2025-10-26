import { describe, expect, it } from "vitest";

/**
 * Unit tests for content guard rules
 * Tests the banned terms regex and Spitz/Lulu pairing logic
 */

describe("content-guard rules", () => {
  describe("banned terms regex", () => {
    const banned = /(\badoç[aã]o\b|\bdoaç[aã]o\b|\bboutique\b)/i;

    it("should detect 'adoção'", () => {
      expect(banned.test("disponível para adoção")).toBe(true);
      expect(banned.test("Adoção responsável")).toBe(true);
    });

    it("should detect 'doação'", () => {
      expect(banned.test("não fazemos doação")).toBe(true);
      expect(banned.test("Doação de filhotes")).toBe(true);
    });

    it("should detect 'boutique'", () => {
      expect(banned.test("boutique de pets")).toBe(true);
      expect(banned.test("Boutique premium")).toBe(true);
    });

    it("should NOT flag safe variations", () => {
      expect(banned.test("adoração pelo Spitz")).toBe(false);
      expect(banned.test("dotação orçamentária")).toBe(false);
      expect(banned.test("criação responsável")).toBe(false);
    });

    it("should handle diacritics correctly", () => {
      // The regex uses character classes [aã] and [aã], so pure ASCII won't match
      // This test documents that the guard expects proper diacritics in source
      expect(banned.test("adocao")).toBe(false); // missing tilde/cedilla
      expect(banned.test("doacao")).toBe(false); // missing tilde/cedilla
      expect(banned.test("adoção")).toBe(true);
      expect(banned.test("doação")).toBe(true);
    });
  });

  describe("Spitz Alemão Anão pairing rule", () => {
    const spitzPattern = /(spitz\s+alem[aã]o\s+an[aã]o)/i;
    const luluPattern = /(lulu\s+da\s+pomer[aâ]nia)/i;

    it("should detect 'Spitz Alemão Anão' (requires pairing)", () => {
      expect(spitzPattern.test("Filhotes de Spitz Alemão Anão disponíveis")).toBe(true);
      expect(spitzPattern.test("Spitz alemao anao ate 22 cm")).toBe(true);
    });

    it("should NOT trigger on just 'Spitz Alemão' (without Anão)", () => {
      expect(spitzPattern.test("Criação de Spitz Alemão")).toBe(false);
    });

    it("should detect 'Lulu da Pomerânia' for pairing", () => {
      expect(luluPattern.test("também conhecido como Lulu da Pomerânia")).toBe(true);
      expect(luluPattern.test("Lulu da Pomerania")).toBe(true);
    });

    it("should validate paired usage", () => {
      const line = "Spitz Alemão Anão (Lulu da Pomerânia) até 22 cm";
      expect(spitzPattern.test(line)).toBe(true);
      expect(luluPattern.test(line)).toBe(true);
    });

    it("should flag unpaired usage", () => {
      const line = "Filhotes de Spitz Alemão Anão disponíveis";
      expect(spitzPattern.test(line)).toBe(true);
      expect(luluPattern.test(line)).toBe(false);
    });

    it("should handle next-line pairing (guard checks same + next line)", () => {
      const line1 = "Criação de Spitz Alemão Anão";
      const line2 = "conhecido como Lulu da Pomerânia";
      expect(spitzPattern.test(line1)).toBe(true);
      expect(luluPattern.test(line1)).toBe(false);
      expect(luluPattern.test(line2)).toBe(true);
      // In real guard: would check line1+line2 together
    });
  });

  describe("slugify for anchor generation (TOC)", () => {
    function slugify(text: string) {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    it("should slugify heading text", () => {
      expect(slugify("Dados que coletamos")).toBe("dados-que-coletamos");
      expect(slugify("Política de Privacidade")).toBe("politica-de-privacidade");
    });

    it("should handle special characters", () => {
      expect(slugify("FAQ: Perguntas frequentes?")).toBe("faq-perguntas-frequentes");
    });

    it("should normalize accents", () => {
      expect(slugify("Última atualização")).toBe("ultima-atualizacao");
    });

    it("should handle multiple spaces", () => {
      expect(slugify("Como  usar   o   site")).toBe("como-usar-o-site");
    });
  });
});
