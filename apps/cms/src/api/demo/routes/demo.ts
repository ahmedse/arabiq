import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::demo.demo', {
  config: {
    findOne: {
      policies: ['api::demo.check-demo-access'],
    },
  },
});
