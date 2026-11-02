# DESIGN.md: Fulbo Tracker 2026 (Editorial Sports Telemetry & Broadcast Sheet)

## Reading & Dials
Reading this as: tracker personal y match center de fútbol 5 para un grupo de amigos, con dirección de arte `editorial-tech` + `tech-green-dark-mode-modern` (transmisión nocturna de estadio y planilla táctica de vestuario), dial ENERGY 3 / RHYTHM 3 / MOTION 2.

Dial: ENERGY 3 / RHYTHM 3 / MOTION 2

## Skills de diseño aplicadas
- `build-awwwards-quality-sites`: Dirección de arte integral, secuencia de entrada con GSAP, texto dividido accesible (`aria-label` íntegro + palabras con `aria-hidden="true"`), único motor de smooth-scroll (Lenis + ScrollTrigger) y escena Three.js con propósito táctico y limpieza completa de recursos.
- `editorial-tech`: Composición editorial asimétrica, titulares condensados de gran escala, bandas de telemetría con índices monoespaciados y líneas estructurales de 1 px.
- `tech-green-dark-mode-modern`: Superficies negro-verdosas mate (`#0B0F0C` / `#131A15`), señales esmeralda (`#22C55E`) acotadas al foco activo y marcadores de esquina tipo instrumento (`corner brackets`).
- `solar-duotone-bold`: Iconografía unificada con Iconify Solar Duotone Bold (`@iconify-json/solar` embebido offline), siempre acompañada de etiqueta de texto.

## Tesis visual, Hero, Motion y Three.js
- **Tesis visual:** Planilla táctica de vestuario cruzada con gráfica de transmisión nocturna de copa. Cada pantalla combina titulares de impacto (`Barlow Condensed`), telemetría tabular (`JetBrains Mono`) y marcos técnicos con esquinas marcadas.
- **Activo focal del Hero (Three.js + Shader WebGL):** `TacticalPitchCanvas` renderiza en el bloque `Camino del Mundial` una cancha nocturna en perspectiva con iluminación de reflectores y los 5 nodos de fase (`Grupos · 8vos · 4tos · Semi · Final`), destacando la instancia activa y respondiendo de forma aditiva al puntero. Incluye póster estático de respaldo cuando hay `prefers-reduced-motion: reduce` o ausencia de WebGL, limita `devicePixelRatio` a 1,75, se pausa fuera de pantalla o con pestaña oculta y libera geometrías, materiales y renderer al desmontar.
- **Narrativa de movimiento y motor de scroll:** `Lenis` como único motor de smooth-scroll sincronizado con `GSAP` y `ScrollTrigger`. Secuencia de introducción en el Hero (titular revelado palabra por palabra mediante máscara accesible, progreso de 5 fases en cascada y telemetría) y aparición progresiva por sección. Bajo `prefers-reduced-motion: reduce`, Lenis se desactiva y todos los elementos se muestran directamente en su estado final.
- **Plan de procedencia de activos (Asset Provenance):**
  - **Compañeros:** Los 30 jugadores (`Agustín`, `Signo`, `Conra`, `Mica ❤`, etc.) son amigos reales de `FUTBOL 2026.xlsx` sin fotografías provistas. Para cumplir `antislop` (R-18, R-23, R-38) y `build-awwwards-quality-sites` (no presentar retratos generados como personas reales ni avatares circulares genéricos), cada compañero se representa mediante una **ficha táctica de dorsal** (`#01` a `#30` + nombre).
  - **Iconografía:** Conjunto cerrado de 10 símbolos de `@iconify-json/solar` (estilo `bold-duotone`), inlined en el bundle sin peticiones externas.
  - **Tipografía:** `@fontsource/barlow`, `@fontsource/barlow-condensed` y `@fontsource/jetbrains-mono` autohospedadas e integradas en `dist/index.html`.

