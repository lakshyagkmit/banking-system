const serialize = (req, res, next) => {
  let { accounts } = res.data || {};
  let response = [];

  if (!accounts) {
    accounts = [res.data];
  }

  for (const account of accounts) {
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
    data.createdAt = account.created_at;
    data.updatedAt = account.updated_at;

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
        createdAt: account.User.created_at,
        updatedAt: account.User.updated_at,
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
        createdAt: account.Branch.created_at,
        updatedAt: account.Branch.updated_at,
      };
    }

    response.push(data);
  }

  if (!res.data.accounts) {
    res.data = response[0];
  } else {
    res.data.accounts = response;
  }

  next();
};

module.exports = {
  serialize,
};
