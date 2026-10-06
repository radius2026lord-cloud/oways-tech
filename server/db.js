import mysql from 'mysql2/promise';
export const pool=mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'oways_tech',connectionLimit:8,timezone:'Z',supportBigNumbers:true,bigNumberStrings:true});
export async function rows(sql,args=[],db=pool){return (await db.execute(sql,args))[0]}
export async function transaction(fn){const db=await pool.getConnection();try{await db.beginTransaction();const out=await fn(db);await db.commit();return out}catch(e){await db.rollback();throw e}finally{db.release()}}
