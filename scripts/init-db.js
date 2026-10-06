import mysql from 'mysql2/promise';import {readFile} from 'node:fs/promises';
if(process.env.DB_NAME!=='oways_tech')throw Error('Initial schema database must be oways_tech.');
const db=await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
try{await db.query(await readFile(new URL('../database/001_initial_schema.sql',import.meta.url),'utf8'));console.log('Oways Tech schema created.')}finally{await db.end()}
