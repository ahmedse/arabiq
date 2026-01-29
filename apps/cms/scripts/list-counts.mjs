#!/usr/bin/env node
import Strapi from '@strapi/strapi';
(async ()=>{
  const strapi = await Strapi().load();
  const apis = require('fs').readdirSync('./src/api').filter(d=>require('fs').statSync(`./src/api/${d}`).isDirectory());
  for(const api of apis){
    const uid = `api::${api}.${api}`;
    try{
      const items = await strapi.entityService.findMany(uid, {limit:1, start:0});
      console.log(`${uid}: sample=${items.length}`);
    }catch(e){
      // ignore
    }
  }
  await strapi.destroy();
})();