# Sistema Económico - Funcionalidades Implementadas

## 🎢 Montañas Rusas (MR-1, MR-2, MR-3, MR-4, MR-5)

### ✅ MR-1: Ingresos por Excitement
- **Implementado**: ✅
- **Funcionalidad**: Las montañas rusas generan ingresos base proporcionales a su nivel de excitement
- **Fórmula**: `Ingreso Base = Excitement × 2` (rango: $2-20)

### ✅ MR-2: Decaimiento Temporal 
- **Implementado**: ✅
- **Funcionalidad**: Los ingresos disminuyen con el tiempo desde la construcción
- **Fórmula**: 
  - Decay cada 30 segundos: -5%
  - Mínimo: 50% del ingreso original
  - `Factor = max(0.5, 1.0 - (intervalos_30s × 0.05))`

### ✅ MR-3: Clasificación de Casillas Construidas
- **Implementado**: ✅
- **Tipos definidos**: 
  - `SHOP`: Tiendas
  - `RESTROOM`: Aseos
  - `ATTRACTION`: Otras atracciones
  - `PATH`: Caminos (preparado para futuro)
  - `DECORATION`: Decoraciones (preparado para futuro)

### ✅ MR-4: Detector de Casillas Adyacentes
- **Implementado**: ✅
- **Funcionalidad**: Escanea un radio de 1 casilla alrededor de la atracción
- **Método**: `scanAdjacentTiles()` - cuenta tipos únicos de estructuras

### ✅ MR-5: Bonus por Diversidad de Entorno
- **Implementado**: ✅
- **Sistema progresivo**:
  - 2 tipos diferentes: +$3
  - 3 tipos diferentes: +$6
  - 4+ tipos diferentes: +$10

---

## 🚻 Aseos (AS-1, AS-2, AS-3)

### ✅ AS-1: Proximidad a Tiendas
- **Implementado**: ✅
- **Funcionalidad**: Detecta aseos dentro de radio de 3 casillas de tiendas
- **Método**: `isRestroomNearShop()`

### ✅ AS-2: Proximidad a Montañas Rusas
- **Implementado**: ✅
- **Funcionalidad**: Detecta aseos dentro de radio de 3 casillas de atracciones
- **Método**: `isRestroomNearAttraction()`
- **Especial**: Considera toda el área 2×2 de las atracciones

### ✅ AS-3: Bonus por Doble Proximidad
- **Implementado**: ✅
- **Funcionalidad**: Bonus solo si el aseo está cerca de AMBOS: tienda Y atracción
- **Fórmula**:
  - Ingreso base: $2
  - Bonus doble proximidad: +$8
  - **Total máximo**: $10

---

## 📊 Información en UI

### Panel de Debug Actualizado
- Muestra bonus de diversidad en atracciones
- Indica estado de proximidad en aseos
- Totales de ingresos por tick

### Log de Eventos
- Mensajes detallados con breakdown de ingresos
- Información de decay temporal
- Notificaciones de bonus aplicados

---

## 🎮 Cómo Funciona en el Juego

1. **Construye montañas rusas**: Generan ingresos base por excitement
2. **Coloca estructuras alrededor**: Tiendas, aseos cerca de atracciones
3. **Observa el bonus de diversidad**: Más variedad = más ingresos
4. **Gestiona el tiempo**: Las atracciones pierden atractivo con el tiempo
5. **Posiciona aseos estratégicamente**: Entre tiendas y atracciones para máximo beneficio

---

## 🔧 Configuración Técnica

### Parámetros Ajustables
- `EXCITEMENT_MULTIPLIER`: 2 (en `calculateAttractionIncome`)
- `DECAY_INTERVAL`: 30 segundos
- `DECAY_RATE`: 5% por intervalo
- `MIN_DECAY_FACTOR`: 50%
- `PROXIMITY_RADIUS`: 3 casillas
- `DIVERSITY_BONUSES`: [0, 0, 3, 6, 10]

### Arquitectura
- **EconomyManager**: Centraliza toda la lógica económica
- **Polimorfismo**: Cada entidad maneja su propio `tick()`
- **Separation of Concerns**: UI, lógica de negocio y visualización separadas