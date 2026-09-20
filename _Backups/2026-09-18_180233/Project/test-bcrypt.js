const bcrypt = require("bcryptjs");

const password = "Admin@123";

const hash = "$2b$10$BEYs6MvmalCgjwavBcIJm.hC8Ystu7wVjH5GowaU5NjaKGk8Bsrx.";

console.log("Password:", password);
console.log("Hash:", hash);

bcrypt.compare(password, hash).then((result) => {
    console.log("PASSWORD MATCH:", result);
});