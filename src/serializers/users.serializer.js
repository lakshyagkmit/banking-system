const serialize = (req, res, next) => {
  let { rows } = res.data;
  let response = [];

  if (!rows) {
    rows = [res.data];
  }

  for (const user of rows) {
    const data = {};
    data.id = user.id;
    data.name = user.name;
    data.email = user.email;
    data.contact = user.contact;
    data.govIssueIdType = user.gov_issue_id_type;
    data.govIssueIdImage = user.gov_issue_id_image;
    data.fatherName = user.father_name;
    data.motherName = user.mother_name;
    data.address = user.address;

    if (user.Roles) {
      data.roles = user.Roles.map(role => ({
        id: role.id,
        name: role.name,
        code: role.code,
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
