import { analyseRoute, decide } from "./routing-guard";

describe("analyseRoute", () => {
  it("extracts the locale and remaining segments", () => {
    expect(analyseRoute("/ar/settings")).toMatchObject({ locale: "ar", rest: ["settings"], isRoot: false });
    expect(analyseRoute("/en")).toMatchObject({ locale: "en", rest: [], isRoot: true });
    expect(analyseRoute("/en/login")).toMatchObject({ isAuthPage: true });
    expect(analyseRoute("/ar/register")).toMatchObject({ isAuthPage: true });
  });

  it("falls back to the default locale when the prefix is missing", () => {
    expect(analyseRoute("/today")).toMatchObject({ locale: "ar", rest: ["today"] });
  });
});

describe("decide", () => {
  it("sends anonymous users to login with a locale-less next path", () => {
    const d = decide(analyseRoute("/en/today"), false, "?tab=x");
    expect(d).toEqual({ action: "redirect", pathname: "/en/login", next: "/today?tab=x" });
  });

  it("omits next for the locale root", () => {
    expect(decide(analyseRoute("/ar"), false)).toEqual({ action: "redirect", pathname: "/ar/login" });
  });

  it("lets anonymous users reach auth pages", () => {
    expect(decide(analyseRoute("/ar/login"), false)).toEqual({ action: "allow" });
    expect(decide(analyseRoute("/en/register"), false)).toEqual({ action: "allow" });
  });

  it("bounces signed-in users away from auth pages and the root", () => {
    expect(decide(analyseRoute("/en/login"), true)).toEqual({ action: "redirect", pathname: "/en/today" });
    expect(decide(analyseRoute("/ar"), true)).toEqual({ action: "redirect", pathname: "/ar/today" });
  });

  it("allows signed-in users on app pages", () => {
    expect(decide(analyseRoute("/ar/settings"), true)).toEqual({ action: "allow" });
  });
});
