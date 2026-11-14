import { useId } from "react";

export default function ServiceRelief({ name, category }: { name: string; category?: string }) {
  const metal = useId();
  const stone = useId();
  const enamel = useId();
  const kind = /maintenance|support|assistance/i.test(name) ? "restore"
    : /clinic|cabinet|dent|system|système|database|api/i.test(name) || category === "backend" ? "system" : "build";
  const photo = { build: "web", restore: "maintenance", system: "systems" }[kind];
  return <>
    <img className="service-exhibit-photo" src={`/images/services/exhibit-${photo}.webp`} alt="" loading="lazy" decoding="async" />
    <svg className="master-service-relief" viewBox="0 0 400 240" aria-hidden="true">
    <defs><linearGradient id={enamel} x2="0" y2="1"><stop stopColor="#3d514c"/><stop offset="1" stopColor="#141b1a"/></linearGradient><linearGradient id={stone} x2="0" y2="1"><stop stopColor="#70543b"/><stop offset=".38" stopColor="#39271d"/><stop offset="1" stopColor="#130e0c"/></linearGradient><linearGradient id={metal} x2=".75" y2="1"><stop stopColor="#f4d66a"/><stop offset=".45" stopColor="#b88a40"/><stop offset="1" stopColor="#5f4024"/></linearGradient></defs>
    <path d="M49 213 64 66l24-27h224l24 27 15 147H49Zm45-18h212L293 79H107Z" fill={`url(#${stone})`} fillRule="evenodd" stroke="#8c6942"/>
    <path d="M73 82h28m-30 25h26m-29 25h27m-29 25h26m209-75h27m-26 25h29m-27 25h29m-27 25h30" stroke="#c49553" strokeOpacity=".45"/>
    <path d="M108 52h184m-164 6h144M81 190l17-102m221 102L302 88" fill="none" stroke="#d4af37" strokeOpacity=".42" />
    <path d="M54 214h292l16 14H38Zm17-13h258v13H71Z" fill="#5b412a" stroke="#b08a55"/>
    <path d="M69 47h262l18-15H51ZM84 49 71 195h26l12-146m182 0 12 146h26L316 49" fill="#3c2920" stroke="#96704b"/>
    <g className="master-relief-object" fill="#151316" stroke={`url(#${metal})`} strokeWidth="3" strokeLinejoin="round">
      {kind === "build" && <>
        <path d="m102 72 133-11 48 30-132 15z" fill="#645034"/><path d="M102 72v84l49 31v-81z" fill="#29241d"/>
        <path d="m151 106 132-15v86l-132 10Z" fill={`url(#${enamel})`}/><path d="m181 144-8 8 8 6m13-15 8 6-8 8" fill="none" stroke="#f2d16b" strokeWidth="2"/><path d="m151 123 132-14m-112 29 36-4v30l-36 4Zm50-5 42-5m-42 16 42-5m-42 16 29-3" fill="none"/>
        <path d="m127 109 19 12m-19 5 19 12m-19 5 19 12" stroke="#b89457" strokeWidth="1"/><path d="m269 127 38-6v66l-38 5Z" fill="#302820"/><path d="m278 143 20-3m-20 12 20-3m-20 12 13-2"/>
      </>}
      {kind === "restore" && <>
        <path d="M118 120q82-100 164 0-82 100-164 0Z" fill="#392029"/><circle cx="200" cy="120" r="47"/><circle cx="200" cy="120" r="34" fill="#4a3030"/><path d="M183 103a24 24 0 0 1 33-2m1 0v-8m0 8h-8M218 138a24 24 0 0 1-34 1m0 0v8m0-8h8" fill="none" strokeWidth="2"/><circle cx="200" cy="120" r="55" strokeDasharray="2 6" fill="none" opacity=".66"/>
        <path d="M200 58v14m0 96v14m-62-62h14m96 0h14m-82 2 13 12 27-31" fill="none" strokeWidth="5"/>
        <path d="m103 151 13 12-13 12-13-12Zm194 0 13 12-13 12-13-12Z"/>
      </>}
      {kind === "system" && <>
        <path d="m200 59 47 24v54l-47 25-47-25V83Z" fill="#263530"/><path d="m153 83 47 24 47-24m-47 24v55"/>
        <path d="m186 83 14-7 14 7-14 7Zm-34 37h-27l-21 25m143-25h29l22 25m-98 17v20"/>
        <path d="M91 170h27m164 0h30m-126 30h28" strokeWidth="1"/><path d="m180 111 20 10 20-10m-40 13 20 10 20-10m-40 13 20 10 20-10" fill="none" strokeWidth="2"/><circle cx="104" cy="147" r="12"/><circle cx="298" cy="147" r="12"/><circle cx="200" cy="183" r="10"/>
      </>}
    </g>
    </svg>
  </>;
}
