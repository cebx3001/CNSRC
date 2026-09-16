"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CnsrcAudioEngine, type AudioScene } from "./audio-engine";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/CNSRC" : "";

const ASSETS = {
  immersive: `${BASE_PATH}/images/immersive-space.png`,
  production: `${BASE_PATH}/images/production-stage.png`,
  spatial: `${BASE_PATH}/images/spatial-lab.png`,
  strategy: `${BASE_PATH}/images/b2w-strategy.png`,
  live: `${BASE_PATH}/images/monarca-live.png`,
  immersiveLab: `${BASE_PATH}/images/brown-immersive.png`,
  interactiveLab: `${BASE_PATH}/images/brown-interactive-v2.png`,
  deployment: `${BASE_PATH}/images/tridifect-deploy.png`,
  mall: `${BASE_PATH}/images/project-mall-activation.png`,
  campaign: `${BASE_PATH}/images/project-campaign-360.png`,
  corporate: `${BASE_PATH}/images/project-corporate-center.png`,
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
  {
    index: "01",
    audioScene: "b2w" as AudioScene,
    name: "B2W AGENCY",
    role: "ESTRATEGIA, COMUNICACIÓN Y MARKETING",
    paragraphs: [
      "B2W trabaja en el punto donde una idea, una empresa, un producto o una iniciativa necesita encontrar una posición clara frente al mercado y frente a las personas. Parte de los objetivos del proyecto para comprender a quién necesita llegar, qué comportamiento busca generar y qué propuesta puede conectar de manera relevante con su audiencia.",
      "A partir de esa lectura construye estrategias de marca, comunicación y campaña, definiendo cómo una propuesta debe presentarse y circular a través de medios, canales y diferentes momentos de contacto. La estrategia continúa en el entorno digital mediante planificación de medios, marketing, performance, SEO/SEM y generación de demanda.",
      "El recorrido no termina cuando una persona ve una campaña. La integración de adquisición, leads, CRM, seguimiento y medición permite conectar comunicación con resultados y construir relaciones que puedan continuar y optimizarse en el tiempo.",
    ],
    terms: "STRATEGY / BRAND / AUDIENCES / MEDIA / MARKETING / PERFORMANCE",
    images: [ASSETS.strategy],
    position: "center 62%",
  },
  {
    index: "02",
    audioScene: "monarca" as AudioScene,
    name: "MONARCA / 7 STUDIO",
    role: "PRODUCCIÓN, CONTENIDO, EVENTOS Y EJECUCIÓN",
    paragraphs: [
      "Monarca / 7 Studio es una asociación que reúne capacidades de producción audiovisual, creación de contenidos, producción de eventos y ejecución de proyectos. La integración de ambos equipos permite abordar una producción desde su desarrollo creativo y planificación hasta todo lo necesario para llevarla a cámara, a una plataforma, a un escenario o al espacio público.",
      "Su trabajo comprende comerciales, fotografía, documental, contenidos digitales, motion graphics, streaming y producción multicámara. Esa capacidad audiovisual se conecta con la producción de eventos, activaciones y acciones BTL, coordinando equipos creativos y técnicos, talento, locaciones, proveedores, logística y operación en campo.",
      "La asociación permite trabajar proyectos en los que contenido y ejecución no son procesos separados. Una campaña puede convertirse en producción audiovisual; esa producción puede extenderse hacia un evento o una activación; y todos sus componentes pueden organizarse bajo una misma producción ejecutiva hasta su implementación.",
    ],
    terms: "FILM / CONTENT / EVENTS / PRODUCTION / STREAMING / BTL",
    images: [ASSETS.live],
    position: "center center",
  },
  {
    index: "03",
    audioScene: "brown" as AudioScene,
    name: "DOCTOR BROWN LABS",
    role: "DISEÑO DE EXPERIENCIAS, MEDIOS INMERSIVOS Y TECNOLOGÍA",
    paragraphs: [
      "Doctor Brown Labs diseña y desarrolla experiencias en las que comunicación, espacio y tecnología funcionan como un mismo sistema. Su trabajo parte de cómo las personas perciben, recorren, observan, escuchan, tocan y participan para convertir contenido e información en experiencias físicas y digitales.",
      "Desarrolla videomapping, pixel mapping, multiproyección, fulldome, instalaciones interactivas, XR y spatial computing, además de aplicaciones, plataformas web, experiencias 3D, sistemas en tiempo real y software creado específicamente para las necesidades de cada proyecto.",
      "También integra reconstrucción 3D/4D, gemelos digitales, inteligencia artificial, agentes, visión computacional, sensores y tracking para construir entornos capaces de visualizar información, reaccionar, transformarse y responder a las personas.",
      "La tecnología no aparece como un elemento añadido al final del proceso. Forma parte del diseño de la experiencia desde su origen.",
    ],
    terms: "IMMERSIVE / INTERACTIVE / XR / SPATIAL / 3D / 4D / AI / SOFTWARE",
    images: [ASSETS.interactiveLab],
    position: "center center",
    rich: true,
  },
  {
    index: "04",
    audioScene: "tridifect" as AudioScene,
    name: "TRIDIFECT",
    role: "HARDWARE, INTEGRACIÓN E INFRAESTRUCTURA",
    paragraphs: [
      "Tridifect convierte los sistemas audiovisuales y digitales en infraestructura física operativa. Integra proyectores, sistemas LED, pantallas táctiles, displays, tótems, soluciones holográficas y diferentes tecnologías de visualización necesarias para llevar una experiencia al espacio real.",
      "Su trabajo comprende la selección y configuración del equipamiento, la integración entre dispositivos, el montaje y la instalación en sitio. Desde una pantalla de gran formato hasta una infraestructura audiovisual distribuida, cada componente se incorpora como parte de un sistema preparado para operar en condiciones reales.",
      "Tridifect aporta la capacidad material de la estructura: el hardware, la integración y el despliegue necesarios para que aquello que fue diseñado y desarrollado pueda finalmente instalarse, encenderse y funcionar.",
    ],
    terms: "LED / PROJECTION / DISPLAYS / TOUCH / HARDWARE / DEPLOYMENT",
    images: [ASSETS.deployment],
    position: "center center",
  },
];

