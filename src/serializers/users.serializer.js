const serialize = (req, res, next) => {
  let { users } = res.data;
  let response = [];

  if (!users) {
    users = [res.data];
  }

  for (const user of users) {
    const data = {};
    data.id = user.id;
    data.name = user.name;
    data.email = user.email;
    data.contact = user.contact;
    if (user.gov_issue_id_type) data.govIssueIdType = user.gov_issue_id_type;
    if (user.gov_issue_id_image) data.govIssueIdImage = user.gov_issue_id_image;
    data.fatherName = user.father_name;
    data.motherName = user.mother_name;
    data.address = user.address;
    data.createdAt = user.created_at;
    data.updatedAt = user.updated_at;

    if (user.Roles) {
      data.roles = user.Roles.map(role => ({
        id: role.id,
        name: role.name,
        code: role.code,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
      }));
    }

    response.push(data);
  }

  if (!res.data.users) {
    res.data = response[0];
  } else {
    res.data.users = response;
  }

  next();
};

module.exports = {
  serialize,
};
