# Contexto del Proyecto: Calendario Escolar (Antigravity)

Este archivo sirve como punto de control y memoria para que tanto el usuario como el agente de IA sepan exactamente en qué estado se encuentra el proyecto al retomar el trabajo desde otro equipo.

## 📌 Resumen de la Aplicación
Es una aplicación web construida con Next.js (React), Tailwind CSS y TypeScript, utilizando Supabase como base de datos en tiempo real. Su objetivo es gestionar el calendario escolar de un centro educativo, permitiendo la reserva de excursiones/salidas, visualizar festivos, efemérides, evaluaciones y días bloqueados por la dirección (Vicedirector).

## ✅ Lo que hemos hecho en la última sesión (Completado)
1. **Limpieza de datos estáticos (Hardcoded):** Se eliminaron los bucles que cargaban festivos de Navidad, Semana Santa y Carnavales por defecto en código. Ahora TODO el calendario se limpia o alimenta desde el panel de Admin (a través del Excel o inserción manual).
2. **Corrección de Colores y Filtros:** 
   - Se le asignó el color **índigo (violeta)** a "Días Relevantes" para diferenciarlo de "Efemérides" (ámbar).
   - Se arregló el filtro de "Evaluación" con una búsqueda de subcadenas resiliente (ahora detecta "Sesión de evaluación", "Sesiones", "Evaluaciones", etc.).
3. **Página de Impresión (PDF):** Se ajustaron los estilos (`break-words`, `overflow-hidden`, reducción de tamaño de fuente) para que los textos largos no se salgan de las casillas al guardar en PDF desde el panel de Admin.
4. **Pantallas de Carga (Loading States):** Añadimos un "spinner" de carga en `Calendar`, `YearlyCalendar` y `TodayDetails` para evitar parpadeos visuales al recuperar datos de Supabase.
5. **Responsividad en Móviles (Pestaña Reservar):** Replicamos el sistema moderno de unidades `cqi` y `aspect-square` de la pestaña Inicio a la pestaña Reservas (`Calendar.tsx`). Ahora los botones son perfectamente cuadrados en móviles y el texto se ajusta automáticamente.
6. **Reservas Multidía y Múltiples:**
   - **Formulario (`Calendar.tsx`):** Ahora se pueden seleccionar múltiples fechas haciendo clic en varios días a la vez antes de enviar la reserva (crea múltiples registros en base de datos en bucle).
   - **Vista (`YearlyCalendar.tsx`):** Se agrupó la lógica para que si hay 2 o más salidas en un mismo día, se listen todas en la casilla (ej: `1º ESO, 2º ESO`) y al pulsar se abre un modal con el detalle de todas, en vez de sobrescribirse.

## 🚧 Tareas Pendientes (Para hacer a continuación)
1. **Envío de Resumen por Correo (Texto Claro):**
   - El usuario solicitó mantener el botón de imprimir PDF actual, pero añadir **un nuevo botón** en el panel de Admin que envíe la información de todas las reservas al correo del vicedirector en **formato de texto estructurado y ordenado**, ideal para lectura rápida en móviles.
2. **Cambiar el Correo Destinatario:**
   - Asegurarnos de que el correo del vicedirector se pueda cambiar fácilmente.

## 📁 Archivos Clave del Proyecto
- `src/components/YearlyCalendar.tsx`: Vista principal de "Inicio". Muestra todo el año y la agrupación de eventos.
- `src/components/Calendar.tsx`: Pestaña de "Reservar". Contiene el formulario y la lógica de selección de días.
- `src/app/admin/page.tsx` y `src/components/AdminCalendar.tsx`: Panel del vicedirector para gestionar días bloqueados y limpiar base de datos.
- `src/store/store.ts`: Gestor global del estado y conexión con Supabase (donde están `addReservation`, `getReservations`, `getSettings`, etc.).
- `src/app/print/page.tsx`: Vista dedicada exclusivamente a generar el PDF.

---
**Instrucción para el agente de IA:** Al leer este archivo, utiliza esta información como contexto base para continuar con el desarrollo y prioriza las tareas pendientes mencionadas.
