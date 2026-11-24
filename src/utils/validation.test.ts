import {isValidPhoneNumber} from './validation';
test('international candidates can use international phone numbers',()=>{expect(isValidPhoneNumber('+49 151 23456789')).toBe(true);expect(isValidPhoneNumber('05321234567')).toBe(true);expect(isValidPhoneNumber('+90 532 1234567')).toBe(true);expect(isValidPhoneNumber('+000')).toBe(false);expect(isValidPhoneNumber('abc')).toBe(false);});
