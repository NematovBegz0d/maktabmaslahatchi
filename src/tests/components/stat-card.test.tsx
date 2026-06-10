import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/stat-card";
import { Users } from "lucide-react";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="O'quvchilar" value={42} icon={Users} accent="primary" />);
    expect(screen.getByText("O'quvchilar")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(<StatCard label="To'liqlik" value="75%" icon={Users} accent="success" />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
