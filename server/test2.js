const fs = require('fs');
const p = require('pdf-parse');

async function test() {
  let log = '';
  const append = (msg) => { log += msg + '\n'; console.log(msg); };

  append('Export: ' + typeof p);
  append('Keys: ' + JSON.stringify(Object.keys(p)));
  if (typeof p === 'function') append('It is a function');
  else append('It is NOT a function');

  try {
    let fn = typeof p === 'function' ? p : (p.PDFParse || p.default || p);
    let buf = fs.readFileSync('test_invoice.pdf');
    append('Trying as function...');
    try {
      let res = await fn(buf);
      append('Success (fn): ' + (res.text ? res.text.substring(0, 50) : 'no text'));
    } catch(e) {
      append('Error as function: ' + e.message);
      if (e.message && e.message.includes('without \'new\'')) {
        append('Trying with new...');
        let res2 = await (new fn(buf));
        append('Success (new): ' + (res2.text ? res2.text.substring(0, 50) : 'no text? keys: ' + Object.keys(res2).join(',')));
      }
    }
  } catch(e) {
    append('Outer Err: ' + e);
  }
  fs.writeFileSync('test_out2.txt', log, 'utf8');
}
test();
