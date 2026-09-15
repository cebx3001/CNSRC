"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/CNSRC" : "";

const ASSETS = {
  immersive: `${BASE_PATH}/images/immersive-space.png`,
  production: `${BASE_PATH}/images/production-stage.png`,
  spatial: `${BASE_PATH}/images/spatial-lab.png`,
  strategy: `${BASE_PATH}/images/b2w-strategy.png`,
  live: `${BASE_PATH}/images/monarca-live.png`,
  immersiveLab: `${BASE_PATH}/images/brown-immersive.png`,
  deployment: `${BASE_PATH}/images/tridifect-deploy.png`,
};

function KineticText({ children, className = "", label }: { children: string; className?: string; label?: string }) {
  return (
    <span className={`kinetic-text ${className}`} aria-label={label ?? children}>
      {children.split(" ").map((word, wordIndex, words) => (
        <span className="word-unit" aria-hidden="true" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((character, characterIndex) => (
            <span className="char-wrap" key={`${character}-${characterIndex}`}>
              <span className="char">{character}</span>
            </span>
          ))}
          {wordIndex < words.length - 1 && <span className="word-space"> </span>}
        </span>
      ))}
    </span>
  );
}

const companies = [
  { index: "01", name: "B2W AGENCY", role: "ESTRATEGIA, COMUNICACIÓN Y MARKETING", description: "B2W define objetivos, audiencias, posicionamiento, comunicación, campañas, medios, marketing digital y performance.", terms: "STRATEGY / BRAND / AUDIENCES / MEDIA / MARKETING / PERFORMANCE", image: ASSETS.strategy, position: "center 62%" },
  { index: "02", name: "MONARCA MEDIA", role: "PRODUCCIÓN, CONTENIDO Y EVENTOS", description: "Producción audiovisual, fotografía, documental, spots, motion graphics, streaming, multicámara, eventos, BTL y producción ejecutiva.", terms: "FILM / CONTENT / EVENTS / PRODUCTION / STREAMING / BTL", image: ASSETS.live, position: "center center" },
  { index: "03", name: "DOCTOR BROWN LABS", role: "EXPERIENCIAS, MEDIOS INMERSIVOS Y TECNOLOGÍA", description: "Diseño de experiencias, videomapping, fulldome, multiproyección, instalaciones interactivas, XR, spatial computing, web 3D, reconstrucción 3D/4D, gemelos digitales, software, IA, agentes, computer vision, sensores y tracking.", terms: "IMMERSIVE / INTERACTIVE / XR / SPATIAL / 3D / 4D / AI / SOFTWARE", image: ASSETS.immersiveLab, position: "center center", rich: true },
  { index: "04", name: "TRIDIFECT", role: "HARDWARE E INFRAESTRUCTURA", description: "LED, proyección, pantallas táctiles, displays, tótems, sistemas holográficos, integración, montaje y despliegue.", terms: "LED / PROJECTION / DISPLAYS / TOUCH / HARDWARE / DEPLOYMENT", image: ASSETS.deployment, position: "center center" },
];

const combinations = [
  "CAMPAÑA + CONTENIDO + ACTIVACIÓN + EXPERIENCIA DIGITAL",
  "NARRATIVA + PRODUCCIÓN + MAPPING + INTERACCIÓN + SOFTWARE",
  "EVENTO + AUDIOVISUAL + LED + EXPERIENCIA INTERACTIVA",
  "COMUNICACIÓN + 3D + GEMELO DIGITAL + WEB + EXPERIENCIA PRESENCIAL",
];

const totalCapabilities = [
  "COMUNICACIÓN Y CAMPAÑAS",
  "PRODUCCIÓN AUDIOVISUAL",
  "EVENTOS Y ACTIVACIONES",
  "EXPERIENCIAS INMERSIVAS",
  "ESPACIOS Y EXPERIENCIAS DIGITALES",
  "INTELIGENCIA Y SISTEMAS",
  "INFRAESTRUCTURA TECNOLÓGICA",
];

const cases = [
  { number: "01", title: "SISTEMAS QUE CONECTAN NARRATIVA Y ESPACIO", tags: "ESTRATEGIA / CONTENIDO / EXPERIENCIA", image: ASSETS.immersive },
  { number: "02", title: "PRODUCCIÓN QUE SE CONVIERTE EN EXPERIENCIA", tags: "FILM / EVENTO / TECNOLOGÍA", image: ASSETS.production },
  { number: "03", title: "LO FÍSICO Y LO DIGITAL EN UN MISMO SISTEMA", tags: "SPATIAL / 3D / SOFTWARE / HARDWARE", image: ASSETS.spatial },
];

