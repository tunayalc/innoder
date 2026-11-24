import {documentProgress} from './documentProgress';
import type {Application} from '../types';
const application=(patch:Partial<Application>={})=>({status:'application_stage',program:{checklist:[{documentType:'identity'},{documentType:'boarding_pass_return'}]},documents:[],...patch} as Application);
test('missing uploads are included in the denominator; later-stage documents are not',()=>{
  expect(documentProgress(application())).toMatchObject({total:1,approved:0,uploaded:0,missing:['identity']});
  expect(documentProgress(application({status:'erasmus_stage'})).total).toBe(2);
});
test('extra files and historical approvals cannot inflate required-document progress',()=>{
  const result=documentProgress(application({documents:[{id:'1',type:'identity',status:'ok',isCurrent:false},{id:'2',type:'identity',status:'unread',isCurrent:true},{id:'3',type:'extra',status:'ok',isCurrent:true}] as Application['documents']}));
  expect(result).toMatchObject({total:1,approved:0,uploaded:1,missing:[]});
});
test('a legacy boarding pass never completes both new travel requirements',()=>{
  const result=documentProgress(application({status:'returned_home',program:{checklist:[{documentType:'boarding_pass'}]} as Application['program'],documents:[{id:'legacy',type:'boarding_pass',status:'ok'}] as Application['documents']}));
  expect(result.total).toBe(2);expect(result.approved).toBe(0);
});