## Paleta y Sistema Semántico de Color (`/impeccable colorize`, verificado con `contrast-check.py`)
Todos los pares cumplen WCAG AA (4,5:1 texto normal, 3,0:1 texto grande y bordes interactivos) y aplican superficies y textos secundarios teñidos del mismo matiz (`--*-surface` y `--*-muted`) en lugar de gris neutro sobre fondos cromáticos:
- `--bg`: `#0B0F0C` (negro césped nocturno)
- `--surface`: `#131A15` (superficie principal de paneles y tarjetas)
- `--surface-2`: `#1B241E` (hover, campos de formulario, drawer)
- `--line`: `#2A352D` (divisores estructurales internos `divide-x`/`divide-y` de 1 px)
- `--line-strong`: `#67776C` (bordes de inputs, fichas tácticas, botones secundarios y pistas; 3,36:1 sobre `--surface-2`)
- `--text`: `#E9F0EA` (16,65:1 sobre `--bg`, 13,75:1 sobre `--surface-2`)
- `--text-muted`: `#9AA89F` (7,79:1 sobre `--bg`, 7,14:1 sobre `--surface`, 6,43:1 sobre `--surface-2`)
- **Rol 1: Victoria y Foco Activo (`Emerald`):**
  - `--win`: `#22C55E` (8,47:1 sobre `--bg`, 7,77:1 sobre `--surface`, 7,24:1 sobre `--win-surface`)
  - `--on-win`: `#052E16` (6,54:1 sobre `--win`)
  - `--win-surface`: `#0F2316` (superficie de victoria y sinergia sólida)
  - `--win-muted`: `#BBF7D0` (texto secundario teñido de verde sobre `--win-surface`; 13,62:1)
- **Rol 2: Gloria, Instancia Final y Élite (`Championship Gold`):**
  - `--gold`: `#EAB308` (10,07:1 sobre `--bg`, 9,23:1 sobre `--surface`, 8,76:1 sobre `--gold-surface`)
  - `--on-gold`: `#1C1400` (9,53:1 sobre `--gold`)
  - `--gold-surface`: `#221D0D` (superficie para la Final del Mundialito, Talismán, Invicto y rachas de 3+ victorias)
  - `--gold-muted`: `#FEF08A` (texto secundario teñido de oro sobre `--gold-surface`; 14,44:1)
- **Rol 3: Paridad, Empate y Disputa (`Warm Amber`):**
  - `--draw`: `#F59E0B` (8,24:1 sobre `--surface`, 7,92:1 sobre `--draw-surface`)
  - `--on-draw`: `#1F1200` (8,54:1 sobre `--draw`)
  - `--draw-surface`: `#231B0E` (superficie para empates en Torneo Mixto y efectividad en disputa 45 % a 59,9 %)
  - `--draw-muted`: `#FDE68A` (texto secundario teñido de ámbar sobre `--draw-surface`; 13,66:1)
- **Rol 4: Derrota, Alerta y Mufa (`Elimination Crimson`):**
  - `--loss`: `#F87171` (5,76:1 sobre `--surface-2`, 6,40:1 sobre `--loss-surface`)
  - `--on-loss`: `#1F0707` (6,95:1 sobre `--loss`)
  - `--loss-surface`: `#261315` (superficie para derrotas, insignia Mufa y alertas de validación)
  - `--loss-muted`: `#FECACA` (texto secundario teñido de carmesí sobre `--loss-surface`; 12,23:1)

## Tipografía, radios y escala
- **Titulares y cifras principales:** `Barlow Condensed` 600/700 con `font-variant-numeric: tabular-nums`.
- **Cuerpo e interfaz:** `Barlow` 400/500 (15 px en mobile, 16 px en desktop).
- **Telemetría, índices y montos:** `JetBrains Mono` 400/500 con `tabular-nums`.
- **Radios:** `4px` en fichas tácticas e insignias, `8px` en tarjetas e inputs, `12px` en paneles principales y modal.
- **Espaciado:** escala `4 / 8 / 12 / 16 / 24 / 40 / 64 px`.

