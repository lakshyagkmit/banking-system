const serialize = (req, res, next) => {
  let { lockers } = res.data || {};
  let response = [];

  if (!lockers) {
    lockers = [res.data];
  }

  for (const locker of lockers) {
    const data = {};
    data.id = locker.id;
    data.branchId = locker.branch_id;
    data.serialNo = locker.serial_no;
    data.monthlyCharge = locker.monthly_charge;
    data.status = locker.status;
    data.createdAt = locker.created_at;
    data.updatedAt = locker.updated_at;

    if (locker.Branch) {
      data.branch = {
        ifscCode: locker.Branch.ifsc_code,
      };
    }

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
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        userLocker: user.UserLocker
          ? {
              id: user.UserLocker.id,
              lockerId: user.UserLocker.locker_id,
              userId: user.UserLocker.user_id,
              status: user.UserLocker.status,
              createdAt: user.UserLocker.created_at,
              updatedAt: user.UserLocker.updated_at,
            }
          : null,
      }));
    }

    response.push(data);
  }

  if (!res.data.lockers) {
    res.data = response[0];
  } else {
    res.data.lockers = response;
  }

  next();
};

module.exports = {
  serialize,
};
