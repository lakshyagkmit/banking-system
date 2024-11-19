const serialize = (req, res, next) => {
  let { rows } = res.data || {};
  let response = [];

  // Ensure rows is an array
  if (!rows) {
    rows = [res.data];
  }

  for (const account of rows) {
    const data = {};
    data.id = account.id;
    data.policyId = account.policy_id;
    data.branchId = account.branch_id;
    data.userId = account.user_id;
    data.type = account.type;
    data.number = account.number;
    data.balance = account.balance;
    data.nominee = account.nominee;

    if (account.installment_amount) data.installmentAmount = account.installment_amount;
    if (account.principle_amount) data.principleAmount = account.principle_amount;
    if (account.maturity_date) data.maturityDate = account.maturity_date;
    data.status = account.status;

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

    if (account.Branch) {
      data.branch = {
        id: account.Branch.id,
        bankId: account.Branch.bank_id,
        userId: account.Branch.user_id,
        address: account.Branch.address,
        ifscCode: account.Branch.ifsc_code,
        contact: account.Branch.contact,
        totalLockers: account.Branch.total_lockers,
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
