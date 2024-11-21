const serialize = (req, res, next) => {
  let { policies } = res.data;
  let response = [];

  if (!policies) {
    policies = [res.data];
  }

  for (const policy of policies) {
    const data = {};
    data.id = policy.id;
    data.bankId = policy.bank_id;
    data.accountType = policy.account_type;
    data.initialAmount = policy.initial_amount;
    data.interestRate = policy.interest_rate;
    data.minimumAmount = policy.minimum_amount;
    data.lockInPeriod = policy.lock_in_period;
    data.penaltyFee = policy.penalty_fee;
    data.createdAt = policy.created_at;
    data.updatedAt = policy.updated_at;

    response.push(data);
  }

  if (!res.data.policies) {
    res.data = response[0];
  } else {
    res.data.policies = response;
  }

  next();
};

module.exports = {
  serialize,
};
