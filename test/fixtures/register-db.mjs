import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='./db.js'&&context.parentURL?.endsWith('/server/index.js'))return {url:new URL('./memory-db.mjs',import.meta.url).href,shortCircuit:true};return next(specifier,context)}});
