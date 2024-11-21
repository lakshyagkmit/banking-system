const serialize = (req, res, next) => {
  let { branches } = res.data;
  let response = [];

  if (!branches) {
    branches = [res.data];
  }

  for (const branch of branches) {
    const data = {};
    data.id = branch.id;
    data.bankId = branch.bank_id;
    data.userId = branch.user_id;
    data.address = branch.address;
    data.ifscCode = branch.ifsc_code;
    data.contact = branch.contact;
    data.totalLockers = branch.total_lockers;
    data.createdAt = branch.created_at;
    data.updatedAt = branch.updated_at;

    response.push(data);
  }

  if (!res.data.branches) {
    res.data = response[0];
  } else {
    res.data.branches = response;
  }

  next();
};

module.exports = {
  serialize,
};
