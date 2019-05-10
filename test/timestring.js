const timestring = require("timestring");

const cloneDate = d => new Date(d.getTime());

const args = process.argv.slice(2).join("");
const date = new Date(1557398505572);

const dateAfter = cloneDate(date);
dateAfter.setSeconds(date.getSeconds() + timestring(args));

console.log("before", date.toGMTString());
console.log("after",  dateAfter.toGMTString());

