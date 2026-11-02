# Design System & Technical Specification: ESPN Sports Portal

Documentación y guía de diseño (`design.md`) basada en la maqueta de referencia (`paggg.jpg`). Diseñada para desarrolladores frontend (Tailwind CSS, HTML/CSS o React/Next.js).

---

## 1. Identidad Visual y Concepto General

- **Estilo**: Portal editorial deportivo de alto impacto (*editorial sports UI*).
- **Sensación visual**: Dinámica, enérgica, limpia, moderna y con fuerte contraste.
- **Elementos clave**:
  - Encabezados tipográficos bicolores y apilados en 2 líneas (*stacked headers*).
  - Bloques de color planos e intensos (Rojo Deportivo vibrante).
  - Tarjetas flotantes limpias con esquinas redondeadas y sombras sutiles.
  - Efectos visuales de recorte de atletas (*cutout athletes*) superpuestos en fondos en blanco y negro / escala de grises.

---

## 2. Paleta de Colores (Color Palette)

| Nombre del Color | Hex Code | Tailwind Equivalent | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Primary Red (Rojo ESPN)** | `#E53935` | `red-600` | Botones primarios, acento de títulos, sección Match Schedule, overlay de video |
| **Primary Red Hover** | `#C62828` | `red-700` | Estados hover de botones y enlaces activos |
| **Light Red Background** | `#FFEBEE` | `red-50` | Badges, fondos de acento sutil |
| **Pure White** | `#FFFFFF` | `white` | Fondo general, tarjetas, texto sobre fondo rojo |
| **Off-White / Light Gray** | `#F5F7FA` | `slate-50` / `gray-50` | Fondo del footer y secciones alternadas |
| **Card Border Light** | `#E5E7EB` | `gray-200` | Bordes sutiles de tarjetas y contenedores |
| **Text Dark (Headings)** | `#111827` | `gray-900` | Títulos principales, nombres de partidos |
| **Text Body / Neutral** | `#4B5563` | `gray-600` | Párrafos y descripciones |
| **Text Muted / Metadata** | `#9CA3AF` | `gray-400` | Horas, estadios, links del footer |
| **Social / Icon Dark** | `#374151` | `gray-700` | Iconos sociales en el footer |

---

## 3. Tipografía (Typography)

- **Familia principal recomendada**: Sans-serif geométrica / grotesca de lectura rápida:
  - `Inter`, `Montserrat`, `Roboto` o `Poppins`.
  - Fallback: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.

### Jerarquía de Texto:

| Nivel | Tamaño | Peso | Line Height | Color | Ejemplo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `42px` - `48px` (`3rem`) | Bold (700/800) | `1.15` | `#E53935` | *"Hazard magic has Chelsea sitting pretty"* |
| **Section Titles (Stacked)** | `32px` - `36px` (`2.25rem`) | Bold (800) | `1.1` | `#FFFFFF` o `#E53935` | *"Match\nSchedule"*, *"Latest\nNews"* |
| **Card Heading (News)** | `15px` - `16px` (`1rem`) | SemiBold (600) | `1.35` | `#111827` | *"Frenkie de Jong on leaving Ajax..."* |
| **Match Title** | `15px` (`0.95rem`) | Bold (700) | `1.3` | `#111827` | *"Liverpool v Manchester City"* |
| **Body / Parágrafos** | `14px` - `15px` | Regular (400) | `1.6` | `#4B5563` | Texto descriptivo |
| **Metadata / Badges** | `11px` - `12px` | Medium/Bold (500/700) | `1.2` | `#9CA3AF` / `#FFFFFF` | Horas, torneos, estadios |

---

## 4. Componentes y Botones (Components & Buttons)

### 4.1. Botones Principales

1. **Botón Ghost Rojo ("Read More")**:
   - **Borde**: `1.5px` sólido `#E53935`.
   - **Fondo**: Transparente.
   - **Color de texto**: `#E53935`.
   - **Border-radius**: `6px` a `8px` (`rounded-md`).
   - **Padding**: `10px 28px` (`py-2.5 px-7`).
   - **Hover**: Fondo `#E53935`, texto `#FFFFFF`, transición `200ms ease`.

2. **Botón Ghost Blanco ("More" en Match Schedule)**:
   - **Borde**: `1.5px` sólido `#FFFFFF`.
   - **Fondo**: Transparente.
   - **Color de texto**: `#FFFFFF`.
   - **Border-radius**: `6px` a `8px`.
   - **Padding**: `8px 24px`.
   - **Hover**: Fondo `#FFFFFF`, texto `#E53935`.

