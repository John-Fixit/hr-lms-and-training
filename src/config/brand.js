/**
 * Organisation branding — the single place to switch between tenants.
 *
 * Select a brand with the `VITE_BRAND` env variable (e.g. `VITE_BRAND=ncaa`
 * in `.env.local`). Defaults to Argon when unset or unknown.
 */

const BRANDS = {
  argon: {
    key: "argon",
    shortName: "Argon",
    name: "Argon",
    address: "",
    logo: "/assets/images/argon-logo.png",
    favicon: "/assets/images/argon-logo.png",
    // The Argon logo is a wordmark, so the name beside it would be redundant.
    showNameWithLogo: false,
  },
  ncaa: {
    key: "ncaa",
    shortName: "NCAA",
    name: "Nigerian Civil Aviation Authority",
    address: "Ikeja-Lagos",
    logo: "/assets/images/NCAA.png",
    favicon: "/NCAA.png",
    showNameWithLogo: true,
  },
};

const DEFAULT_BRAND = "argon";

const selected = String(import.meta.env.VITE_BRAND || DEFAULT_BRAND).toLowerCase();

export const brand = BRANDS[selected] ?? BRANDS[DEFAULT_BRAND];

/** Points the document's favicon at the active brand. */
export function applyBrandFavicon() {
  let icon = document.querySelector("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = brand.favicon;
}
