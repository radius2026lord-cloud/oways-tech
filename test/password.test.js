import {test} from 'node:test';import assert from 'node:assert/strict';import {hashPassword,verifyPassword} from '../server/password.js';
test('admin passwords use salted hashes and reject wrong passwords',async()=>{const p='correct-admin-password';const a=await hashPassword(p),b=await hashPassword(p);assert.notEqual(a,b);assert.equal(await verifyPassword(p,a),true);assert.equal(await verifyPassword('wrong-password',a),false);assert.equal(await verifyPassword(undefined,a),false);await assert.rejects(hashPassword('short'))});

test('admin password minimum is six characters',async()=>{const p='abc123',h=await hashPassword(p);assert.equal(await verifyPassword(p,h),true);await assert.rejects(hashPassword('abc12'))});
