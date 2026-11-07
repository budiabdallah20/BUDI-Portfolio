import { describe, expect, it } from "vitest";
import { canonicalTechnology, skillMatchesTech, skillProjectUsage } from "./skill-usage";
import { technologyHref } from "./project-filter";
describe("project evidence", () => {
 it.each([["React.js","React"],["Next.js","nextjs"],["Tailwind CSS","Tailwind"],["Node.js","nodejs"],["HTML5","HTML"],["Framer Motion","Motion"]])("normalizes %s to %s",(a,b) => expect(skillMatchesTech(a,b)).toBe(true));
 it.each([["Java","JavaScript"],["React","React Native"],["CSS","Tailwind CSS"],["Next.js","Three.js"],["Git","DigitalOcean"],["",""]])("keeps %s distinct from %s",(a,b) => expect(skillMatchesTech(a,b)).toBe(false));
 it("counts each visible matching project once", () => { const result=skillProjectUsage("React",99,[{title:"A",tech:["React","React.js"]},{title:"B",tech:["React"],visible:false},{title:"C",tech:["CSS"]}]); expect(result.count).toBe(1); expect(result.projects).toEqual(["A"]); });
 it("handles empty collections",()=>expect(skillProjectUsage("React",80,[]).count).toBe(0));
 it("encodes technology navigation",()=>{expect(canonicalTechnology("Next.js")).toBe("next");expect(technologyHref("C++")).toBe("?technology=c%2B%2B#projects");});
});