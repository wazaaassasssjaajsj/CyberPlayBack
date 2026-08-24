# Generador de Sensibilidad — Publicar en GitHub Pages

## Archivos de este repo

- `index.html` — estructura de la página
- `style.css` — todos los estilos, incluyendo el fondo
- `script.js` — toda la lógica (login + generador)
- `logo.png` — **subilo vos**, es la imagen de fondo (ver abajo)

Los tres primeros ya están listos. Solo tenés que subir tu propia
imagen `logo.png` para que aparezca de fondo.

## Paso a paso para publicar

1. Andá a **github.com** y creá una cuenta (si no tenés).
2. Arriba a la derecha, click en el **+** → **New repository**.
3. Nombre del repositorio: por ejemplo `sensibilidad-freefire`.
   - Dejalo en **Public** (los repos privados no tienen Pages gratis).
   - Click en **Create repository**.
4. Dentro del repo, click en **Add file → Upload files**.
5. Arrastrá los 4 archivos juntos: `index.html`, `style.css`,
   `script.js`, y tu imagen renombrada exactamente a `logo.png`.
   - Importante: los 4 van sueltos en la raíz del repo, no dentro
     de una carpeta.
6. Click en **Commit changes**.
7. Andá a la pestaña **Settings** del repositorio → en el menú de la
   izquierda buscá **Pages**.
8. En "Build and deployment" → **Source**, elegí **Deploy from a branch**.
9. En "Branch" elegí `main` y la carpeta `/ (root)` → **Save**.
10. Esperá 1-2 minutos. GitHub te va a mostrar un link tipo:
    `https://tu-usuario.github.io/sensibilidad-freefire/`
    Ese es el link que le compartís a la gente.

## Sobre la imagen de fondo (logo.png)

- Tiene que llamarse **exactamente** `logo.png` (todo en minúscula)
  y estar en la misma carpeta que `style.css`.
- Formato PNG o JPG (si es JPG, en `style.css` cambiá `logo.png`
  por `logo.jpg` en la línea que dice `url('logo.png')`).
- Ideal: imagen apaisada (más ancha que alta), buena resolución,
  porque cubre toda la pantalla de fondo.
- Si no subís ninguna imagen, no pasa nada: la página se ve igual
  pero con fondo de color sólido en vez de la imagen.

## Sobre el login

El usuario y contraseña están puestos en `script.js`. Es un filtro
simple para que no cualquiera entre de curioso, **no es una
protección real**: cualquiera que abra "Ver código fuente" en el
navegador (o directamente abra `script.js` desde el repo) puede
verlos. No lo uses para proteger algo que necesite seguridad de
verdad (pagos, datos sensibles).

Si en el futuro querés algo más serio (login por cliente, cobrar
antes de dar acceso), eso ya necesita un servidor de verdad —
GitHub Pages no lo soporta porque solo sirve archivos estáticos.
En ese momento se puede migrar a un servicio con capa gratuita
como Vercel o Netlify con funciones serverless.

## Cómo cambiar el usuario/contraseña

Abrí `script.js`, buscá estas dos líneas cerca del principio y
cambiá los valores:

```js
const USUARIO_VALIDO = "PedritoElMasRiko";
const CLAVE_VALIDA = "Pedrito_2026";
```

Guardá el archivo y volvé a subirlo a GitHub (Add file → Upload
files, reemplazando el anterior) para que el cambio se vea online.
