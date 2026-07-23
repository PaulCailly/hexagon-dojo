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

  it("shows the quiz set picker and a deep-linked set", () => {
    at("/quiz");
    expect(screen.getByText("Pick a question set")).toBeInTheDocument();
    at("/quiz/s1");
    expect(screen.getByText("What is a port?")).toBeInTheDocument();
  });

  it("shows the drill picker and a deep-linked drill", () => {
    at("/drill");
    expect(screen.getByText("Pick a drill")).toBeInTheDocument();
    at("/drill/d1");
    expect(screen.getByText(/Where does this line belong/)).toBeInTheDocument();
  });

  it("renders review, testing and cards modules", () => {
    at("/review");
    expect(
      screen.getByText(/Mission 1: the entangled use case/),
    ).toBeInTheDocument();
    at("/testing");
    expect(
      screen.getByText(/test redeemReward without mocking/),
    ).toBeInTheDocument();
    at("/cards");
    expect(screen.getAllByText("System design").length).toBeGreaterThan(0);
  });

  it("quiz answer flow scores and advances", async () => {
    const user = userEvent.setup();
    at("/quiz/s1");
    await user.click(
      screen.getByText(
        "An interface defined by the inner logic that expresses a need",
      ),
    );
    expect(screen.getByText(/Why:/)).toBeInTheDocument();
    await user.click(screen.getByText("Next"));
    expect(screen.getByText(/2 \/ 12/)).toBeInTheDocument();
  });

  it("persists chapter reads and resets progress", async () => {
    const user = userEvent.setup();
    at("/book/1");
    await user.click(
      screen.getByRole("button", { name: /Coupling and the Direction.*→/ }),
    );
    expect(
      JSON.parse(localStorage.getItem("hexagon-dojo:v2")!)?.readChapters,
    ).toContain(0);
    await user.click(screen.getByRole("button", { name: "Reset progress" }));
    expect(localStorage.getItem("hexagon-dojo:v2")).toBeNull();
    expect(screen.getByText("Why Boundaries Exist")).toBeInTheDocument();
  });
});
