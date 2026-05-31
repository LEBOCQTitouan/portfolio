import { describe, it, expect } from "vitest";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
function keys(o: object, p = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v as object, `${p}${k}.`) : [`${p}${k}`]);
}
describe("dictionaries", () => {
  it("fr has exactly the same keys as en", () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });
});