const convergencePoints = [
  { number: "01", title: "UNA IDEA", statement: "Una idea puede convertirse en un proyecto completo sin fragmentarse entre proveedores.", body: "Estrategia, comunicación, producción, tecnología e infraestructura pueden desarrollarse dentro de una misma estructura, manteniendo una dirección común desde el concepto inicial hasta la implementación." },
  { number: "02", title: "UN PROYECTO", statement: "Un proyecto puede existir al mismo tiempo en medios, pantallas, espacios, eventos y plataformas digitales.", body: "Una misma narrativa puede atravesar una campaña, convertirse en contenido, ocupar un espacio físico, generar interacción y continuar en plataformas digitales sin convertirse en proyectos independientes." },
  { number: "03", title: "UN ESPACIO", statement: "Un espacio puede comunicar, mostrar, responder e interactuar.", body: "Imagen, sonido, iluminación, pantallas, proyección, sensores, contenido y software pueden transformar un entorno físico en una parte activa del proyecto." },
  { number: "04", title: "DE LA IDEA AL MUNDO REAL", statement: "Podemos diseñar la idea, producir lo que necesita, construir la tecnología y desplegarla en el mundo real.", body: "Desde la definición estratégica hasta el momento en que una persona finalmente ve, utiliza o interactúa con el proyecto." },
];

