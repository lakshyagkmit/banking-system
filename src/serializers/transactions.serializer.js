const serialize = (req, res, next) => {
  let { rows } = res.data || {};
  let response = [];

  // Ensure rows is an array
  if (!rows) {
    rows = [res.data];
  }

  for (const transaction of rows) {
    const data = {};
    data.id = transaction.id;
    data.acountId = transaction.account_id;
    if (transaction.account_no) data.accountNo = transaction.account_no;
    data.type = transaction.type;
    data.paymentMethod = transaction.payment_method;
    data.amount = transaction.amount;
    data.fee = transaction.fee;
    data.balanceBefore = transaction.balance_before;
    data.balanceAfter = transaction.balance_after;
    data.status = transaction.status;

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
