import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App";

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe("App routing", () => {
  beforeEach(() => localStorage.clear());

  it("redirects / to the book", () => {
    at("/");
    expect(screen.getByText("Why Boundaries Exist")).toBeInTheDocument();
  });

  it("renders a deep-linked chapter", () => {
    at("/book/7");
    expect(screen.getByText("The Composition Root")).toBeInTheDocument();
  });

  it("renders the quiz", () => {
    at("/quiz");
    expect(screen.getByText("What is a port?")).toBeInTheDocument();
  });

  it("renders review, drill, testing and cards modules", () => {
    at("/review");
    expect(
      screen.getByText(/Mission 1: the entangled use case/),
    ).toBeInTheDocument();
    at("/drill");
    expect(screen.getByText(/Where does this line belong/)).toBeInTheDocument();
    at("/testing");
    expect(
      screen.getByText(/test redeemReward without mocking/),
    ).toBeInTheDocument();
    at("/cards");
    expect(screen.getAllByText("System design").length).toBeGreaterThan(0);
  });

  it("quiz answer flow scores and advances", async () => {
    const user = userEvent.setup();
    at("/quiz");
    await user.click(
      screen.getByText(
        "An interface defined by the inner logic that expresses a need",
      ),
    );
    expect(screen.getByText(/Why:/)).toBeInTheDocument();
    await user.click(screen.getByText("Next"));
    expect(screen.getByText(/Question 2 \/ 12/)).toBeInTheDocument();
  });

  it("persists chapter reads and resets progress", async () => {
    const user = userEvent.setup();
    at("/book/1");
    await user.click(
      screen.getByRole("button", { name: /Coupling and the Direction.*→/ }),
    );
    expect(
      JSON.parse(localStorage.getItem("hexagon-dojo:v1")!)?.readChapters,
    ).toContain(0);
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    expect(localStorage.getItem("hexagon-dojo:v1")).toBeNull();
    expect(screen.getByText("Why Boundaries Exist")).toBeInTheDocument();
  });
});