3. **Botón Circular de Acción ("Preview" + Flecha)**:
   - Enlace de texto "Preview" (`13px`, semi-bold, `#4B5563` o `#E53935`).
   - Círculo de `26px` de diámetro: fondo `#E53935`, icono de flecha hacia la derecha `->` en color blanco.

4. **Tag / Pill Badge ("HOT")**:
   - **Border-radius**: `9999px` (`rounded-full`).
   - **Fondo**: `#E53935`.
   - **Texto**: Blanco, `11px`, `font-bold`, uppercase, tracking `wide`.
   - **Padding**: `4px 14px`.

5. **Botón Play de Video**:
   - Círculo blanco o semi-transparente con icono de triángulo "Play".
   - Acompañado de texto "Play Video" y enlace al origen (`www.youtube.com`).

---

## 5. Estructura de Secciones (Layout & Sections)

```
+--------------------------------------------------------------------------+
|  HEADER: [ ESPN Logo ]   [ Football | NBA | NFL | Tennis | Golf ... ] [Q] [User] |
+--------------------------------------------------------------------------+
|  HERO SECTION:                                                           |
|  [ Player Cutout (Hazard) ]          [ Headline (Rojo) ]                 |
|  [ Fondo B&W Estadio + Dots ]        [ Bajada editorial ]                |
|                                      [ Botón: "Read More" ]              |
|                                      [ Carrusel de 3 fotos secundarias ] |
+--------------------------------------------------------------------------+
|  MATCH SCHEDULE (Fondo Rojo #E53935):                                   |
|  [ Match Schedule  ]    [ Card Partido 1 ]  [ Card Partido 2 ] [ Card 3] |
|  [ Descrip. + More ]    [ Escudo vs Escudo] [ Escudo vs Escudo] ...      |
+--------------------------------------------------------------------------+
|  LATEST NEWS:                                                            |
|  [ Latest News ]        [ Filtros Tabs: (HOT) | Trending | Fresh | ... ] |
|  [ Card Noticia 1 ]     [ Card Noticia 2 ]  [ Card Noticia 3 ] [ Card 4] |
+--------------------------------------------------------------------------+
|  FEATURED VIDEO (Fondo Rojo Duotone con multitud):                       |
|  [ Video Principal + Play ]         | [ Featured Video Header ]          |
|  [ Titular + Youtube ]              | [ Thumb 1 ] [ Thumb 2 ] [ Thumb 3] |
+--------------------------------------------------------------------------+
|  FOOTER (Fondo Gris Claro #F5F7FA):                                      |
|  [ ESPN Logo ]    [ Columnas legales ]    [ Follow ESPN + Iconos redes ] |
|                   [ Copyright 2019 ESPN Enterprises, Inc. ]              |
+--------------------------------------------------------------------------+
```

### Detalle por Sección:

### A. Navbar
- **Altura**: `72px`.
- **Fondo**: Blanco (`#FFFFFF`).
- **Navegación central**:
  - Elementos con espaciado horizontal (`gap-8`).
  - Item activo (`Football`): texto `#111827`, línea indicadora inferior roja (`border-b-2 border-[#E53935]`).
  - Items inactivos: texto `#6B7280`, hover a `#111827`.
- **Acciones derecha**:
  - Icono de búsqueda (`Search`) e icono de perfil (`User`) en trazo fino `20px`.

### B. Hero Section
- **Grid**: 2 columnas (12 columnas: `5 cols` jugador, `7 cols` contenido).
- **Lado Izquierdo**:
  - Fondo del estadio en blanco y negro (desaturado) para dar profundidad.
  - Jugador recortado a todo color superpuesto sobresaliendo del marco.
  - Indicador de slider en la esquina inferior izquierda: 3 puntos (1 blanco activo, 2 translúcidos).
- **Lado Derecho**:
  - Titular en rojo `#E53935`, `text-4xl` a `text-5xl`.
  - Párrafo descriptivo con `line-height: 1.6`.
  - Botón `"Read More"`.
  - Mosaico/carrusel de 3 fotos apiladas con perspectiva o fila flotante (`border-radius: 12px`, sombras suaves).

### C. Match Schedule (Franja Roja)
- **Fondo**: Color plano rojo vibrante `#E53935`.
- **Lado Izquierdo (1/4 del ancho)**:
  - Título blanco en 2 líneas: `Match` (arriba), `Schedule` (abajo).
  - Párrafo en texto blanco al 85% de opacidad.
  - Botón outline blanco `"More"`.
