const serialize = (req, res, next) => {
  let { transactions } = res.data || {};
  let response = [];

  if (!transactions) {
    transactions = [res.data];
  }

  for (const transaction of transactions) {
    const data = {};
    data.id = transaction.id;
    data.accountId = transaction.account_id;
    if (transaction.account_no) data.accountNo = transaction.account_no;
    data.type = transaction.type;
    data.paymentMethod = transaction.payment_method;
    data.amount = transaction.amount;
    data.fee = transaction.fee;
    data.balanceBefore = transaction.balance_before;
    data.balanceAfter = transaction.balance_after;
    data.status = transaction.status;
    data.createdAt = transaction.created_at;
    data.updatedAt = transaction.updated_at;

    response.push(data);
  }

  if (!res.data.transactions) {
    res.data = response[0];
  } else {
    res.data.transactions = response;
  }

  next();
};

module.exports = {
  serialize,
};
