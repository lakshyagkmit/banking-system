function generateAccountNumber() {
  const fixedPart = '2530012';
  const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
  return fixedPart + randomPart;
}

module.exports = { generateAccountNumber };