- **Lado Derecho (3/4 del ancho)**:
  - Grid de 3 tarjetas de partidos (`grid-cols-3` en desktop, scroll horizontal en mobile).
  - **Estilo de la tarjeta**:
    - Fondo blanco puro `#FFFFFF`, `border-radius: 16px`.
    - Padding interno: `24px`.
    - Parte superior: Dos escudos de clubes enfrentados (ancho máx. `48px` cada uno).
    - Titular: Nombre del enfrentamiento (ej. `Liverpool v Manchester City`).
    - Subtítulo: Nombre de la competición (ej. `English Premier League`).
    - Metadatos: Estadio, fecha y hora (ej. `Enfield Stadium, Sunday, 10 Mei 2019 03.45 PM`).
    - Pie de tarjeta: Enlace `"Preview"` alineado a la izquierda con flecha circular roja a la derecha.

### D. Latest News
- **Cabecera de sección**:
  - Lado izquierdo: Título apilado en rojo `#E53935` (`Latest\nNews`).
  - Lado derecho: Barra de pestañas redondeada (*segmented control pill*):
    - Pestañas: `HOT` (activa, roja con subrayado), `Trending`, `Fresh`, `...`.
    - Contenedor con borde `#E5E7EB` y fondo blanco.
- **Grilla de noticias**:
  - 4 columnas (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`, `gap-6`).
  - **Tarjeta de noticia**:
    - Imagen superior: `aspect-ratio: 4/3`, `object-cover`, esquinas redondeadas superiores `12px`.
    - Contenedor de texto: Fondo `#F9FAFB` o blanco, `padding: 16px`.
    - Titular: 2 a 3 líneas con `font-semibold`, corte limpio.
    - Badge: Botón píldora `"HOT"` en la parte inferior izquierda.

### E. Featured Video
- **Fondo**: Imagen de fondo del público/estadio con filtro de fusión rojo (duotone / `mix-blend-multiply` con `#E53935`).
- **Encabezado**: Título a la derecha en texto blanco apilado: `Featured\nVideo`.
- **Estructura**:
  - **Video Destacado (Hero Video)**: Imagen grande con botón flotante circular de Play, título `"Liverpool clobber Norwich in EPL opener"` y enlace `www.youtube.com`.
  - **Carrusel de videos secundarios**: Miniaturas rectangulares con esquinas redondeadas, titular en texto blanco inferior y enlace al canal.

### F. Footer
- **Fondo**: `#F3F4F6` (gris muy claro y limpio).
- **Padding**: `60px 0 30px`.
- **Distribución**:
  - Logo ESPN en negro/gris oscuro a la izquierda.
  - 2 columnas de enlaces legales y privacidad (`text-xs text-gray-500`).
  - Columna derecha: Título `"Follow ESPN"` con 5 iconos de redes sociales circulares (Instagram, Snapchat, Facebook, Twitter, YouTube).
  - Línea inferior: Copyright centrado `© 2019 ESPN Enterprises, Inc. All rights reserved.`.

---

## 6. Configuración de Tailwind CSS (Tailwind Config Snippet)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        espn: {
          red: '#E53935',
          'red-dark': '#C62828',
          'red-light': '#FFEBEE',
          dark: '#111827',
          gray: '#4B5563',
          'gray-light': '#F5F7FA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
        'badge': '9999px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
      }
    }
  }
}
```

---

## 7. Clases y Tokens Clave para Maquetar Rápido

- **Botón Read More**:
  `inline-flex items-center justify-center px-7 py-2.5 border-2 border-[#E53935] text-[#E53935] font-semibold text-sm rounded-md hover:bg-[#E53935] hover:text-white transition duration-200`

- **Botón More (Match Schedule)**:
  `inline-flex items-center justify-center px-6 py-2 border border-white text-white font-semibold text-sm rounded-md hover:bg-white hover:text-[#E53935] transition duration-200`

- **Badge HOT**:
  `inline-block px-3.5 py-1 bg-[#E53935] text-white text-xs font-bold rounded-full uppercase tracking-wider`

- **Tarjeta Match Schedule**:
  `bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between`

- **Tabs Filter Bar**:
  `inline-flex items-center gap-6 px-6 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium`

---

## 8. Recomendaciones de Responsive Design

1. **Desktop (> 1024px)**: Grillas completas de 3 a 4 columnas tal como se ve en la imagen.
2. **Tablet (768px - 1023px)**:
   - Match Schedule pasa a 2 columnas con scroll lateral suave.
   - Latest News pasa a 2 columnas x 2 filas.
3. **Mobile (< 768px)**:
   - Navegación se colapsa a menú hamburguesa.
   - El Hero apila la imagen del jugador arriba y el contenido editorial abajo.
   - Match Schedule y Featured Video implementan scroll horizontal deslizable (*snap slider*).
