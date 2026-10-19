import { describe, expect, it } from "vitest";
import {
  findDmarcTxt,
  findSpfTxt,
  isValidDomainName,
  parseDohTxt,
  recommendedRecords,
} from "./dns";

describe("isValidDomainName", () => {
  it("accepts real public domains", () => {
    for (const d of ["example.com", "budi-portfolio.vercel.app", "sub.example.co.uk"]) {
      expect(isValidDomainName(d), d).toBe(true);
    }
  });
  it("rejects internal names, IPs and garbage", () => {
    for (const d of [
      "localhost",
      "foo.local",
      "server.internal",
      "127.0.0.1",
      "a..b.com",
      "-bad.com",
      "nodot",
      "x".repeat(254) + ".com",
      "example.lan",
    ]) {
      expect(isValidDomainName(d), d).toBe(false);
    }
  });
});

describe("parseDohTxt", () => {
  it("unquotes single and multi-chunk TXT answers", () => {
    const json = {
      Answer: [
        { type: 16, data: '"v=spf1 -all"' },
        { type: 16, data: '"v=DMARC1; p=reject; " "rua=mailto:a@b.com"' },
        { type: 5, data: "CNAME-not-txt" },
      ],
    };
    expect(parseDohTxt(json)).toEqual(["v=spf1 -all", "v=DMARC1; p=reject; rua=mailto:a@b.com"]);
  });
  it("returns [] for empty or malformed payloads", () => {
    expect(parseDohTxt(null)).toEqual([]);
    expect(parseDohTxt({})).toEqual([]);
    expect(parseDohTxt({ Answer: "nope" })).toEqual([]);
  });
});

describe("SPF/DMARC detection", () => {
  const txts = ['"v=spf1 include:_spf.google.com ~all"', "v=DMARC1; p=none"].map((s) =>
    s.replace(/^"|"$/g, ""),
  );
  it("finds SPF and DMARC case-insensitively", () => {
    expect(findSpfTxt(txts)).toContain("v=spf1");
    expect(findDmarcTxt(["V=DMARC1; p=reject"])).toBe("V=DMARC1; p=reject");
  });
  it("returns null when absent", () => {
    expect(findSpfTxt(["google-site-verification=x"])).toBeNull();
    expect(findDmarcTxt(["v=spf1 -all"])).toBeNull();
  });
});

describe("recommendedRecords", () => {
  it("ships strict SPF + reject DMARC tied to the queried domain", () => {
    const recs = recommendedRecords("example.com");
    const spf = recs.find((r) => r.value.startsWith("v=spf1"));
    const dmarc = recs.find((r) => r.value.startsWith("v=DMARC1"));
    expect(spf?.host).toBe("@");
    expect(dmarc?.host).toBe("_dmarc");
    expect(dmarc?.value).toContain("p=reject");
    expect(dmarc?.value).toContain("mailto:dmarc@example.com");
  });
});
