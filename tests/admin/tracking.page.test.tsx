/// <reference types="@testing-library/jest-dom" />
vi.mock('server-only', () => ({}));
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TrackingSettingsPage from "../../app/(admin)/admin/(protected)/tracking/page";
import { TrackingSettingsForm } from "../../app/(admin)/admin/(protected)/tracking/TrackingSettingsForm";

const DEFAULT_SETTINGS = {
  gtm_id: "",
  ga4_id: "G-ABC12345",
  meta_pixel_id: "1234567890",
  tiktok_pixel_id: "",
  pinterest_tag_id: "",
  hotjar_id: "",
  clarity_id: "",
};

describe("Admin Tracking Settings Page", () => {
  beforeEach(() => {
    // Mock global fetch: GET returns settings, POST resolves ok
    const postMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (init && init.method === "POST") return postMock(url, init);
        return { ok: true, json: async () => ({ settings: DEFAULT_SETTINGS }) };
      }) as unknown as typeof fetch
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza inputs com valores vindos do endpoint", async () => {
    const { container } = render(<TrackingSettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Meta\s*\/\s*Facebook Pixel/i)).toHaveValue("1234567890");
      expect(screen.getByLabelText(/Google Analytics/i)).toHaveValue("G-ABC12345");
    });

    // garantir que o formulário foi renderizado e contém o botão esperado
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    expect(within(form as Element).getByRole("button", { name: /Salvar IDs/i })).toBeTruthy();
  });

  it("chama POST ao clicar em Salvar IDs", async () => {
    const fetchMock = (globalThis as any).fetch as jest.MockedFunction<any>;

    const { container } = render(<TrackingSettingsForm />);

    const form = await waitFor(() => container.querySelector("form"));
    const btn = within(form as Element).getByRole("button", { name: /Salvar IDs/i });
    await waitFor(() => expect(btn).not.toBeDisabled());
    fireEvent.click(btn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/settings", expect.objectContaining({ method: "POST" }));
    });
  });

  it("desabilita o botão enquanto a requisição de salvamento está em andamento", async () => {
    // override POST to delay
    const delayedPost = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 50)
        )
    );
    (globalThis as any).fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init && init.method === "POST") return delayedPost(url, init);
      return { ok: true, json: async () => ({ settings: DEFAULT_SETTINGS }) };
    });

    const { container } = render(<TrackingSettingsForm />);
    const form = await waitFor(() => container.querySelector("form"));
    const btn = within(form as Element).getByRole("button", { name: /Salvar IDs/i });

    // wait until initial load completes and the button is enabled
    await waitFor(() => expect(btn).not.toBeDisabled());

    fireEvent.click(btn);

    expect(btn).toBeDisabled();

    await waitFor(() => expect(delayedPost).toHaveBeenCalled());
  });
});
