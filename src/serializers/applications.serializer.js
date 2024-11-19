const serialize = (req, res, next) => {
  let { rows } = res.data || {};
  let response = [];

  if (!rows) {
    rows = [res.data];
  }

  for (const account of rows) {
    const data = {};
    data.id = account.id;
    data.userId = account.user_id;
    data.branchIfscCode = account.branch_ifsc_code;
    data.type = account.type;
    data.nomineeName = account.nominee_name;

    if (account.User) {
      data.user = {
        id: account.User.id,
        name: account.User.name,
        email: account.User.email,
        contact: account.User.contact,
        govIssueIdType: account.User.gov_issue_id_type,
        govIssueIdImage: account.User.gov_issue_id_image,
        fatherName: account.User.father_name,
        motherName: account.User.mother_name,
        address: account.User.address,
      };
    }

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
