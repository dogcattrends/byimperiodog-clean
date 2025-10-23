import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import CommandPalette from "@/components/admin/CommandPalette";

describe("CommandPalette", () => {
  it("renders input and list", async () => {
    render(<CommandPalette open={true} onOpenChange={() => {}} />);
    expect(await screen.findByLabelText(/Busca rápida/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite para buscar/i)).toBeInTheDocument();
  });
});
