#!/usr/bin/env node

/**
 * Script para configurar pixels de rastreamento via CLI
 * Atualiza tanto o .env.local quanto o Supabase
 * 
 * Uso:
 * - node scripts/configure-pixels.mjs --help (mostra todas as opções)
 * - node scripts/configure-pixels.mjs --meta <ID> (apenas Meta)
 * - node scripts/configure-pixels.mjs --tiktok <ID> (apenas TikTok)
 * - node scripts/configure-pixels.mjs --all (modo interativo)
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");

// Validadores
const validators = {
  meta: (id) => /^\d{15,16}$/.test(id),
  tiktok: (id) => /^[A-Z0-9]{10,20}$/.test(id),
  pinterest: (id) => /^\d{15,16}$/.test(id),
  gtm: (id) => /^GTM-[A-Z0-90-9]{6,10}$/.test(id),
  ga4: (id) => /^G-[A-Z0-9]{10}$/.test(id),
  hotjar: (id) => /^\d{7,}$/.test(id),
  clarity: (id) => /^[a-z0-9]{8,}$/i.test(id),
};

// Tipos de pixels com descrição
const pixelTypes = {
  GTM_ID: {
    env: "NEXT_PUBLIC_GTM_ID",
    name: "Google Tag Manager",
    format: "GTM-XXXXXX",
    validator: validators.gtm,
  },
  GA4_ID: {
    env: "NEXT_PUBLIC_GA4_ID",
    name: "Google Analytics 4",
    format: "G-XXXXXXXXXX",
    validator: validators.ga4,
  },
  META_PIXEL_ID: {
    env: "NEXT_PUBLIC_META_PIXEL_ID",
    name: "Meta Pixel (Facebook)",
    format: "15-16 dígitos",
    validator: validators.meta,
  },
  TIKTOK_PIXEL_ID: {
    env: "NEXT_PUBLIC_TIKTOK_PIXEL_ID",
    name: "TikTok Pixel",
    format: "ABCDEFGHIJKL",
    validator: validators.tiktok,
  },
  PINTEREST_TAG_ID: {
    env: "NEXT_PUBLIC_PINTEREST_TAG_ID",
    name: "Pinterest Tag",
    format: "15-16 dígitos",
    validator: validators.pinterest,
  },
  HOTJAR_ID: {
    env: "NEXT_PUBLIC_HOTJAR_ID",
    name: "Hotjar",
    format: "7+ dígitos",
    validator: validators.hotjar,
  },
  CLARITY_ID: {
    env: "NEXT_PUBLIC_CLARITY_ID",
    name: "Microsoft Clarity",
    format: "8+ caracteres",
    validator: validators.clarity,
  },
};

// readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

// Ler .env.local
function readEnv() {
  try {
    const content = fs.readFileSync(ENV_FILE, "utf-8");
    const env = {};
    content.split("\n").forEach((line) => {
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        env[key.trim()] = valueParts.join("=").trim();
      }
    });
    return env;
  } catch (error) {
    console.error("❌ Erro ao ler .env.local:", error.message);
    process.exit(1);
  }
}

// Escrever .env.local
function writeEnv(env) {
  try {
    let content = fs.readFileSync(ENV_FILE, "utf-8");
    
    // Atualizar cada variável
    Object.entries(env).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    });
    
    fs.writeFileSync(ENV_FILE, content, "utf-8");
    return true;
  } catch (error) {
    console.error("❌ Erro ao escrever .env.local:", error.message);
    return false;
  }
}

// Atualizar Supabase
async function updateSupabase(pixelKey, pixelValue) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "⚠️  Credenciais do Supabase não configuradas. Pulando atualização de banco de dados."
      );
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mapear chave para campo no banco
    const fieldMap = {
      GTM_ID: "gtmId",
      GA4_ID: "ga4Id",
      META_PIXEL_ID: "metaPixelId",
      TIKTOK_PIXEL_ID: "tiktokPixelId",
      PINTEREST_TAG_ID: "pinterestId",
      HOTJAR_ID: "hotjarId",
      CLARITY_ID: "clarityId",
    };

    const field = fieldMap[pixelKey];
    if (!field) return false;

    // Atualizar produção
    const { error } = await supabase
      .from("pixels_settings")
      .update({
        production: supabase.rpc("jsonb_set", {
          data: supabase.rpc("jsonb_extract_path", {
            data: supabase.literal('production'),
          }),
          keys: supabase.literal([field]),
          value: supabase.literal(pixelValue),
        }),
      })
      .eq("id", "pixels");

    if (error) {
      console.warn(`⚠️  Erro ao atualizar Supabase: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`⚠️  Erro ao conectar ao Supabase: ${error.message}`);
    return false;
  }
}

// Validar pixel
function validatePixel(pixelKey, value) {
  const config = pixelTypes[pixelKey];
  if (!config) return false;

  if (value === "" || value === "null") return true; // permitir vazio
  return config.validator(value);
}

// Mostrar ajuda
function showHelp() {
  console.log(`
📊 Configurador de Pixels - By Império Dog

Uso:
  node scripts/configure-pixels.mjs [OPTIONS]

Opções:
  --help              Mostra esta mensagem
  --status            Mostra status atual dos pixels
  --meta <ID>         Define Meta Pixel ID
  --tiktok <ID>       Define TikTok Pixel ID
  --pinterest <ID>    Define Pinterest Tag ID
  --gtm <ID>          Define Google Tag Manager ID
  --ga4 <ID>          Define Google Analytics 4 ID
  --hotjar <ID>       Define Hotjar ID
  --clarity <ID>      Define Microsoft Clarity ID
  --reset             Reseta todos os pixels
  --interactive       Modo interativo (padrão se sem argumentos)

Exemplos:
  node scripts/configure-pixels.mjs --meta 123456789012345
  node scripts/configure-pixels.mjs --tiktok ABCDEFGHIJKL
  node scripts/configure-pixels.mjs --interactive

Formatos esperados:
${Object.entries(pixelTypes)
  .map(([key, config]) => `  ${config.name.padEnd(30)} ${config.format}`)
  .join("\n")}
  `);
}

// Mostrar status
function showStatus() {
  const env = readEnv();
  console.log("\n📊 Status atual dos Pixels:\n");

  Object.entries(pixelTypes).forEach(([key, config]) => {
    const value = env[config.env] || "";
    const isSet = value && value !== `PLACEHOLDER_${key}` && !value.includes("X");
    const status = isSet ? "✅" : "❌";
    console.log(`${status} ${config.name.padEnd(30)} ${value || "(não configurado)"}`);
  });

  console.log("");
}

// Modo interativo
async function interactiveMode() {
  console.log("\n🎯 Configuração Interativa de Pixels\n");
  const env = readEnv();

  for (const [key, config] of Object.entries(pixelTypes)) {
    const current = env[config.env] || "";
    const displayCurrent =
      current && !current.includes("X") && !current.includes("PLACEHOLDER")
        ? `(atual: ${current})`
        : "";

    const input = await question(
      `${config.name} ${config.format} ${displayCurrent}\nValor: `
    );

    if (input.trim() === "") continue;

    if (!validatePixel(key, input)) {
      console.error(
        `❌ Formato inválido. Esperado: ${config.format}\n`
      );
      continue;
    }

    env[config.env] = input.trim();
    console.log(`✅ ${config.name} atualizado\n`);
  }

  if (writeEnv(env)) {
    console.log("\n✅ .env.local atualizado com sucesso!");
  }

  rl.close();
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveMode();
    return;
  }

  if (args[0] === "--help") {
    showHelp();
    rl.close();
    return;
  }

  if (args[0] === "--status") {
    showStatus();
    rl.close();
    return;
  }

  if (args[0] === "--interactive") {
    await interactiveMode();
    return;
  }

  if (args[0] === "--reset") {
    const confirm = await question(
      "⚠️  Tem certeza que deseja resetar TODOS os pixels? (s/n) "
    );
    if (confirm.toLowerCase() !== "s") {
      console.log("❌ Cancelado");
      rl.close();
      return;
    }

    const env = readEnv();
    Object.values(pixelTypes).forEach((config) => {
      env[config.env] = "";
    });

    if (writeEnv(env)) {
      console.log("✅ Todos os pixels foram resetados!");
    }
    rl.close();
    return;
  }

  // Parse argumentos
  let updated = false;
  const env = readEnv();

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (!value) {
      console.error(`❌ Valor não fornecido para ${flag}`);
      continue;
    }

    // Mapear flag para chave
    let pixelKey = null;
    Object.entries(pixelTypes).forEach(([key, config]) => {
      if (
        flag === `--${key.toLowerCase().replace(/_/g, "-")}` ||
        flag === `--${config.name.toLowerCase().split(" ")[0]}`
      ) {
        pixelKey = key;
      }
    });

    if (!pixelKey) {
      console.error(`❌ Opção desconhecida: ${flag}`);
      continue;
    }

    if (!validatePixel(pixelKey, value)) {
      const config = pixelTypes[pixelKey];
      console.error(`❌ Formato inválido para ${config.name}`);
      console.error(`   Esperado: ${config.format}`);
      continue;
    }

    const config = pixelTypes[pixelKey];
    env[config.env] = value;
    console.log(`✅ ${config.name} definido como: ${value}`);
    updated = true;
  }

  if (updated && writeEnv(env)) {
    console.log("\n✅ .env.local atualizado!");
    showStatus();
  }

  rl.close();
}

main().catch(console.error);
