const serialize = (req, res, next) => {
  let { rows } = res.data || {};
  let response = [];

  if (!rows) {
    rows = [res.data];
  }

  for (const locker of rows) {
    const data = {};
    data.id = locker.id;
    data.branchId = locker.branch_id;
    data.serialNo = locker.serial_no;
    data.monthlyCharge = locker.monthly_charge;
    data.status = locker.status;

    if (locker.Users) {
      data.users = locker.Users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        govIssueIdType: user.gov_issue_id_type,
        govIssueIdImage: user.gov_issue_id_image,
        fatherName: user.father_name,
        motherName: user.mother_name,
        address: user.address,
        userLocker: user.UserLocker
          ? {
              id: user.UserLocker.id,
              lockerId: user.UserLocker.locker_id,
              userId: user.UserLocker.user_id,
              status: user.UserLocker.status,
            }
          : null,
      }));
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
