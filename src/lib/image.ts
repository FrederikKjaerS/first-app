/** Warm paper placeholder with a pot icon, for recipes added without a photo. */
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
  <rect width="160" height="100" fill="#ede4cf"/>
  <text x="80" y="62" font-size="40" text-anchor="middle">🍲</text>
</svg>`;

export const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export const recipeImageSrc = (image: string): string =>
  image.trim() !== "" ? image : PLACEHOLDER_IMAGE;
