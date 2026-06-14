# Geografía Interactiva

Aplicación de quiz geográfico con Vue 3 (Composition API), Pinia y mapas interactivos.

## Stack

- Vue 3 + TypeScript + Vite
- Pinia para estado global
- Vue Router para navegación
- `d3-geo` y `topojson-client` para futuros mapas interactivos

## Módulos previstos

### España
- Comunidades autónomas
- Capitales de provincia

### Europa
- Países europeos
- Capitales europeas

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run test:unit    # Tests unitarios
npm run format       # Formatear código
npm run type-check   # Verificación de tipos
npm run lint         # Linter
```

## Estructura

```
src/
├── components/
│   ├── layout/       # Cabecera y layout
│   ├── maps/         # Componentes de mapa (pendiente)
│   └── quiz/         # Tarjetas y UI de quiz
├── router/           # Rutas de la aplicación
├── stores/           # Stores de Pinia
├── types/            # Tipos y categorías de quiz
└── views/            # Vistas y hubs de ejercicios
```

Los ejercicios con mapas interactivos se implementarán en una fase posterior.
