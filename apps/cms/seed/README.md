// seed/README.md

# Arabiq CMS Seed Data

This folder contains all seed data and scripts for populating the Arabiq Strapi CMS.

## Quick Start

```bash
# Install dependencies
npm install

# Run seeder (upsert mode - safe to run multiple times)
SEED_TOKEN=your_api_token npm run seed

# Run seeder in fresh mode (deletes all data first)
SEED_TOKEN=your_api_token npm run seed:fresh