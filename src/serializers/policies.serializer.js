const serialize = (req, res, next) => {
  let { rows } = res.data;
  let response = [];

  if (!rows) {
    rows = [res.data];
  }

  for (const policy of rows) {
    const data = {};
    data.id = policy.id;
    data.bankId = policy.bank_id;
    data.accountType = policy.account_type;
    data.initialAmount = policy.initial_amount;
    data.interestRate = policy.interest_rate;
    data.minimumAmount = policy.minimum_amount;
    data.lockInPeriod = policy.lock_in_period;
    data.penaltyFee = policy.penalty_fee;

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
