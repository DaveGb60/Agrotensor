// Polar.sh payment configuration
// Replace POLAR_DONATION_URL with the live checkout link from your Polar dashboard
// once the API key / product is configured.
export const POLAR_DONATION_URL =
  (import.meta.env.VITE_POLAR_DONATION_URL as string | undefined) ||
  'https://polar.sh/';
