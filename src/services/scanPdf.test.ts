import {createScanPdf} from './scanPdf';
import BlobUtil from 'react-native-blob-util';
import {generatePDF} from 'react-native-html-to-pdf';
jest.mock('react-native-blob-util',()=>({__esModule:true,default:{fs:{readFile:jest.fn(async(path:string)=>path.includes('first')?'FIRST_PAGE':'SECOND_PAGE'),stat:jest.fn(async()=>({size:1200}))}}}));
jest.mock('react-native-html-to-pdf',()=>({generatePDF:jest.fn(async()=>({filePath:'/tmp/scanned.pdf'}))}));
beforeEach(()=>jest.clearAllMocks());
test('every captured page is included in the PDF in the selected order',async()=>{
  const result=await createScanPdf([{uri:'file:///second.jpg'},{uri:'file:///first.jpg'}]);
  const html=jest.mocked(generatePDF).mock.calls[0][0].html;
  expect(html.indexOf('SECOND_PAGE')).toBeLessThan(html.indexOf('FIRST_PAGE'));
  expect((html.match(/<section>/g)||[])).toHaveLength(2);expect(result.size).toBe(1200);
  expect(BlobUtil.fs.readFile).toHaveBeenCalledTimes(2);
});
test('empty scans and more than twenty pages cannot silently create a partial PDF',async()=>{
  await expect(createScanPdf([])).rejects.toThrow();await expect(createScanPdf(Array.from({length:21},()=>({uri:'file:///first.jpg'})))).rejects.toThrow();expect(generatePDF).not.toHaveBeenCalled();
});
