This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


./manage.sh start          # Start CMS (with build), wait healthy, start Web
./manage.sh start cms      # Start only CMS (runs build.sh, installs deps)
./manage.sh start web      # Start only Web (installs deps)

./manage.sh stop           # Stop all
./manage.sh stop cms       # Stop only CMS

./manage.sh restart        # Full restart all
./manage.sh restart web    # Restart only Web

./manage.sh clean          # Stop all + remove builds + node_modules
./manage.sh clean cms      # Clean only CMS

./manage.sh logs cms -f    # Follow CMS logs
./manage.sh logs web 200   # Last 200 lines Web logs

./manage.sh doctor         # Full diagnostic
./manage.sh seed           # Run seeder (CMS must be running)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