## Razones de una línea (R-31)
- **Color:** El fondo `#0B0F0C` evita el encandilamiento nocturno post-partido y reserva el verde `#22C55E` para victorias, foco de campaña y acción de carga.
- **Layout:** Composición asimétrica (`RHYTHM 3`) donde el Hero combina el lienzo táctico 3D y el `PhaseTrack` de campaña a todo ancho, seguido de un split editorial 5/7 para el medidor de rendimiento y la matriz de campañas/sinergia.
- **Tipografía:** `Barlow Condensed` aporta voz de marcador de estadio en titulares, `Barlow` asegura lectura clara en controles y `JetBrains Mono` alinea códigos de partido (`#022`), fechas e importes.
- **Espaciado:** Los saltos de 40 a 64 px separan capítulos editoriales (`01 // CAMPAÑA`, `02 // TELEMETRÍA`, `03 // HISTORIAL & QUÍMICA`), mientras que 12 a 16 px agrupan datos dentro de cada tarjeta.
- **Tarjetas:** Marcos técnicos con esquinas marcadas (`corner brackets`) y columna lateral de resultado (`V / D / E`) para lectura inmediata sin depender únicamente del color.
- **Íconos:** Se usa Solar Duotone Bold (`@iconify-json/solar`) para dar peso visual coherente con la tipografía condensada, siempre acompañado de etiqueta de texto.
- **Movimiento:** GSAP + Lenis + ScrollTrigger (`MOTION 2`) guían la lectura inicial del estado de campaña y revelan secciones al desplazarse, desactivándose por completo bajo `prefers-reduced-motion: reduce`.

## 20 UX Laws (Principios Rectores)
1. **Aesthetic-Usability Effect**: Proporciones armónicas y acabado visual de alta gama para transmitir solidez y confianza.
2. **Hick's Law**: Menor fatiga de decisión con filtros agrupados, valores por defecto sensatos y flujos guiados.
3. **Fitts's Law**: Blancos táctiles amplios (mínimo 44x44px en móviles) y ubicados en áreas de fácil alcance del pulgar.
4. **Jakob's Law**: Convenciones universales para navegación, buscadores, modales y tablas de posiciones.
5. **Miller's Law**: Fragmentación de información densa en bloques digeribles de 5 a 9 elementos.
6. **Doherty Threshold**: Respuestas interactivas por debajo de 400ms (optimistic UI y microinteracciones de resorte).
7. **Law of Proximity**: Espaciado consistente para agrupar controles y métricas que pertenecen al mismo contexto.
8. **Law of Similarity**: Elementos con idéntica función comparten el mismo lenguaje visual (botones, badges y tags).
9. **Law of Common Region**: Delimitación clara mediante contenedores, bordes de 1px y paneles para aislar entidades.
10. **Visual Hierarchy**: Guía visual estricta mediante escalas tipográficas, pesos y contraste semántico.
11. **Progressive Disclosure**: Información esencial en primer plano; detalles avanzados accesibles a demanda.
12. **Recognition over Recall**: Hacer visibles las acciones, opciones y estados para no forzar la memoria del usuario.
13. **Von Restorff Effect**: Resaltar de forma inequívoca el elemento protagónico (CTA primario, trofeo o fase activa).
14. **Peak-End Rule**: Experiencias de clímax gratificantes (campeonatos, copas ganadas) y estados de cierre ordenados.
15. **Goal-Gradient Effect**: Indicadores claros de progreso hacia la meta (bracket del torneo, paridad táctica, medidores).
16. **Serial Position Effect**: Anclar los elementos y acciones cruciales en los extremos de barras y listas.
17. **Tesler's Law**: Absorber la complejidad en el algoritmo (balanceador de equipos, paridad) y no en el usuario.
18. **Postel's Law**: Flexibilidad con los datos ingresados por el usuario y rigor en la persistencia del sistema.
19. **Occam's Razor**: Diseños sencillos y limpios sin ruido decorativo prescindible.
20. **Feedback Loops**: Confirmación visual o táctil inmediata ante cada acción (toasts, estados de carga, microanimaciones).

