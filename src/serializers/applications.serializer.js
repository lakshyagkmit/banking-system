const serialize = (req, res, next) => {
  let { applications } = res.data || {};
  let response = [];

  if (!applications) {
    applications = [res.data];
  }

  for (const application of applications) {
    const data = {};
    data.id = application.id;
    data.userId = application.user_id;
    data.branchIfscCode = application.branch_ifsc_code;
    data.type = application.type;
    data.nomineeName = application.nominee_name;
    data.createdAt = application.created_at;
    data.updatedAt = application.updated_at;

    if (application.User) {
      data.user = {
        id: application.User.id,
        name: application.User.name,
        email: application.User.email,
        contact: application.User.contact,
        govIssueIdType: application.User.gov_issue_id_type,
        govIssueIdImage: application.User.gov_issue_id_image,
        fatherName: application.User.father_name,
        motherName: application.User.mother_name,
        address: application.User.address,
        createdAt: application.created_at,
        updatedAt: application.updated_at,
      };
    }

    response.push(data);
  }

  if (!res.data.applications) {
    res.data = response[0];
  } else {
    res.data.applications = response;
  }

  next();
};

module.exports = {
  serialize,
};
