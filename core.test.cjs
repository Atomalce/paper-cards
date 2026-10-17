const test = require('node:test');
const assert = require('node:assert/strict');
const {validateCards: validate, filterCards: filter} = require('./core.js');
const card = (overrides={}) => ({id:'one', question:' What is recall? ', answer:' Try first. ', known:false, ...overrides});
test('trims copies without modifying input', () => {
  const original=[Object.freeze(card())]; Object.freeze(original);
  const actual=validate(original); assert.equal(actual[0].question,'What is recall?');
  assert.equal(actual[0].answer,'Try first.'); assert.notEqual(actual[0],original[0]);
  assert.equal(original[0].question,' What is recall? ');
});
test('Unicode character limits and empty content', () => {
  assert.equal(validate([card({question:'😀'.repeat(200),answer:'字'.repeat(2000)})]).length,1);
  for(const patch of [{question:'😀'.repeat(201)},{answer:'字'.repeat(2001)},{question:'  '},{answer:'\n'}]) assert.throws(()=>validate([card(patch)]));
});
test('strict schema, including inherited field names', () => {
  for(const value of [null,{},[null],[[]],[card({known:1})],[card({question:4})],[card({toString:'extra'})],[card({constructor:'extra'})],[JSON.parse('{"id":"a","question":"q","answer":"a","known":false,"__proto__":{}}')]]) assert.throws(()=>validate(value));
});
test('unique IDs, safe special IDs and length limits', () => {
  assert.throws(()=>validate([card(),card()]));
  assert.equal(validate([card({id:'__proto__'}),card({id:'constructor'})]).length,2);
  assert.throws(()=>validate([card({id:''})])); assert.throws(()=>validate([card({id:'a'.repeat(81)})]));
});
test('capacity allows 500 and rejects 501 atomically', () => {
  const cards=Array.from({length:500},(_,i)=>card({id:String(i)})); assert.equal(validate(cards).length,500);
  assert.throws(()=>validate([...cards,card()])); assert.equal(cards.length,500); assert.deepEqual(validate([]),[]);
});
test('filters both sides case-insensitively and rejects bad mode', () => {
  const cards=validate([card(),card({id:'two',question:'different',answer:'RECALL',known:true})]);
  assert.equal(filter(cards,'all','recall').length,2); assert.deepEqual(filter(cards,'new','RECALL'),[cards[0]]);
  assert.deepEqual(filter(cards,'known','recall'),[cards[1]]); assert.deepEqual(filter(cards,'all','absent'),[]);
  assert.throws(()=>filter(cards,'broken','')); assert.equal(cards.length,2);
});
