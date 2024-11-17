const transactionService = require('../services/transactions.service');
const commonHelper = require('../helpers/commonFunctions.helper');

async function create(req, res) {
  try {
    const { params, body, user } = req;
    const transaction = await transactionService.create(params, body, user);
    res.status(201).json(transaction);
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
}

const get = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { query, user } = req;

    const transactions = await transactionService.getTransactions(accountId, query, user);

    return res.status(200).json({
      transactions,
    });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

const getById = async (req, res) => {
  try {
    const { accountId, transactionId } = req.params;
    const { user } = req;

    const transaction = await transactionService.getTransactionById(accountId, transactionId, user);

    return res.status(200).json({
      transaction,
    });
  } catch (error) {
    commonHelper.customErrorHandler(req, res, error.message, error.statusCode, error);
  }
};

module.exports = { create, get, getById };
