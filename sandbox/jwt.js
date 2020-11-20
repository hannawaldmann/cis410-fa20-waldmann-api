const jwt = require('jsonwebtoken');

let myToken = jwt.sign({pk: 123}, "secretPassword", {expiresIn: '60 minutes'})

console.log('my token', myToken)

let myDecoded = jwt.verify(myToken, 'secretPassword');
console.log('my decode', myDecoded)