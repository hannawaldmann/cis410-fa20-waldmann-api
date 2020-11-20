const bcrypt = require('bcryptjs')

var hashedPassword = bcrypt.hashSync('asdfasdf')

console.log(hashedPassword)

var hashTest = bcrypt.compareSync('asdfasdf', hashedPassword)

console.log(hashTest)

//asdfasdf = LDKJAIjlfakjweJk - cant go back