export default function Home() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          root.current?.style.setProperty("--global-progress", progress.toFixed(4));
          root.current?.style.setProperty("--grid-shift", `${progress * 96}px`);
        },
      });

      const hero = root.current?.querySelector<HTMLElement>(".hero");
      if (hero) {
        const rows = gsap.utils.toArray<HTMLElement>(hero.querySelectorAll(".hero-word"));
        const heroTimeline = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 1 } });
        rows.forEach((row, rowIndex) => {
          const chars = row.querySelectorAll(".char");
          const beat = 0.35 + rowIndex * 1.2;
          heroTimeline.fromTo(
            chars,
            { rotateX: rowIndex === 0 ? -20 : (rowIndex % 2 ? 86 : -86), rotateY: rowIndex % 2 ? -18 : 18, scaleY: rowIndex === 0 ? 0.86 : 0.15, opacity: 0 },
            { rotateX: 0, rotateY: 0, scaleY: 1, opacity: 1, duration: 0.56, stagger: { each: 0.022, from: rowIndex === 2 ? "center" : "start" }, ease: "power3.out" },
            beat,
          );
          if (rowIndex < rows.length - 1) {
            heroTimeline.to(chars, { rotateX: 78, scaleY: 0.22, opacity: 0.04, duration: 0.38, stagger: { each: 0.009, from: "edges" }, ease: "power2.in" }, beat + 0.7);
          }
        });
        heroTimeline
          .fromTo(".hero-deck", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7 }, 5.6)
          .fromTo(".hero-rule", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "none" }, 0.35);
      }

      gsap.utils.toArray<HTMLElement>("[data-kinetic]").forEach((section, sectionIndex) => {
        const chars = section.querySelectorAll(".char");
        const mediaBands = section.querySelectorAll(".media-band");
        const rails = section.querySelectorAll(".term-rail");
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1 } });

        timeline.fromTo(
          chars,
          { rotateY: sectionIndex % 2 ? 88 : -88, scaleX: 0.2, opacity: 0.12 },
          { rotateY: 0, scaleX: 1, opacity: 1, stagger: { each: 0.012, from: sectionIndex % 3 === 0 ? "center" : "start" }, duration: 0.8, ease: "power3.out" },
          0,
        );

        if (mediaBands.length) {
          timeline.fromTo(
            mediaBands,
            { clipPath: "inset(0 50% 0 50%)", z: -180, filter: "grayscale(1) contrast(1.25)" },
            { clipPath: "inset(0 0% 0 0%)", z: 0, filter: "grayscale(.2) contrast(1.08)", stagger: 0.08, duration: 1.1, ease: "power2.inOut" },
            0.08,
          );
          timeline.to(
            mediaBands,
            { clipPath: "inset(48% 0 48% 0)", z: 120, stagger: { each: 0.05, from: "edges" }, duration: 0.75 },
            1.55,
          );
        }

        if (rails.length) {
          timeline.fromTo(rails, { "--rail-scale": 0 }, { "--rail-scale": 1, duration: 1.2, ease: "none" }, 0.1);
        }

        timeline.to(
          chars,
          { rotateX: -78, scaleY: 0.18, opacity: 0.1, stagger: { each: 0.008, from: "edges" }, duration: 0.65, ease: "power2.in" },
          1.62,
        );
      });

      const convergenceIntro = root.current?.querySelector<HTMLElement>(".convergence-intro");
      if (convergenceIntro) {
        const chars = convergenceIntro.querySelectorAll(".char");
        const convergenceTimeline = gsap.timeline({ scrollTrigger: { trigger: convergenceIntro, start: "top 48%", end: "bottom 8%", scrub: 1 } });
        convergenceTimeline.fromTo(chars, { rotateY: -88, scaleX: 0.2, opacity: 0.12 }, { rotateY: 0, scaleX: 1, opacity: 1, stagger: { each: 0.012, from: "center" }, duration: 0.8, ease: "power3.out" }, 0.28);
        convergenceTimeline.to(chars, { rotateX: -78, scaleY: 0.18, opacity: 0.1, stagger: { each: 0.008, from: "edges" }, duration: 0.65, ease: "power2.in" }, 1.62);
      }

      gsap.utils.toArray<HTMLElement>(".combo-line").forEach((line, index) => {
        gsap.fromTo(
          line.querySelectorAll(".char"),
          { rotateX: 88, scaleY: 0.1, opacity: 0.08 },
          { rotateX: 0, scaleY: 1, opacity: 1, stagger: { each: 0.01, from: index % 2 ? "edges" : "center" }, scrollTrigger: { trigger: line, start: "top 82%", end: "center 48%", scrub: 0.8 } },
        );
      });

      gsap.utils.toArray<HTMLElement>(".capability-line").forEach((line, index) => {
        gsap.fromTo(
          line.querySelectorAll(".char"),
          { rotateY: index % 2 ? 84 : -84, opacity: 0.08, scaleX: 0.15 },
          { rotateY: 0, opacity: 1, scaleX: 1, stagger: { each: 0.008, from: "center" }, scrollTrigger: { trigger: line, start: "top 78%", end: "center 46%", scrub: true } },
        );
      });

      const casesHead = root.current?.querySelector<HTMLElement>(".cases-head");
      if (casesHead) {
        const title = casesHead.querySelector<HTMLElement>("h2");
        if (title) {
          gsap.fromTo(
            title.querySelectorAll(".char"),
            { rotateY: -88, scaleX: 0.18, opacity: 0.08 },
            { rotateY: 0, scaleX: 1, opacity: 1, stagger: { each: 0.025, from: "center" }, ease: "power3.out", scrollTrigger: { trigger: title, start: "top 82%", end: "top 42%", scrub: 0.9 } },
          );
        }
      }
    }, root);

    return () => context.revert();
  }, []);

  return (
    <main ref={root} className="site-shell">
      <style>{`
        @media (min-width: 821px) {
          .project-scene .project-copy {
            left: auto;
            right: 22px;
            bottom: 52px;
            width: min(34vw, 520px);
            display: block;
            text-align: right;
          }
          .project-scene .project-copy h3 { display: none; }
          .project-scene .project-copy p {
            margin: 0;
            max-width: none;
            font-size: .72rem;
            line-height: 1.25;
            letter-spacing: .08em;
            font-weight: 900;
          }
          .project-scene .term-rail { display: none; }
          .finale-copy {
            left: auto;
            right: 22px;
            bottom: 25%;
            width: min(34vw, 520px);
            max-width: none;
          }
          .finale-companies {
            left: 22px;
            right: 22px;
            bottom: 132px;
            width: auto;
            text-align: left;
          }
        }
      `}</style>
      <div className="procedural-grid" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <header className="site-header"><a href="#top" className="brand-mark" aria-label="Inicio">CNSRC<span>™</span></a><div className="header-axis" aria-hidden="true"><span /></div><a href="#contacto" className="header-link">HABLEMOS <span>↘</span></a></header>

      <section id="top" className="hero scene-dark"><div className="hero-stage"><div className="scene-index">CAPACIDAD INTEGRADA <span>00—05</span></div><div className="hero-sequence" aria-label="Estrategia. Producción. Experiencias. Tecnología. Infraestructura.">{["ESTRATEGIA.", "PRODUCCIÓN.", "EXPERIENCIAS.", "TECNOLOGÍA.", "INFRAESTRUCTURA."].map((word) => <div className="hero-word" key={word}><KineticText>{word}</KineticText></div>)}</div><div className="hero-bottom"><p className="hero-deck">Cuatro empresas especializadas integran sus capacidades para desarrollar proyectos completos, desde la estrategia hasta la implementación.</p><div className="scroll-cue">SCROLL / TIMELINE <span>↓</span></div></div><div className="hero-rule" aria-hidden="true" /></div></section>

      <section className="sum-scene kinetic-scene" data-kinetic><div className="sticky-stage sum-stage"><div className="scene-index dark-index">SISTEMA CONJUNTO <span>01—04</span></div><h2 className="sum-title"><KineticText>UNA ESTRUCTURA MÁS GRANDE QUE LA SUMA DE SUS PARTES.</KineticText></h2><div className="company-weave" aria-label="B2W Agency, Monarca Media, Doctor Brown Labs y Tridifect"><span>B2W AGENCY</span><span>MONARCA MEDIA</span><span>DOCTOR BROWN LABS</span><span>TRIDIFECT</span></div><div className="weave-lines" aria-hidden="true"><i /><i /><i /><i /></div></div></section>

      <section className="company-flow scene-dark">
        {companies.map((company) => (
          <article className={`company-scene kinetic-scene ${company.rich ? "is-rich" : ""}`} data-kinetic key={company.name}>
            <div className="sticky-stage company-stage">
              <div className="company-media" aria-hidden="true">{[0, 1, 2, 3, 4].map((band) => <div className={`media-band band-${band + 1}`} key={band}><img src={company.image} alt="" style={{ objectPosition: company.position }} /></div>)}</div>
              <div className="scene-index">CORRIENTE {company.index} <span>{company.index}—04</span></div>
              <h2 className="company-name"><KineticText>{company.name}</KineticText></h2>
              <div className="company-copy"><h3>{company.role}</h3><p>{company.description}</p></div>
              <div className="term-rail"><span>{company.terms}</span><span aria-hidden="true">{company.terms}</span></div>
            </div>
          </article>
        ))}
      </section>

      <section className="convergence scene-light"><div className="convergence-intro"><div className="scene-index dark-index">CONVERGENCIA <span>04→01</span></div><h2><KineticText>JUNTAS, ESTAS CAPACIDADES PERMITEN HACER MUCHO MÁS.</KineticText></h2></div><div className="combinations">{combinations.map((line, index) => <div className="combo-line" key={line}><span className="combo-number">0{index + 1}</span><KineticText>{line}</KineticText></div>)}</div></section>

      <section className="total-capacity scene-dark"><div className="capacity-heading"><div className="scene-index">CAPACIDAD TOTAL <span>07 CAMPOS</span></div><p>UNA SOLA ESTRUCTURA / DE LA IDEA AL DESPLIEGUE</p></div><div className="capability-list">{totalCapabilities.map((capability, index) => <div className="capability-line" key={capability}><span className="cap-number">{String(index + 1).padStart(2, "0")}</span><KineticText>{capability}</KineticText></div>)}</div></section>

      <section className="cases scene-light" aria-labelledby="cases-title">
        <div className="cases-head"><div className="scene-index dark-index">CASOS / MARCOS ABIERTOS <span>03</span></div><h2 id="cases-title" style={{ fontSize: "clamp(5rem, 15vw, 15rem)", lineHeight: 0.78, whiteSpace: "nowrap" }}><KineticText>PROYECTOS</KineticText></h2></div>
        {cases.map((project) => (
          <article className="company-scene kinetic-scene project-scene" data-kinetic key={project.number} style={{ color: "var(--paper)", borderTop: "1px solid var(--line-dark)" }}>
            <div className="sticky-stage company-stage">
              <div className="company-media" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((band) => (
                  <div className={`media-band band-${band + 1}`} key={band}><img src={project.image} alt="" /></div>
                ))}
              </div>
              <div className="scene-index">PROYECTO {project.number} <span>{project.number}—03</span></div>
              <h2 className="company-name project-name" style={{ whiteSpace: "normal" }}><KineticText>{project.title}</KineticText></h2>
              <div className="company-copy project-copy"><h3>PROYECTO {project.number}</h3><p>{project.tags}</p></div>
              <div className="term-rail"><span>{project.tags}</span><span aria-hidden="true">{project.tags}</span></div>
            </div>
          </article>
        ))}
      </section>

      <footer id="contacto" className="finale scene-light kinetic-scene" data-kinetic><div className="sticky-stage finale-stage"><div className="scene-index dark-index">SIGUIENTE PROYECTO <span>∞</span></div><h2><KineticText>DE LA ESTRATEGIA A LA IMPLEMENTACIÓN.</KineticText></h2><p className="finale-copy">Una estructura capaz de pensar, producir, desarrollar e implementar proyectos completos.</p><div className="finale-companies">B2W AGENCY · MONARCA MEDIA · DOCTOR BROWN LABS · TRIDIFECT</div><a className="contact-link" href="mailto:proyectos@cnsrc.com"><span>HABLEMOS DE TU PROYECTO</span><span aria-hidden="true">↗</span></a><div className="footer-line"><span>CNSRC / 2026</span><a href="#top">VOLVER ARRIBA ↑</a></div></div></footer>
    </main>
  );
}