const totalCapabilities = [
  { title: "LANZAMIENTOS", statement: "De la estrategia de mercado al evento de lanzamiento.", body: "Posicionamiento, campaña, publicidad, contenido, medios, producción audiovisual, presentación de producto, activaciones, eventos, plataformas digitales, CRM e infraestructura pueden operar como partes de un mismo lanzamiento. La comunicación construye expectativa y audiencia; la producción crea el contenido y materializa el acontecimiento; la tecnología extiende la presentación hacia nuevas formas de interacción; y la infraestructura permite llevarla al espacio físico." },
  { title: "AUDIENCIAS", statement: "De la primera impresión a una relación medible.", body: "Una campaña puede atraer a una persona, un contenido despertar su interés y una activación convertir ese interés en participación. Plataformas digitales, registros y CRM permiten que esa relación continúe. Publicidad, medios, contenido, performance, experiencias presenciales y canales digitales forman un único recorrido para atraer, convertir, conocer y mantener una audiencia." },
  { title: "ESPACIOS", statement: "Espacios que comunican, muestran, responden y venden.", body: "Tiendas, showrooms, centros de experiencia, espacios corporativos, escenarios y entornos públicos pueden integrar contenido audiovisual, LED, proyección, sonido, pantallas táctiles, sensores, software e interacción. El espacio deja de ser únicamente soporte físico y se convierte en un medio capaz de presentar información, demostrar productos y conectar lo presencial con sistemas digitales." },
  { title: "ACONTECIMIENTOS", statement: "Eventos que empiezan antes de abrir las puertas y continúan después de cerrarlas.", body: "Estrategia, campaña y convocatoria construyen el público. Producción audiovisual, escenario, contenido, streaming, instalaciones y activaciones construyen el acontecimiento. Las plataformas digitales permiten extenderlo más allá del lugar y del momento en que sucede." },
  { title: "COMUNICACIÓN COMPLEJA", statement: "Hacer visible, comprensible y atractivo lo que es difícil de explicar.", body: "Productos tecnológicos, procesos industriales, servicios, información, datos o sistemas complejos pueden convertirse en narrativas que las personas puedan comprender y explorar. Audiovisual, motion graphics, visualización, 3D, simulación, interfaces, instalaciones y sistemas interactivos transforman información abstracta en algo visible, navegable y comprensible." },
  { title: "FÍSICO + DIGITAL", statement: "Una experiencia que continúa entre el espacio, el teléfono y la web.", body: "Una interacción puede comenzar frente a una instalación, continuar desde un teléfono y permanecer disponible posteriormente en una plataforma digital. Aplicaciones, web, 3D, XR, contenido, sensores, instalaciones y sistemas conectados permiten diseñar recorridos en los que el espacio físico y el entorno digital funcionan como una sola experiencia." },
  { title: "DESPLIEGUE", statement: "Una misma experiencia, lista para operar en diez, cien o mil puntos.", body: "Una campaña, activación o sistema puede diseñarse desde el principio para reproducirse en sucursales, puntos de venta, ferias, eventos o diferentes ciudades. Contenido, software, hardware e infraestructura se desarrollan como componentes modulares que pueden instalarse, actualizarse y adaptarse manteniendo una misma estrategia y una misma identidad." },
];

