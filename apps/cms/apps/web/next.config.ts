import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  images: {
    // Avoid dev-time /_next/image 400s when the optimizer can't load local assets.
    // If you want optimization, install `sharp` in apps/web and remove this.
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
