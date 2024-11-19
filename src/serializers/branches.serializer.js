const serialize = (req, res, next) => {
  let { rows } = res.data;
  let response = [];

  if (!rows) {
    rows = [res.data];
  }

  for (const branch of rows) {
    const data = {};
    data.id = branch.id;
    data.bankId = branch.bank_id;
    data.userId = branch.user_id;
    data.address = branch.address;
    data.ifscCode = branch.ifsc_code;
    data.contact = branch.contact;
    data.totalLockers = branch.total_lockers;

    response.push(data);
  }

  if (!res.data.rows) {
    res.data = response[0];
  } else {
    res.data.rows = response;
  }

  next();
};

module.exports = {
  serialize,
};