const cases = [
  {
    number: "01",
    audioScene: "project-mall" as AudioScene,
    title: "CENTRO COMERCIAL",
    statement: "Un centro comercial puede convertirse en una experiencia que empieza en la campaña y ocupa todo el espacio.",
    paragraphs: [
      "Una temporada comercial puede construirse como un proyecto integral con identidad, estrategia de comunicación y una programación capaz de transformar diferentes zonas del centro comercial en puntos de actividad.",
      "La campaña atrae tráfico y conecta promociones, contenidos y acontecimientos. La producción desarrolla piezas audiovisuales, fotografía, programación, eventos y contenido específico para las distintas etapas del proyecto.",
      "Plazas, corredores y áreas comunes pueden incorporar grandes instalaciones, LED, proyección, pantallas, juegos, experiencias interactivas y activaciones distribuidas. Una capa digital conecta la participación con promociones, comercios, registros y programas de fidelización.",
      "La actividad dentro del centro genera a su vez fotografía, audiovisual y contenido que regresa a medios y redes, extendiendo el proyecto más allá del espacio físico.",
      "El centro comercial deja de ser únicamente el lugar donde ocurre la campaña y se convierte en el medio, el contenido y la experiencia.",
    ],
    tags: "CAMPAÑA / ESPACIO / ACTIVACIÓN / EXPERIENCIA",
    images: [ASSETS.mall, ASSETS.immersive, ASSETS.mall, ASSETS.deployment, ASSETS.mall],
  },
  {
    number: "02",
    audioScene: "project-campaign" as AudioScene,
    title: "CAMPAÑA 360°",
    statement: "Una campaña que no solamente se ve. Se encuentra en la calle, se vive y se puede medir.",
    paragraphs: [
      "La estrategia define el mensaje, las audiencias y los objetivos. Publicidad, medios, contenido audiovisual y comunicación digital construyen alcance y mantienen una narrativa común a través de diferentes canales.",
      "La campaña sale de los medios y ocupa el espacio público mediante eventos, activaciones móviles, pantallas urbanas, LED, instalaciones participativas, displays táctiles, proyecciones e intervenciones capaces de generar contacto directo con las personas.",
      "Web, aplicaciones, códigos QR, registro y CRM conectan la participación presencial con el entorno digital. Cada acción puede generar datos, contactos y nuevas oportunidades de interacción.",
      "La producción audiovisual documenta lo que sucede y lo convierte nuevamente en contenido para medios, redes y plataformas digitales, haciendo que la actividad física continúe amplificando la campaña.",
      "Publicidad, contenido, producción, eventos, tecnología e infraestructura funcionan como partes de una misma operación de comunicación.",
    ],
    tags: "MEDIOS / CALLE / EVENTO / DATOS / PRODUCCIÓN",
    images: [ASSETS.campaign, ASSETS.live, ASSETS.campaign, ASSETS.production, ASSETS.campaign],
  },
  {
    number: "03",
    audioScene: "project-corporate" as AudioScene,
    title: "CENTRO DE EXPERIENCIA CORPORATIVO",
    statement: "Un espacio donde una empresa puede mostrar lo que hace en lugar de solamente explicarlo.",
    paragraphs: [
      "Productos, procesos, datos y tecnologías complejas pueden convertirse en un espacio permanente diseñado para recibir clientes, socios, inversionistas, equipos comerciales y visitantes.",
      "La estrategia organiza qué necesita comunicar la empresa y construye el recorrido alrededor de diferentes audiencias. La producción transforma información técnica en narrativa, fotografía, audiovisual, motion graphics, visualización y contenido.",
      "El espacio integra productos y demostraciones reales con grandes superficies digitales, LED, proyección, visualización 3D, mesas y pantallas interactivas, interfaces, sensores y sistemas capaces de mostrar información en tiempo real.",
      "El contenido puede adaptarse a diferentes visitantes, actualizarse cuando cambian productos o servicios y conectarse con plataformas digitales y herramientas comerciales.",
      "El resultado es un espacio permanente de comunicación, demostración y venta donde contenido, tecnología e infraestructura hacen visible aquello que antes solo podía explicarse.",
    ],
    tags: "ARQUITECTURA / CONTENIDO / INTERACCIÓN / DATOS",
    images: [ASSETS.corporate, ASSETS.spatial, ASSETS.corporate, ASSETS.interactiveLab, ASSETS.corporate],
  },
];

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const audio = useRef<CnsrcAudioEngine | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const toggleAudio = useCallback(async () => {
    if (!audio.current) audio.current = new CnsrcAudioEngine();
    if (audioEnabled) {
      audio.current.setMuted(true);
      setAudioEnabled(false);
      return;
    }

    await audio.current.start();
    const viewportCenter = window.innerHeight / 2;
    const currentSection = Array.from(document.querySelectorAll<HTMLElement>("[data-audio-scene]"))
      .find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
      });
    const scene = currentSection?.dataset.audioScene as AudioScene | undefined;
    if (scene) audio.current.enterScene(scene);
    setAudioEnabled(true);
  }, [audioEnabled]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.matchMedia("(max-width: 820px)").matches;

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (state) => {
          const { progress } = state;
          root.current?.style.setProperty("--global-progress", progress.toFixed(4));
          root.current?.style.setProperty("--grid-shift", `${progress * 96}px`);
          audio.current?.setGlobalState(progress, state.getVelocity());
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
        const storySteps = section.querySelectorAll<HTMLElement>(".story-step");
        const statements = section.querySelectorAll<HTMLElement>(".scene-statement");
        const mobileSequencedScene = isMobile && (section.classList.contains("company-scene") || section.classList.contains("finale"));
        const lead = mobileSequencedScene ? 0.5 : 0;
        const mediaCloseAt = storySteps.length ? lead + 1.15 + storySteps.length * 0.74 : (mobileSequencedScene ? 2.25 : 1.55);
        const charsCloseAt = mediaCloseAt + 0.12;
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 1 } });

        timeline.fromTo(
          chars,
          { rotateY: sectionIndex % 2 ? 88 : -88, scaleX: 0.2, opacity: 0.12 },
          { rotateY: 0, scaleX: 1, opacity: 1, stagger: { each: 0.012, from: sectionIndex % 3 === 0 ? "center" : "start" }, duration: 0.8, ease: "power3.out" },
          lead,
        );

        if (mediaBands.length) {
          timeline.fromTo(
            mediaBands,
            { clipPath: "inset(0 50% 0 50%)", z: -180, filter: "grayscale(1) contrast(1.25)" },
            { clipPath: "inset(0 0% 0 0%)", z: 0, filter: "grayscale(.2) contrast(1.08)", stagger: 0.08, duration: 1.1, ease: "power2.inOut" },
            lead + 0.08,
          );
          timeline.to(
            mediaBands,
            { clipPath: "inset(48% 0 48% 0)", z: 120, stagger: { each: 0.05, from: "edges" }, duration: 0.75 },
            mediaCloseAt,
          );
        }

        if (rails.length) {
          timeline.fromTo(rails, { "--rail-scale": 0 }, { "--rail-scale": 1, duration: 1.2, ease: "none" }, lead + 0.1);
        }

        if (statements.length) {
          timeline.fromTo(statements, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" }, lead + 0.46);
        }

        storySteps.forEach((step, stepIndex) => {
          const stepAt = lead + 0.88 + stepIndex * 0.74;
          timeline.fromTo(step, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, ease: "power2.out" }, stepAt);
          if (stepIndex < storySteps.length - 1) {
            timeline.to(step, { y: -12, opacity: 0, duration: 0.2, ease: "power2.in" }, stepAt + 0.5);
          }
        });

        timeline.to(
          chars,
          { rotateX: -78, scaleY: 0.18, opacity: 0.1, stagger: { each: 0.008, from: "edges" }, duration: 0.65, ease: "power2.in" },
          charsCloseAt,
        );
      });

      const convergenceIntro = root.current?.querySelector<HTMLElement>(".convergence-intro");
      if (convergenceIntro) {
        const chars = convergenceIntro.querySelectorAll(".char");
        const convergenceTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: convergenceIntro,
            start: isMobile ? "top 8%" : "top 48%",
            end: isMobile ? "bottom top" : "bottom 8%",
            scrub: 1,
          },
        });
        convergenceTimeline.fromTo(
          chars,
          { rotateY: -88, scaleX: 0.2, opacity: 0.12 },
          { rotateY: 0, scaleX: 1, opacity: 1, stagger: { each: 0.012, from: "center" }, duration: 0.8, ease: "power3.out" },
          isMobile ? 0 : 0.28,
        );
        convergenceTimeline.to(
          chars,
          { rotateX: -78, scaleY: 0.18, opacity: 0.1, stagger: { each: 0.008, from: "edges" }, duration: 0.65, ease: "power2.in" },
          isMobile ? 1.95 : 1.62,
        );
      }

      gsap.utils.toArray<HTMLElement>(".combo-line").forEach((line, index) => {
        gsap.fromTo(
          line.querySelectorAll(".char"),
          { rotateX: 88, scaleY: 0.1, opacity: 0.08 },
          {
            rotateX: 0,
            scaleY: 1,
            opacity: 1,
            stagger: { each: 0.01, from: index % 2 ? "edges" : "center" },
            scrollTrigger: {
              trigger: line,
              start: isMobile ? "top 62%" : "top 82%",
              end: isMobile ? "top 28%" : "center 48%",
              scrub: 0.8,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".capability-line").forEach((line, index) => {
        gsap.fromTo(
          line.querySelectorAll(".char"),
          { rotateY: index % 2 ? 84 : -84, opacity: 0.08, scaleX: 0.15 },
          {
            rotateY: 0,
            opacity: 1,
            scaleX: 1,
            stagger: { each: 0.008, from: "center" },
            scrollTrigger: {
              trigger: line,
              start: isMobile ? "top 62%" : "top 78%",
              end: isMobile ? "top 28%" : "center 46%",
              scrub: true,
            },
          },
        );
      });

      const casesHead = root.current?.querySelector<HTMLElement>(".cases-head");
      if (casesHead) {
        const title = casesHead.querySelector<HTMLElement>("h2");
        if (title) {
          gsap.fromTo(
            title.querySelectorAll(".char"),
            { rotateY: -88, scaleX: 0.18, opacity: 0.08 },
            {
              rotateY: 0,
              scaleX: 1,
              opacity: 1,
              stagger: { each: 0.025, from: "center" },
              ease: "power3.out",
              scrollTrigger: {
                trigger: title,
                start: isMobile ? "top 68%" : "top 82%",
                end: isMobile ? "top 32%" : "top 42%",
                scrub: 0.9,
              },
            },
          );
        }
      }

      gsap.utils.toArray<HTMLElement>("[data-audio-scene]").forEach((section) => {
        const scene = section.dataset.audioScene as AudioScene;
        const hasMedia = Boolean(section.querySelector(".media-band"));
        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onEnter: () => audio.current?.enterScene(scene),
          onEnterBack: () => audio.current?.enterScene(scene),
          onUpdate: (state) => {
            const arc = Math.sin(state.progress * Math.PI);
            const density = hasMedia ? 0.25 + arc * 0.75 : 0.12 + arc * 0.52;
            audio.current?.setSceneState(scene, state.progress, state.getVelocity(), density);
          },
        });
      });
    }, root);

    return () => {
      context.revert();
      audio.current?.destroy();
      audio.current = null;
    };
  }, []);

  return (
    <main ref={root} className="site-shell">
      <style>{`
        @media (min-width: 821px) {
          .project-scene .project-copy {
            left: 22px;
            right: auto;
            bottom: 88px;
            width: min(720px, 52vw);
            text-align: left;
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
      <header className="site-header"><a href="#top" className="brand-mark" aria-label="Inicio">CNSRC<span>™</span></a><div className="header-axis" aria-hidden="true"><span /></div><button className="sound-toggle" type="button" role="switch" aria-checked={audioEnabled} aria-label={audioEnabled ? "Desactivar sonido" : "Activar sonido"} onClick={toggleAudio}><span>SONIDO</span><i aria-hidden="true"><b /><b /><b /></i></button><a href="#contacto" className="header-link">HABLEMOS <span>↘</span></a></header>

      <section id="top" className="hero scene-dark" data-audio-scene="hero"><div className="hero-stage"><div className="scene-index">CAPACIDAD INTEGRADA <span>00—05</span></div><div className="hero-sequence" aria-label="Estrategia. Producción. Experiencias. Tecnología. Infraestructura.">{["ESTRATEGIA.", "PRODUCCIÓN.", "EXPERIENCIAS.", "TECNOLOGÍA.", "INFRAESTRUCTURA."].map((word) => <div className="hero-word" key={word}><KineticText>{word}</KineticText></div>)}</div><div className="hero-bottom"><p className="hero-deck">Cuatro empresas especializadas integran sus capacidades para desarrollar proyectos completos, desde la estrategia hasta la implementación.</p><div className="scroll-cue">SCROLL / TIMELINE <span>↓</span></div></div><div className="hero-rule" aria-hidden="true" /></div></section>

      <section className="sum-scene kinetic-scene" data-kinetic data-audio-scene="sum">
        <div className="sticky-stage sum-stage">
          <div className="scene-index dark-index">SISTEMA CONJUNTO <span>01—04</span></div>
          <h2 className="sum-title"><KineticText>UNA ESTRUCTURA MÁS GRANDE QUE LA SUMA DE SUS PARTES.</KineticText></h2>
          <p className="sum-copy scene-statement">Cuatro especialidades diferentes trabajando como una sola estructura. Estrategia y comunicación, producción y ejecución, diseño y desarrollo tecnológico, infraestructura e implementación se integran para abordar cada proyecto como un sistema completo.</p>
          <div className="company-weave" aria-label="B2W Agency, Monarca / 7 Studio, Doctor Brown Labs y Tridifect"><span>B2W AGENCY</span><span>MONARCA / 7 STUDIO</span><span>DOCTOR BROWN LABS</span><span>TRIDIFECT</span></div>
          <div className="weave-lines" aria-hidden="true"><i /><i /><i /><i /></div>
        </div>
      </section>

      <section className="company-flow scene-dark">
        {companies.map((company) => (
          <article className={`company-scene kinetic-scene ${company.rich ? "is-rich" : ""}`} data-kinetic data-audio-scene={company.audioScene} key={company.name}>
            <div className="sticky-stage company-stage">
              <div className={`company-media ${company.images.length > 1 ? "is-mosaic" : ""}`} aria-hidden="true">{[0, 1, 2, 3, 4].map((band) => <div className={`media-band band-${band + 1}`} key={band}><img src={company.images[band % company.images.length]} alt="" style={{ objectPosition: company.position }} /></div>)}</div>
              <div className="scene-index">CORRIENTE {company.index} <span>{company.index}—04</span></div>
              <h2 className="company-name"><KineticText>{company.name}</KineticText></h2>
              <div className="company-copy">
                <h3>{company.role}</h3>
                <div className="company-story">{company.paragraphs.map((paragraph, index) => <p className="story-step" key={paragraph}><span>{String(index + 1).padStart(2, "0")}</span>{paragraph}</p>)}</div>
              </div>
              <div className="term-rail"><span>{company.terms}</span><span aria-hidden="true">{company.terms}</span></div>
            </div>
          </article>
        ))}
      </section>

      <section className="convergence scene-light" data-audio-scene="convergence">
        <div className="convergence-intro"><div className="scene-index dark-index">CONVERGENCIA <span>04→01</span></div><h2><KineticText>JUNTAS, ESTAS CAPACIDADES PERMITEN HACER MUCHO MÁS.</KineticText></h2></div>
        <div className="combinations">{convergencePoints.map((point) => <article className="combo-line" key={point.number}><span className="combo-number">{point.number}</span><div className="combo-content"><h3><KineticText>{point.title}</KineticText></h3><p className="editorial-statement">{point.statement}</p><p className="editorial-body">{point.body}</p></div></article>)}</div>
      </section>

      <section className="total-capacity scene-dark" data-audio-scene="capacity">
        <div className="capacity-heading"><div className="scene-index">UNA MISMA ESTRUCTURA <span>07 CAMPOS</span></div><p>PROYECTOS DE MUY DISTINTA ESCALA Y NATURALEZA</p></div>
        <div className="capability-list">{totalCapabilities.map((capability, index) => <article className="capability-line" key={capability.title}><span className="cap-number">{String(index + 1).padStart(2, "0")}</span><div className="capability-content"><h3><KineticText>{capability.title}</KineticText></h3><p className="editorial-statement">{capability.statement}</p><p className="editorial-body">{capability.body}</p></div></article>)}</div>
      </section>

      <section className="cases scene-light" aria-labelledby="cases-title">
        <div className="cases-head"><div className="scene-index dark-index">PROYECTOS INTEGRALES <span>03</span></div><h2 id="cases-title"><KineticText>PROJECTS</KineticText></h2></div>
        {cases.map((project) => (
          <article className="company-scene kinetic-scene project-scene" data-kinetic data-audio-scene={project.audioScene} key={project.number} style={{ color: "var(--paper)", borderTop: "1px solid var(--line-dark)" }}>
            <div className="sticky-stage company-stage">
              <div className="company-media is-mosaic" aria-hidden="true">
                {project.images.map((image, band) => <div className={`media-band band-${band + 1}`} key={`${project.number}-${band}`}><img src={image} alt="" /></div>)}
              </div>
              <div className="scene-index">PROYECTO {project.number} <span>{project.number}—03</span></div>
              <h2 className="company-name project-name" style={{ whiteSpace: "normal" }}><KineticText>{project.title}</KineticText></h2>
              <div className="project-statement scene-statement">{project.statement}</div>
              <div className="company-copy project-copy"><h3>PROYECTO {project.number}</h3><div className="company-story">{project.paragraphs.map((paragraph, index) => <p className="story-step" key={paragraph}><span>{String(index + 1).padStart(2, "0")}</span>{paragraph}</p>)}</div></div>
              <div className="term-rail"><span>{project.tags}</span><span aria-hidden="true">{project.tags}</span></div>
            </div>
          </article>
        ))}
      </section>

      <footer id="contacto" className="finale scene-light kinetic-scene" data-kinetic data-audio-scene="finale"><div className="sticky-stage finale-stage"><div className="scene-index dark-index">SIGUIENTE PROYECTO <span>∞</span></div><h2><KineticText>DE LA ESTRATEGIA A LA IMPLEMENTACIÓN.</KineticText></h2><div className="finale-companies">B2W AGENCY · MONARCA / 7 STUDIO · DOCTOR BROWN LABS · TRIDIFECT</div><a className="contact-link" href="mailto:proyectos@cnsrc.com"><span>HABLEMOS DE TU PROYECTO</span><span aria-hidden="true">↗</span></a><div className="footer-line"><span>CNSRC / 2026</span><a href="#top">VOLVER ARRIBA ↑</a></div></div></footer>
    </main>
  );
}
